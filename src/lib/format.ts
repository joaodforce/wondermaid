import { artifactSetName } from '@/modules/calculator/data';

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const formatNumber = (value: number) => integer.format(value);
export const formatPercent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

/** "Husk of Opulent Dreams (4)" or "Archaic Petra (2) / Husk of Opulent Dreams (2)" */
export function formatArtifactSets(sets: Record<number, number>): string {
  const active = Object.entries(sets)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([setId, count]) => `${artifactSetName(Number(setId))} (${count >= 4 ? 4 : 2})`);
  return active.length ? active.join(' / ') : 'Rainbow';
}
