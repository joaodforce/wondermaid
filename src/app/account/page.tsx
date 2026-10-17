import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AddAccountForm, LinkedAccountRow, PendingClaimCard } from '@/components/account/claims';
import { getAccountOverview } from '@/modules/accounts/services';
import { getCurrentUser } from '@/modules/auth/session';

export const metadata: Metadata = { title: 'Your account · Noelle Mains Leaderboard' };

export default function AccountPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-ink/80" aria-hidden />}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account');
  const { linked, pending } = await getAccountOverview(user.id);

  return (
    <>
      <header>
        <p className="text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">Your account</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight text-ink">{user.username}</h1>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/30 bg-ink p-5 shadow-2xl shadow-black/30">
        <div>
          <h2 className="font-semibold text-stone-100">Genshin accounts</h2>
          <p className="mt-0.5 text-sm text-stone-400">
            Link the game accounts you own to submit teams to the Team Showcase. You prove ownership by putting a short
            code in your in-game bio.
          </p>
        </div>

        {linked.length > 0 && (
          <ul className="flex flex-col gap-2">
            {linked.map((account) => (
              <LinkedAccountRow key={account.uid} account={account} />
            ))}
          </ul>
        )}
        {pending.length > 0 && (
          <ul className="flex flex-col gap-2">
            {pending.map((claim) => (
              <PendingClaimCard key={claim.uid} claim={claim} />
            ))}
          </ul>
        )}
        <AddAccountForm />
      </section>
    </>
  );
}
