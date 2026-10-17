'use client';

import { Check, Copy, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import {
  cancelClaimAction,
  startClaimAction,
  unlinkAccountAction,
  verifyClaimAction,
  type AccountActionResult,
} from '@/app/actions/accounts';
import type { LinkedAccount, PendingClaim } from '@/modules/accounts/services';

const buttonClass =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-60';

function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<AccountActionResult>, onSuccess?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      startTransition(() => {
        if (result.ok) onSuccess?.();
        else setError(result.error);
      });
    });
  };
  return { error, pending, run };
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-sm text-rose-300">
      {error}
    </p>
  ) : null;
}

export function AddAccountForm() {
  const { error, pending, run } = useAction();
  const [uid, setUid] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run(() => startClaimAction(uid.trim()), () => setUid(''));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={uid}
          onChange={(event) => setUid(event.target.value)}
          inputMode="numeric"
          placeholder="Your UID, e.g. 700123456"
          aria-label="Genshin Impact UID"
          className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 font-mono text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none sm:flex-1"
        />
        <button
          type="submit"
          disabled={pending || !uid.trim()}
          className={`${buttonClass} bg-amber-400 text-ink hover:bg-amber-300`}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Get my code
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function PendingClaimCard({ claim }: { claim: PendingClaim }) {
  const { error, pending, run } = useAction();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(claim.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-300">
          Claiming UID <span className="font-mono text-stone-100">{claim.uid}</span>
        </p>
        <button
          type="button"
          onClick={() => run(() => cancelClaimAction(claim.uid))}
          disabled={pending}
          className="text-xs text-stone-500 hover:text-stone-300"
        >
          Cancel
        </button>
      </div>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-stone-300">
        <li>
          Add this code anywhere in your in-game bio (Profile → Edit Signature):{' '}
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-base font-bold text-amber-300 hover:bg-black/60"
            title="Copy code"
          >
            {claim.code}
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          </button>
        </li>
        <li>Keep your character showcase public, then come back and press Verify.</li>
        <li>Once verified you can remove the code from your bio.</li>
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run(() => verifyClaimAction(claim.uid))}
          disabled={pending}
          className={`${buttonClass} bg-amber-400 text-ink hover:bg-amber-300`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden />
          )}
          Verify
        </button>
        <span className="text-xs text-stone-500">
          Code valid until {new Date(claim.expiresAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
        </span>
      </div>
      <ErrorText error={error} />
    </li>
  );
}

export function LinkedAccountRow({ account }: { account: LinkedAccount }) {
  const { error, pending, run } = useAction();

  function unlink() {
    if (window.confirm(`Unlink UID ${account.uid} from your account?`)) run(() => unlinkAccountAction(account.uid));
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-stone-100">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-label="Verified" />
            {account.nickname}
          </p>
          <p className="font-mono text-xs text-stone-400">UID {account.uid}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/team-showcase/submit?uid=${account.uid}`}
            className={`${buttonClass} bg-amber-400 text-ink hover:bg-amber-300`}
          >
            Submit a team
          </Link>
          <Link href={`/${account.uid}`} className={`${buttonClass} bg-white/10 text-stone-100 hover:bg-white/15`}>
            Build
          </Link>
          <button
            type="button"
            onClick={unlink}
            disabled={pending}
            className={`${buttonClass} text-stone-400 hover:bg-white/10 hover:text-stone-100`}
            title="Unlink"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Unlink</span>
          </button>
        </div>
      </div>
      <ErrorText error={error} />
    </li>
  );
}
