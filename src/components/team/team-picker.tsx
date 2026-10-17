'use client';

import { Check, Loader2, Lock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { submitTeamAction } from '@/app/actions/team';
import { EnkaIcon } from '@/components/build/enka-icon';
import { cn } from '@/lib/utils';
import type { ShowcaseCharacter } from '@/modules/team/services';

const TEAM_SIZE = 3;

export function TeamPicker({ uid, characters }: { uid: string; characters: ShowcaseCharacter[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length < TEAM_SIZE ? [...current, id] : current,
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitTeamAction(uid, selected);
      startTransition(() => {
        if (result.ok) router.push(`/team-showcase?highlight=${uid}`);
        else setError(result.error);
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {characters.map((character) => {
          const isSelected = selected.includes(character.id);
          const disabled = !character.allowed || (!isSelected && selected.length >= TEAM_SIZE);
          return (
            <li key={character.id}>
              <button
                type="button"
                onClick={() => toggle(character.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                title={character.allowed ? undefined : 'Not allowed: Team Showcase only takes supports'}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  isSelected ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10',
                  disabled && !isSelected && 'cursor-not-allowed opacity-40 hover:bg-white/5',
                )}
              >
                {character.icon ? (
                  <EnkaIcon icon={character.icon} size={48} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-black/30" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30">
                    <Lock className="h-4 w-4 text-stone-500" aria-hidden />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium text-stone-100">
                    {character.name ?? `Character ${character.id}`}
                  </span>
                  <span className="block text-xs text-stone-400">
                    {character.allowed ? `Lv. ${character.level} · C${character.constellation}` : 'Not a support'}
                  </span>
                </span>
                {isSelected && <Check className="absolute top-2 right-2 h-4 w-4 text-amber-300" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || selected.length !== TEAM_SIZE}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-amber-400 px-5 font-semibold text-ink hover:bg-amber-300 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Submit team ({selected.length}/{TEAM_SIZE})
        </button>
        <Link
          href={`/team-showcase/submit?uid=${uid}&fresh=1`}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-200"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Changed your showcase? Reload it
        </Link>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

