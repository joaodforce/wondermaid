'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { addedDamage, type TeamAttack } from '@/modules/go/types';
import type { TeamShowcaseEntry } from '@/modules/team/services';
import { MemberCard, Portrait } from './member-card';

const MEDALS = ['🥇', '🥈', '🥉'];
const ATTACK_LABELS: Record<TeamAttack, string> = { Na4: 'N4', Plunge: 'Plunge' };

export function TeamTable({ entries, highlightUid }: { entries: TeamShowcaseEntry[]; highlightUid?: string }) {
  const [expanded, setExpanded] = useState<string | null>(highlightUid ?? null);

  if (!entries.length) {
    return <p className="p-8 text-center text-sm text-stone-400">No teams yet. Be the first to submit yours!</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-stone-300">
        <thead className="border-b border-white/10 bg-black/30 text-xs text-stone-400 uppercase">
          <tr>
            <th className="px-3 py-3 sm:px-4">Rank</th>
            <th className="px-3 py-3 sm:px-4">Player</th>
            <th className="hidden px-3 py-3 sm:table-cell sm:px-4">Team</th>
            <th className="hidden px-3 py-3 text-right md:table-cell sm:px-4">Crit</th>
            <th className="px-3 py-3 text-right sm:px-4">Damage</th>
            <th className="hidden w-10 px-2 py-3 sm:table-cell">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((entry) => {
            const open = expanded === entry.uid;
            const toggle = () => setExpanded(open ? null : entry.uid);
            return (
              <Fragment key={entry.uid}>
                <tr
                  onClick={toggle}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-white/5',
                    entry.uid === highlightUid && 'bg-rose-500/15 hover:bg-rose-500/20',
                  )}
                >
                  <td className="px-3 py-3 font-semibold whitespace-nowrap text-stone-100 sm:px-4">
                    {MEDALS[entry.rank - 1] && <span aria-hidden>{MEDALS[entry.rank - 1]} </span>}
                    {entry.rank}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <Link
                      href={`/${entry.uid}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-stone-100 hover:text-amber-300 hover:underline"
                    >
                      {entry.nickname}
                    </Link>
                    <p className="font-mono text-xs text-stone-500">{entry.uid}</p>
                    <div className="mt-1.5 flex gap-1 sm:hidden">
                      {entry.party.map((member) => (
                        <Portrait
                          key={member.id}
                          icon={member.icon}
                          name={member.name}
                          rarity={member.rarity}
                          constellation={member.constellation}
                          size="sm"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                    <div className="flex gap-1">
                      {entry.party.map((member) => (
                        <Portrait
                          key={member.id}
                          icon={member.icon}
                          name={member.name}
                          rarity={member.rarity}
                          constellation={member.constellation}
                          size="sm"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-right font-mono whitespace-nowrap md:table-cell sm:px-4">
                    {formatPercent(entry.calculation.stats.critRate)} / {formatPercent(entry.calculation.stats.critDmg)}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    <span className="font-mono text-base font-bold text-amber-400">{formatNumber(entry.finalDamage)}</span>
                    <p className="text-xs text-stone-500">{ATTACK_LABELS[entry.calculation.attack]}</p>
                  </td>
                  <td className="hidden px-2 py-3 sm:table-cell">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={open ? 'Hide team details' : 'Show team details'}
                      className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-white/10"
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="bg-black/20">
                    <td colSpan={6} className="px-3 py-4 sm:px-4">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {entry.party.map((member, index) => (
                          <MemberCard
                            key={member.id}
                            build={member}
                            addedDamage={index === 0 ? undefined : addedDamage(entry.calculation, index)}
                          />
                        ))}
                      </div>
                      <Link
                        href={`/team-showcase/${entry.uid}`}
                        className="mt-3 inline-block text-sm font-medium text-amber-300 hover:underline"
                      >
                        See how this damage is calculated →
                      </Link>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
