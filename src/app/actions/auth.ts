'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { endSession, startSession } from '@/modules/auth/session';
import { AuthError, loginUser, registerUser } from '@/modules/auth/services';
import { loginSchema, registerSchema } from '@/modules/auth/validation';

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<'username' | 'password', string[]>>;
  username?: string;
}

// Only same-site paths, so the form can't be used as an open redirect
// (browsers treat "//host" and "/\host" as other sites)
const safeNext = (value: FormDataEntryValue | null) =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : '/account';

async function authenticate(
  formData: FormData,
  schema: typeof loginSchema | typeof registerSchema,
  run: (username: string, password: string) => Promise<{ id: string }>,
): Promise<AuthFormState> {
  const username = String(formData.get('username') ?? '');
  const parsed = schema.safeParse({ username, password: formData.get('password') });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, username };

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
  return authenticate(formData, registerSchema, registerUser);
}

export async function loginAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return authenticate(formData, loginSchema, loginUser);
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/');
}
