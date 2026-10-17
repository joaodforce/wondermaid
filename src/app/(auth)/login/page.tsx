import type { Metadata } from 'next';
import { Suspense } from 'react';
import { loginAction } from '@/app/actions/auth';
import { AuthCard, AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Log in · Noelle Mains Leaderboard' };

export default function Page({ searchParams }: PageProps<'/login'>) {
  return (
    <AuthCard title="Log in" description="Welcome back.">
      <Suspense>
        {searchParams.then(({ next }) => (
          <AuthForm mode="login" action={loginAction} next={typeof next === 'string' ? next : undefined} />
        ))}
      </Suspense>
    </AuthCard>
  );
}
