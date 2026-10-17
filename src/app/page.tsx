import Image from 'next/image';
import { Suspense } from 'react';
import noelleArt from '@/assets/noelle-art.webp';
import { DiscordLink } from '@/components/discord-link';
import { LeaderboardSection, LeaderboardSkeleton } from '@/components/leaderboard-section';
import { LeaderboardSyncProvider } from '@/components/leaderboard-sync';
import { UidForm } from '@/components/uid-form';
import { VersionBadge } from '@/components/version-badge';

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      {/* The art shares the page's olive backdrop (its own was keyed out), so it bleeds off the top/right edges behind the nav */}
      <Image
        src={noelleArt}
        alt="Noelle swinging Redhorn Stonethresher, drawn for the Noelle Mains community"
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 1024px) min(58vw, 880px), 100vw"
        className="art-fade pointer-events-none -mt-14 -mb-24 h-auto w-full max-w-none select-none sm:-mb-48 lg:absolute lg:-top-14 lg:right-0 lg:mt-0 lg:mb-0 lg:w-[min(58vw,880px)]"
      />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-16 sm:px-6 lg:pt-20">
        <LeaderboardSyncProvider>
          <div className="flex max-w-xl flex-col gap-6 lg:min-h-[min(46vw,620px)]">
            <header>
              <p className="text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">Genshin Impact</p>
              <h1 className="mt-2 text-5xl leading-[0.95] font-black tracking-tight text-ink sm:text-6xl">
                Noelle Mains Leaderboard
              </h1>
              <p className="mt-4 max-w-md text-base text-ink/80">
                Noelle builds ranked by expected damage in her current meta teams, calculated from your
                Enka.Network showcase.
              </p>
              <DiscordLink className="mt-5" />
            </header>
            <UidForm />
          </div>
          <Suspense fallback={<LeaderboardSkeleton />}>
            <LeaderboardSection />
          </Suspense>
        </LeaderboardSyncProvider>

        <footer className="mt-auto border-t border-ink/20 pt-6 text-xs leading-relaxed text-ink/70">
          Damage is the crit-averaged damage of one hit against a level 100 enemy with 10% base RES. Every build is
          evaluated as C6 Noelle with burst level 13 (135% DEF to ATK) and identical attack talents, so only weapon,
          artifacts and stats decide the ranking. Data from{' '}
          <a href="https://enka.network" className="underline hover:text-ink" target="_blank" rel="noreferrer">
            Enka.Network
          </a>
          . Noelle illustration drawn for the Noelle Mains community. Not affiliated with HoYoverse.
        </footer>
      </main>

      <VersionBadge />
    </div>
  );
}
