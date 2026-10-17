'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useTransition, type FormEvent } from 'react';
import { processPlayerUpdate } from '@/app/actions/update-player';
import { formatNumber } from '@/lib/format';
import type { UpdatePlayerResult } from '@/modules/leaderboard/types';
import { useLeaderboardSync } from './leaderboard-sync';

export function UidForm() {
  const { notifyUpdated } = useLeaderboardSync();
  const [result, setResult] = useState<UpdatePlayerResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uid = String(new FormData(event.currentTarget).get('uid') ?? '').trim();
    setResult(null);
    startTransition(async () => {
      const response = await processPlayerUpdate(uid);
      startTransition(() => {
        setResult(response);
        if (response.success) notifyUpdated(response.uid);
      });
    });
  }

  return (
    <section className="w-full rounded-2xl border border-black/30 bg-ink p-6 shadow-2xl shadow-black/30">
      <h2 className="text-lg font-semibold text-stone-100">Submit your Noelle</h2>
      <p className="mt-1 text-sm text-stone-400">
        Put Noelle in your in-game character showcase with &quot;Show Character Details&quot; on, then enter your UID.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="uid" className="sr-only">
          Genshin Impact UID
        </label>
        <input
          id="uid"
          name="uid"
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 700123456"
          pattern="\d{9,10}"
          title="Your 9 or 10 digit Genshin Impact UID"
          required
          disabled={isPending}
          className="h-11 w-full rounded-lg sm:flex-1 border border-white/15 bg-black/40 px-4 font-mono text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 font-semibold text-stone-950 transition-colors hover:bg-amber-300 disabled:pointer-events-none disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isPending ? 'Calculating…' : 'Update'}
        </button>
      </form>

      <div aria-live="polite">
        {result && !result.success && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-300">
            {result.error}
          </p>
        )}
        {result?.success && (
          <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {result.nickname}&apos;s Noelle is on the leaderboard
            </p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {result.results.map((scenario) => (
                <li key={scenario.scenarioId} className="flex justify-between gap-3 text-emerald-100/80">
                  <span>{scenario.name}</span>
                  <span className="font-mono">
                    {formatNumber(scenario.finalDamage)}
                    {scenario.rank > 0 && (
                      <span className="text-emerald-300/70">
                        {' '}
                        · #{scenario.rank}/{scenario.total}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
