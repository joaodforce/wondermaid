'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, type ReactNode } from 'react';
import type { AuthFormState } from '@/app/actions/auth';

const inputClass =
  'h-11 w-full rounded-lg border border-white/15 bg-black/40 px-4 text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 focus:outline-none';

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: 'login' | 'register';
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isRegister = mode === 'register';
  const fieldError = (field: 'username' | 'password') => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-300">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
        Username
        <input
          name="username"
          defaultValue={state.username}
          autoComplete="username"
          autoCapitalize="none"
          required
          autoFocus
          className={inputClass}
        />
        {fieldError('username') && <span className="text-xs text-rose-300">{fieldError('username')}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          className={inputClass}
        />
        {fieldError('password') && <span className="text-xs text-rose-300">{fieldError('password')}</span>}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 font-semibold text-ink hover:bg-amber-300 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {isRegister ? 'Create account' : 'Log in'}
      </button>
      <p className="text-center text-sm text-stone-400">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link
          href={`/${isRegister ? 'login' : 'register'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-medium text-amber-300 hover:underline"
        >
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Link href="/" className="mb-6 text-center text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">
        Noelle Mains Leaderboard
      </Link>
      <div className="rounded-2xl border border-black/30 bg-ink p-6 shadow-2xl shadow-black/30 sm:p-8">
        <h1 className="text-2xl font-black text-stone-50">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-stone-400">{description}</p>
        {children}
      </div>
    </main>
  );
}
