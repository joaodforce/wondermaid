'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { processPlayerUpdate } from '@/app/actions/update-player';

export function RefreshBuildButton({ uid }: { uid: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setError(null);
    startTransition(async () => {
      const result = await processPlayerUpdate(uid);
      startTransition(() => {
        if (result.success) router.refresh();
        else setError(result.error);
      });
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-stone-100 shadow-lg shadow-black/20 transition-colors hover:bg-black disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
        {isPending ? 'Updating…' : 'Update from Enka'}
      </button>
      {error && (
        <p role="alert" className="max-w-xs rounded-lg bg-rose-950/90 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
