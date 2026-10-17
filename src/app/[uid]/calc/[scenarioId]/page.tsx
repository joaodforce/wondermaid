import { ArrowLeft, MessageSquareText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { BuffsPanel, CharacterSheetPanel, FormulaPanel, LEGEND, Value } from '@/components/calc/damage-explanation';
import { DISCORD_URL } from '@/components/discord-link';
import { LocalTime } from '@/components/local-time';
import { TeamComposition } from '@/components/team-composition';
import { VersionBadge } from '@/components/version-badge';
import { formatNumber } from '@/lib/format';
import { getDamageExplanation } from '@/modules/leaderboard/services';
import { scenarioIdSchema, uidSchema } from '@/modules/leaderboard/validation';

// Shared by generateMetadata and the page within one request
const loadExplanation = cache(async (uid: string, scenarioId: string) => {
  if (!uidSchema.safeParse(uid).success || !scenarioIdSchema.safeParse(scenarioId).success) return null;
  return getDamageExplanation(uid, scenarioId);
});

export async function generateMetadata({ params }: PageProps<'/[uid]/calc/[scenarioId]'>): Promise<Metadata> {
  const { uid, scenarioId } = await params;
  const page = await loadExplanation(uid, scenarioId);
  if (!page) return { title: 'Calculation not found · Noelle Mains Leaderboard' };
  return {
    title: `${page.nickname} · ${page.scenario.name} damage breakdown · Noelle Mains Leaderboard`,
    description: `How ${page.nickname}'s Noelle reaches ${formatNumber(page.explanation.finalDamage)} damage in ${page.scenario.name}, step by step.`,
  };
}

export default function DamageBreakdownPage({ params }: PageProps<'/[uid]/calc/[scenarioId]'>) {
  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
        <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-2xl bg-ink/80" aria-hidden />}>
          {params.then(({ uid, scenarioId }) => (
            <Breakdown uid={uid} scenarioId={scenarioId} />
          ))}
        </Suspense>
      </main>
      <VersionBadge />
    </div>
  );
}

async function Breakdown({ uid, scenarioId }: { uid: string; scenarioId: string }) {
  const page = await loadExplanation(uid, scenarioId);
  if (!page) notFound();
  const { explanation, scenario } = page;

  return (
    <>
      <Link
        href={`/${uid}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink/80 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {page.nickname}&apos;s build
      </Link>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">Damage breakdown</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">{scenario.name}</h1>
          <p className="mt-1 text-sm text-ink/75">
            {page.nickname} · UID <span className="font-mono">{uid}</span> · build from{' '}
            <LocalTime iso={page.updatedAt} />
          </p>
        </div>
        <div className="sm:text-right">
          <p className="font-mono text-4xl font-black text-ink">{formatNumber(explanation.finalDamage)}</p>
          {page.rank > 0 && (
            <p className="text-sm text-ink/75">
              Rank #{page.rank} of {page.total}
            </p>
          )}
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30">
        <p className="px-5 pt-4 text-sm text-stone-300">{scenario.description}</p>
        <TeamComposition scenario={scenario} />
        <ul className="flex flex-wrap gap-2 px-5 py-4 text-xs text-stone-400" aria-label="Colour legend">
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

      <section className="flex flex-col items-start gap-3 rounded-2xl border border-black/30 bg-ink p-5 text-sm text-stone-300 shadow-2xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-stone-100">Spot something off?</p>
          <p className="mt-0.5 text-stone-400">
            These are the exact numbers the leaderboard uses. Share a correction or a tweak with the community and
            we&apos;ll update the formulas.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-300">Team configuration</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-stone-300">
              {JSON.stringify({ attackType: scenario.attackType, weapon: scenario.weapon, team: page.team }, null, 2)}
            </pre>
          </details>
        </div>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#5865F2] px-4 font-semibold text-white hover:bg-[#4752c4]"
        >
          <MessageSquareText className="h-4 w-4" aria-hidden />
          Suggest a tweak
        </a>
      </section>
    </>
  );
}
