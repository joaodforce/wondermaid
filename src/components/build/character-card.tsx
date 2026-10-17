import { Lock } from 'lucide-react';
import Image from 'next/image';
import noelleArt from '@/assets/noelle-art.webp';
import { formatArtifactSets, formatNumber, formatPercent, formatStatValue, statLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { NOELLE_CONSTELLATIONS, NOELLE_TALENTS, weaponName } from '@/modules/calculator/data';
import type { NoelleBuild, TalentLevel } from '@/modules/calculator/types';
import { critValue } from './artifact-card';
import { EnkaIcon } from './enka-icon';

export function CharacterCard({ build }: { build: NoelleBuild }) {
  const { stats, weapon } = build;
  const totalCritValue = build.artifacts?.reduce((sum, piece) => sum + critValue(piece), 0);

  const statRows = [
    { label: 'Max HP', value: formatNumber(stats.hp) },
    { label: 'ATK', value: formatNumber(stats.atk) },
    { label: 'DEF', value: formatNumber(stats.def), highlight: true },
    { label: 'Elemental Mastery', value: formatNumber(stats.elementalMastery) },
    { label: 'CRIT Rate', value: formatPercent(stats.critRate), highlight: true },
    { label: 'CRIT DMG', value: formatPercent(stats.critDmg), highlight: true },
    { label: 'Energy Recharge', value: formatPercent(stats.energyRecharge) },
    { label: 'Geo DMG Bonus', value: formatPercent(stats.geoDmgBonus), highlight: true },
  ];

  return (
    <section className="grid overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* Portrait with constellations and talents, like an in-game character screen */}
      <div className="relative min-h-[23rem] overflow-hidden bg-olive lg:min-h-[26rem]">
        <Image
          src={noelleArt}
          alt=""
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className="object-cover object-[72%_18%]"
        />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <p className="text-2xl font-black text-white drop-shadow">Noelle</p>
          <p className="text-sm font-medium text-white/85 drop-shadow">
            Lv. {build.level} · C{build.constellation}
          </p>
        </div>

        <ol className="absolute top-20 left-3 flex flex-col gap-1.5" aria-label="Constellations">
          {NOELLE_CONSTELLATIONS.map((constellation, index) => {
            const unlocked = index < build.constellation;
            return (
              <li
                key={constellation.icon}
                title={`C${index + 1} ${constellation.name}${unlocked ? '' : ' (locked)'}`}
                className={cn(
                  'relative grid h-9 w-9 place-items-center rounded-full border bg-ink/80',
                  unlocked ? 'border-amber-300/70' : 'border-white/10',
                )}
              >
                <EnkaIcon icon={constellation.icon} size={28} className={cn(!unlocked && 'opacity-30 grayscale')} />
                {!unlocked && <Lock className="absolute h-3 w-3 text-white/70" aria-hidden />}
              </li>
            );
          })}
        </ol>

        {build.talents && (
          <ul className="absolute right-3 bottom-3 flex gap-2" aria-label="Talents">
            <Talent {...NOELLE_TALENTS.normal} talent={build.talents.normal} />
            <Talent {...NOELLE_TALENTS.skill} talent={build.talents.skill} />
            <Talent {...NOELLE_TALENTS.burst} talent={build.talents.burst} />
          </ul>
        )}
      </div>

      <dl className="divide-y divide-white/5 px-5 py-4 text-sm">
        {statRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2">
            <dt className="text-stone-400">{row.label}</dt>
            <dd className={cn('font-mono', row.highlight ? 'font-semibold text-stone-100' : 'text-stone-300')}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-4 border-t border-white/10 p-5 lg:border-t-0 lg:border-l">
        <div className="flex items-center gap-3">
          {weapon.icon && (
            <div
              className={cn(
                'shrink-0 rounded-lg bg-gradient-to-br p-1',
                weapon.rarity === 5 ? 'from-amber-700 to-amber-500' : 'from-violet-800 to-violet-500',
              )}
            >
              <EnkaIcon icon={weapon.icon} size={64} alt="" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-stone-100">{weaponName(weapon.id)}</p>
            <p className="text-xs text-stone-400">
              Lv. {weapon.level} · <span className="text-amber-300">R{weapon.refinement}</span>
            </p>
            <p className="mt-1 text-xs text-stone-300">
              Base ATK <span className="font-mono">{formatNumber(weapon.baseAtk)}</span>
              {weapon.subStat && (
                <>
                  {' · '}
                  {statLabel(weapon.subStat.type)}{' '}
                  <span className="font-mono">{formatStatValue(weapon.subStat.type, weapon.subStat.value)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Artifact sets</p>
          <p className="mt-1 text-sm text-stone-200">{formatArtifactSets(build.artifactSets)}</p>
        </div>

        {totalCritValue != null && (
          <div className="mt-auto rounded-xl bg-white/5 p-4">
            <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Crit Value</p>
            <p className="font-mono text-3xl font-bold text-amber-300">{totalCritValue.toFixed(1)}</p>
            <p className="text-xs text-stone-500">2 × CRIT Rate + CRIT DMG from artifact substats</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Talent({ name, icon, talent }: { name: string; icon: string; talent: TalentLevel }) {
  return (
    <li title={`${name}: level ${talent.level}${talent.bonus ? ` (+${talent.bonus} from constellations)` : ''}`}>
      <div className="relative grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-ink/85">
        <EnkaIcon icon={icon} size={34} />
        <span
          className={cn(
            'absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[0.7rem] font-bold',
            talent.bonus ? 'bg-sky-400 text-ink' : 'bg-stone-200 text-ink',
          )}
        >
          {talent.level}
        </span>
      </div>
    </li>
  );
}
