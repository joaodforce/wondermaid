import { Star } from 'lucide-react';
import { formatStatValue, statLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { artifactSetName } from '@/modules/calculator/data';
import type { ArtifactPiece } from '@/modules/calculator/types';
import { EnkaIcon } from './enka-icon';

// Substats that make Noelle hit harder
const USEFUL_STATS = new Set(['FIGHT_PROP_CRITICAL', 'FIGHT_PROP_CRITICAL_HURT', 'FIGHT_PROP_DEFENSE_PERCENT']);
const SLOT_LABELS = { flower: 'Flower', plume: 'Plume', sands: 'Sands', goblet: 'Goblet', circlet: 'Circlet' };

/** 2 × CRIT Rate + CRIT DMG from substats */
export function critValue(piece: ArtifactPiece): number {
  return piece.subStats.reduce((sum, stat) => {
    if (stat.type === 'FIGHT_PROP_CRITICAL') return sum + stat.value * 2;
    if (stat.type === 'FIGHT_PROP_CRITICAL_HURT') return sum + stat.value;
    return sum;
  }, 0);
}

export function ArtifactCard({ piece }: { piece: ArtifactPiece }) {
  const cv = critValue(piece);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-xl shadow-black/20">
      <header className="relative flex items-start justify-between gap-2 bg-gradient-to-br from-amber-900/50 to-transparent p-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-stone-400" title={artifactSetName(piece.setId)}>
            {artifactSetName(piece.setId)}
          </p>
          <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{SLOT_LABELS[piece.slot]}</p>
          <p className="mt-2 text-sm text-stone-300">{statLabel(piece.mainStat.type)}</p>
          <p className="font-mono text-2xl font-bold text-stone-50">
            {formatStatValue(piece.mainStat.type, piece.mainStat.value)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs">
            <span className="rounded bg-white/10 px-1.5 font-semibold text-stone-200">+{piece.level}</span>
            <span className="flex text-amber-300" aria-label={`${piece.rarity} stars`}>
              {Array.from({ length: piece.rarity }, (_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" aria-hidden />
              ))}
            </span>
          </p>
        </div>
        <EnkaIcon icon={piece.icon} size={72} alt="" className="-mr-1 shrink-0 drop-shadow-lg" />
      </header>

      <ul className="flex-1 space-y-1.5 px-3 py-3 text-sm">
        {piece.subStats.map((stat) => (
          <li
            key={stat.type}
            className={cn(
              'flex justify-between gap-3',
              USEFUL_STATS.has(stat.type) ? 'text-stone-100' : 'text-stone-500',
            )}
          >
            <span>{statLabel(stat.type)}</span>
            <span className="font-mono">{formatStatValue(stat.type, stat.value)}</span>
          </li>
        ))}
      </ul>

      <footer className="border-t border-white/5 px-3 py-2 text-right text-xs text-stone-500">
        CV <span className={cn('font-mono font-semibold', cv >= 40 ? 'text-amber-300' : 'text-stone-300')}>{cv.toFixed(1)}</span>
      </footer>
    </article>
  );
}
