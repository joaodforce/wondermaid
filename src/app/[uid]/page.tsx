import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { ArtifactCard } from '@/components/build/artifact-card';
import { CharacterCard } from '@/components/build/character-card';
import { RefreshBuildButton } from '@/components/build/refresh-build-button';
import { ShareActions } from '@/components/build/share-actions';
import { ScenarioResults } from '@/components/build/scenario-results';
import { VersionBadge } from '@/components/version-badge';
import { formatDateTime } from '@/lib/format';
import { getPlayerBuild } from '@/modules/leaderboard/services';

const UID_PATTERN = /^\d{9,10}$/;

// Shared by generateMetadata and the page within one request
const loadPlayerBuild = cache(async (uid: string) => (UID_PATTERN.test(uid) ? getPlayerBuild(uid) : null));

export async function generateMetadata({ params }: PageProps<'/[uid]'>): Promise<Metadata> {
  const { uid } = await params;
  const player = await loadPlayerBuild(uid);
  if (!player) return { title: 'Player not found · Noelle Mains Leaderboard' };
  const card = { url: `/${uid}/card`, width: 1200, height: 630, alt: `${player.nickname}'s Noelle build card` };
  return {
    title: `${player.nickname}'s Noelle · Noelle Mains Leaderboard`,
    description: `${player.nickname}'s Noelle build (UID ${uid}): artifacts, talents, constellations and team rankings.`,
    openGraph: { images: [card] },
    twitter: { card: 'summary_large_image', images: [card] },
  };
}

export default function PlayerPage({ params }: PageProps<'/[uid]'>) {
  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink/80 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Leaderboard
        </Link>
        <Suspense fallback={<PlayerSkeleton />}>
          {params.then(({ uid }) => (
            <PlayerBuild uid={uid} />
          ))}
        </Suspense>
      </main>
      <VersionBadge />
    </div>
  );
}

async function PlayerBuild({ uid }: { uid: string }) {
  const player = await loadPlayerBuild(uid);
  if (!player) notFound();
  const { build } = player;

  return (
    <>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">{player.nickname}</h1>
          <p className="mt-1 text-sm text-ink/75">
            UID <span className="font-mono">{player.uid}</span>
            {player.level != null && <> · AR {player.level}</>} · Updated {formatDateTime(player.updatedAt)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <ShareActions uid={player.uid} nickname={player.nickname} />
          <RefreshBuildButton uid={player.uid} />
        </div>
      </header>

      <CharacterCard build={build} />

      {build.artifacts?.length ? (
        <section aria-label="Artifacts" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {build.artifacts.map((piece) => (
            <ArtifactCard key={piece.slot} piece={piece} />
          ))}
        </section>
      ) : (
        <p className="rounded-2xl border border-black/30 bg-ink/90 p-5 text-sm text-stone-300">
          Artifact details were not saved for this build yet. Update it from Enka to see every piece.
        </p>
      )}

      <ScenarioResults scenarios={player.scenarios} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink">Share card</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- already a sized PNG from /[uid]/card */}
        <img
          src={`/${player.uid}/card?v=${encodeURIComponent(player.updatedAt)}`}
          alt={`${player.nickname}'s Noelle build card`}
          width={1200}
          height={630}
          loading="lazy"
          className="h-auto w-full max-w-3xl rounded-2xl shadow-2xl shadow-black/30"
        />
        <ShareActions uid={player.uid} nickname={player.nickname} />
      </section>
    </>
  );
}

function PlayerSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="h-14 w-72 rounded-lg bg-ink/20" />
      <div className="h-[26rem] rounded-2xl bg-ink/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-ink/80" />
        ))}
      </div>
    </div>
  );
}
