import { TrendingUp } from 'lucide-react';
import { EnkaIcon } from '@/components/build/enka-icon';
import { formatArtifactSets, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { weaponName } from '@/modules/calculator/data';
import type { CharacterBuild } from '@/modules/team/party';

const RARITY_BACKGROUNDS = {
  4: 'bg-gradient-to-b from-[#5e5789] to-[#9c75b7]',
  5: 'bg-gradient-to-b from-[#945c2c] to-[#b27330]',
};

/** Square portrait with the constellation in the corner */
export function Portrait({ icon, name, rarity, constellation, size = 'md' }: {
  icon: string;
  name: string;
  rarity: 4 | 5;
  constellation: number;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      title={`${name} C${constellation}`}
      className={cn(
        'relative inline-block shrink-0 overflow-hidden rounded-lg border border-amber-200/60',
        size === 'sm' ? 'h-10 w-10' : 'h-16 w-16',
        RARITY_BACKGROUNDS[rarity],
      )}
    >
      <EnkaIcon icon={icon} size={64} alt={name} className="h-full w-full object-cover" />
      {constellation > 0 && (
        <span
          className={cn(
            'absolute top-0 right-1 font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]',
            size === 'sm' ? 'text-xs' : 'text-sm',
          )}
        >
          {constellation}
        </span>
      )}
    </span>
  );
}

/** One party member's build: portrait, talents, weapon, sets and key stats */
/** `addedDamage` is how much more Noelle deals with this teammate than without them, as a fraction */
export function MemberCard({ build, addedDamage }: { build: CharacterBuild; addedDamage?: number }) {
  const stats = [
    ['ATK', formatNumber(build.stats.atk)],
    ['DEF', formatNumber(build.stats.def)],
    ['HP', formatNumber(build.stats.hp)],
    ['EM', formatNumber(build.stats.em)],
    ['ER', formatPercent(build.stats.er)],
    ['Crit', `${formatPercent(build.stats.critRate)} / ${formatPercent(build.stats.critDmg)}`],
  ];
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-white/5 p-3">
      <header className="flex items-center gap-3">
        <Portrait icon={build.icon} name={build.name} rarity={build.rarity} constellation={build.constellation} />
        <div className="min-w-0">
          <p className="font-semibold text-stone-100">{build.name}</p>
          <p className="text-xs text-stone-400">
            Lv. {build.level} · C{build.constellation} · Talents {build.talents.join('/')}
          </p>
          {addedDamage !== undefined && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-300" title="Noelle's damage with them versus without them">
              <TrendingUp className="h-3 w-3" aria-hidden />
              {addedDamage >= 0 ? '+' : ''}
              {formatPercent(addedDamage)} damage
            </p>
          )}
        </div>
      </header>
      <div className="flex items-center gap-2 text-xs">
        {build.weapon.icon && <EnkaIcon icon={build.weapon.icon} size={28} alt="" className="shrink-0" />}
        <div className="min-w-0">
          <p className="truncate text-stone-200">
            {weaponName(build.weapon.id)} <span className="text-amber-300">R{build.weapon.refinement}</span>
          </p>
          <p className="truncate text-stone-500" title={formatArtifactSets(build.artifactSets)}>
            {formatArtifactSets(build.artifactSets)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
        {stats.map(([label, value]) => (
          <div key={label} className={cn('flex flex-col', label === 'Crit' && 'col-span-2')}>
            <dt className="text-stone-500">{label}</dt>
            <dd className="font-mono text-stone-200">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
