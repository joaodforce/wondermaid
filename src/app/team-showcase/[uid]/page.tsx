import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { BuffsPanel, CharacterSheetPanel, FormulaPanel, LEGEND, Value } from '@/components/calc/damage-explanation';
import { LocalTime } from '@/components/local-time';
import { MemberCard } from '@/components/team/member-card';
import { VersionBadge } from '@/components/version-badge';
import { formatNumber } from '@/lib/format';
import { uidSchema } from '@/modules/leaderboard/validation';
import { getTeamExplanation } from '@/modules/team/services';

const loadTeam = cache(async (uid: string) => (uidSchema.safeParse(uid).success ? getTeamExplanation(uid) : null));

export async function generateMetadata({ params }: PageProps<'/team-showcase/[uid]'>): Promise<Metadata> {
  const team = await loadTeam((await params).uid);
  return {
    title: team ? `${team.nickname}'s team · Team Showcase` : 'Team not found · Team Showcase',
  };
}

export default function TeamBreakdownPage({ params }: PageProps<'/team-showcase/[uid]'>) {
  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
        <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-2xl bg-ink/80" aria-hidden />}>
          {params.then(({ uid }) => (
            <Breakdown uid={uid} />
          ))}
        </Suspense>
      </main>
      <VersionBadge />
    </div>
  );
}

async function Breakdown({ uid }: { uid: string }) {
  const team = await loadTeam(uid);
  if (!team) notFound();
  const { explanation } = team;

  return (
    <>
      <Link href={`/team-showcase?highlight=${uid}`} className="w-fit text-sm font-medium text-ink/80 hover:text-ink">
        ← Team Showcase
      </Link>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">Team breakdown</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">{team.nickname}&apos;s team</h1>
          <p className="mt-1 text-sm text-ink/75">
            UID <span className="font-mono">{uid}</span> · submitted <LocalTime iso={team.submittedAt} />
          </p>
        </div>
        <p className="font-mono text-4xl font-black text-ink">{formatNumber(explanation.finalDamage)}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/30 bg-ink p-5 shadow-2xl shadow-black/30">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {team.party.map((member, index) => (
            <MemberCard key={member.id} build={member} modeled={index === 0 ? undefined : team.effects[index - 1]?.modeled} />
          ))}
        </div>
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Colour legend">
          {LEGEND.map((item) => (
            <li key={item.tone}>
              <Value tone={item.tone}>{item.label}</Value>
            </li>
          ))}
        </ul>
      </section>

      <CharacterSheetPanel explanation={explanation} />
      <BuffsPanel explanation={explanation} />
      <FormulaPanel explanation={explanation} />
    </>
  );
}
