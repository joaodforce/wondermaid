import type { Metadata } from 'next';
import { Suspense } from 'react';
import { registerAction } from '@/app/actions/auth';
import { AuthCard, AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Create an account · Noelle Mains Leaderboard' };

export default function Page({ searchParams }: PageProps<'/register'>) {
  return (
    <AuthCard title="Create an account" description="Just a username and a password. We don't ask for an email or any personal data.">
      <Suspense>
        {searchParams.then(({ next }) => (
          <AuthForm mode="register" action={registerAction} next={typeof next === 'string' ? next : undefined} />
        ))}
      </Suspense>
    </AuthCard>
  );
}
