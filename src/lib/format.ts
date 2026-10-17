import { STAT_LABELS, artifactSetName } from '@/modules/calculator/data';

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

const oneDecimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

/** Formats an Enka stat line value (percent stats come in percent units) */
export function formatStatValue(type: string, value: number): string {
  return STAT_LABELS[type]?.percent ? `${oneDecimal.format(value)}%` : formatNumber(value);
}

export const statLabel = (type: string) => STAT_LABELS[type]?.label ?? type.replace('FIGHT_PROP_', '');

export const formatDateTime = (iso: string) => `${dateTime.format(new Date(iso))} UTC`;
