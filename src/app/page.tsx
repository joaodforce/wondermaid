import { Suspense } from 'react';
import { LeaderboardSection, LeaderboardSkeleton } from '@/components/leaderboard-section';
import { LeaderboardSyncProvider } from '@/components/leaderboard-sync';
import { UidForm } from '@/components/uid-form';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 md:py-16">
      <header className="text-center">
        <h1 className="bg-gradient-to-r from-amber-300 via-amber-100 to-amber-500 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
          Noelle Mains Leaderboard
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Noelle builds ranked by expected damage in her current meta teams, calculated from your Enka.Network
          showcase.
        </p>
      </header>

      <LeaderboardSyncProvider>
        <div className="mx-auto w-full max-w-2xl">
          <UidForm />
        </div>
        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardSection />
        </Suspense>
      </LeaderboardSyncProvider>

      <footer className="mt-auto border-t border-slate-800 pt-6 text-xs leading-relaxed text-slate-500">
        Damage is the crit-averaged damage of one hit against a level 100 enemy with 10% base RES. Every build is
        evaluated as C6 Noelle with burst level 13 (135% DEF to ATK) and identical attack talents, so only weapon,
        artifacts and stats decide the ranking. Data from{' '}
        <a href="https://enka.network" className="underline hover:text-slate-300" target="_blank" rel="noreferrer">
          Enka.Network
        </a>
        .
      </footer>
    </main>
  );
}
