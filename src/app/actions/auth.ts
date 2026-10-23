'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { hitIpRateLimit } from '@/lib/rate-limit';
import { endSession, startSession } from '@/modules/auth/session';
import { safeNext } from '@/modules/auth/redirect';
import { AuthError, loginUser, registerUser } from '@/modules/auth/services';
import { loginSchema, registerSchema } from '@/modules/auth/validation';

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<'username' | 'password', string[]>>;
  username?: string;
}

// Per visitor IP: new accounts each hour, and sign-in attempts every 15 minutes (on top of the per-username lock)
const LIMITS = {
  register: { max: 5, windowSeconds: 60 * 60 },
  login: { max: 30, windowSeconds: 15 * 60 },
};
const LIMIT_MESSAGE = 'Too many attempts from your network. Try again later.';

async function authenticate(
  formData: FormData,
  kind: keyof typeof LIMITS,
  schema: typeof loginSchema | typeof registerSchema,
  run: (username: string, password: string) => Promise<{ id: string }>,
): Promise<AuthFormState> {
  const username = String(formData.get('username') ?? '');
  const parsed = schema.safeParse({ username, password: formData.get('password') });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, username };
  const { max, windowSeconds } = LIMITS[kind];
  if (!(await hitIpRateLimit(`auth:${kind}`, max, windowSeconds))) return { error: LIMIT_MESSAGE, username };

  try {
    const user = await run(parsed.data.username, parsed.data.password);
    await startSession(user.id);
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message, username };
    console.error('[auth] request failed:', error);
    return { error: 'Something went wrong. Try again.', username };
  }
  redirect(safeNext(formData.get('next')));
}

export async function registerAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return authenticate(formData, 'register', registerSchema, registerUser);
}

export async function loginAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return authenticate(formData, 'login', loginSchema, loginUser);
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/');
}
