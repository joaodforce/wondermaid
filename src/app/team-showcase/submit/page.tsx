import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { TeamPicker } from '@/components/team/team-picker';
import { getAccountOverview } from '@/modules/accounts/services';
import { getCurrentUser } from '@/modules/auth/session';
import { EnkaError } from '@/modules/enka/types';
import { getShowcaseCharacters, TeamError } from '@/modules/team/services';

export const metadata: Metadata = { title: 'Submit a team · Noelle Mains Leaderboard' };

export default function SubmitTeamPage({ searchParams }: PageProps<'/team-showcase/submit'>) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <header>
        <Link href="/team-showcase" className="text-sm font-medium text-ink/80 hover:text-ink">
          ← Team Showcase
        </Link>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Submit your team</h1>
        <p className="mt-2 text-ink/80">
          Pick three supports from your in-game character showcase to play with Noelle. Their real builds are used.
        </p>
      </header>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-ink/80" aria-hidden />}>
        {searchParams.then(({ uid, fresh }) => (
          <Picker uid={typeof uid === 'string' ? uid : undefined} fresh={fresh === '1'} />
        ))}
      </Suspense>
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-black/30 bg-ink p-5 text-stone-300 shadow-2xl shadow-black/30">
      {children}
    </section>
  );
}

async function Picker({ uid, fresh }: { uid?: string; fresh: boolean }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/team-showcase/submit');

  const { linked } = await getAccountOverview(user.id);
  if (!linked.length) {
    return (
      <Panel>
        <p>Link and verify your Genshin account first, so we know the team is yours.</p>
        <Link href="/account" className="w-fit rounded-lg bg-amber-400 px-4 py-2 font-semibold text-ink hover:bg-amber-300">
          Link my account
        </Link>
      </Panel>
    );
  }

  const account = linked.find((a) => a.uid === uid) ?? linked[0];
  let showcase: Awaited<ReturnType<typeof getShowcaseCharacters>> | null = null;
  let loadError: string | null = null;
  try {
    showcase = await getShowcaseCharacters(user.id, account.uid, { fresh });
  } catch (error) {
    if (!(error instanceof TeamError || error instanceof EnkaError)) throw error;
    loadError = error.message;
  }

  const content: ReactNode = !showcase ? (
    <p className="text-rose-300">{loadError}</p>
  ) : !showcase.hasNoelle ? (
    <p>Noelle isn&apos;t in this account&apos;s character showcase. Add her in-game, then reload.</p>
  ) : showcase.characters.length === 0 ? (
    <p>No other characters are in this showcase. Add your supports in-game, then reload.</p>
  ) : (
    <TeamPicker key={account.uid} uid={account.uid} characters={showcase.characters} />
  );

  return (
    <Panel>
      {linked.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Game account">
          {linked.map((a) => (
            <Link
              key={a.uid}
              href={`/team-showcase/submit?uid=${a.uid}`}
              className={
                a.uid === account.uid
                  ? 'rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-ink'
                  : 'rounded-lg bg-white/10 px-3 py-1.5 text-sm text-stone-200 hover:bg-white/15'
              }
            >
              {a.nickname} · {a.uid}
            </Link>
          ))}
        </nav>
      )}
      {content}
    </Panel>
  );
}
