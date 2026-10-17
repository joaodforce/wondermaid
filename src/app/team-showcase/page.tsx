import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { TeamTable } from '@/components/team/team-table';
import { VersionBadge } from '@/components/version-badge';
import { getTeamLeaderboard } from '@/modules/team/services';

export const metadata: Metadata = {
  title: 'Team Showcase · Noelle Mains Leaderboard',
  description: "Noelle teams ranked with every teammate's real build: constellations, talents, weapons and artifact sets.",
};

export default function TeamShowcasePage({ searchParams }: PageProps<'/team-showcase'>) {
  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">Team Showcase</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">Your whole team, ranked</h1>
            <p className="mt-3 text-ink/80">
              Unlike the main leaderboard, nothing here is standardized: Noelle&apos;s real constellation, talents and
              weapon count, and every teammate buffs her with their actual build. Link your game account, pick three
              supports from your showcase and submit.
            </p>
          </div>
          <Link
            href="/team-showcase/submit"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-ink px-5 font-semibold text-stone-100 shadow-lg shadow-black/20 hover:bg-black"
          >
            Submit your team
          </Link>
        </header>

        <section className="overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30">
          <Suspense fallback={<div className="h-80 animate-pulse" aria-hidden />}>
            {searchParams.then(({ highlight }) => (
              <Board highlightUid={typeof highlight === 'string' ? highlight : undefined} />
            ))}
          </Suspense>
        </section>

        <p className="text-xs leading-relaxed text-ink/70">
          Damage is Noelle&apos;s crit-averaged hit (N4, or a plunge in Xianyun teams) against a level 100 enemy, with
          the attack talent standardized like the main leaderboard. Teammates whose own kit isn&apos;t modeled yet still
          count through their artifact set, weapon and element.
        </p>
      </main>
      <VersionBadge />
    </div>
  );
}

async function Board({ highlightUid }: { highlightUid?: string }) {
  await connection();
  const entries = await getTeamLeaderboard();
  return <TeamTable entries={entries} highlightUid={highlightUid} />;
}
