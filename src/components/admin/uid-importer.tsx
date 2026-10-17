'use client';

import { CircleCheck, CircleX, Clock, Loader2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { importUidAction } from '@/app/actions/admin';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { parseUids } from '@/modules/admin/uids';

type Status = 'queued' | 'running' | 'waiting' | 'done' | 'failed';
interface Row {
  uid: string;
  status: Status;
  message?: string;
}

const DEFAULT_DELAY_SECONDS = 5;
// Enka's rate limit clears within a minute; a rate-limited UID is retried once after this
const RATE_LIMIT_WAIT_SECONDS = 60;

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  queued: <Clock className="h-4 w-4 text-stone-500" aria-hidden />,
  running: <Loader2 className="h-4 w-4 animate-spin text-amber-300" aria-hidden />,
  waiting: <Clock className="h-4 w-4 text-amber-300" aria-hidden />,
  done: <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden />,
  failed: <CircleX className="h-4 w-4 text-rose-400" aria-hidden />,
};

export function UidImporter() {
  const [text, setText] = useState('');
  const [delay, setDelay] = useState(DEFAULT_DELAY_SECONDS);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const uids = useMemo(() => parseUids(text), [text]);

  const update = (uid: string, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));

  // Waits in one-second steps so Stop takes effect quickly
  const sleep = async (seconds: number) => {
    for (let i = 0; i < seconds && !stopRef.current; i++) await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  async function run(queue: string[]) {
    stopRef.current = false;
    setRunning(true);
    for (const [index, uid] of queue.entries()) {
      if (stopRef.current) break;
      if (index > 0) await sleep(delay);
      if (stopRef.current) break;

      update(uid, { status: 'running', message: undefined });
      let result = await importUidAction(uid);
      if (!result.ok && result.code === 'RATE_LIMITED') {
        update(uid, { status: 'waiting', message: `Rate limited, retrying in ${RATE_LIMIT_WAIT_SECONDS}s` });
        await sleep(RATE_LIMIT_WAIT_SECONDS);
        if (stopRef.current) {
          update(uid, { status: 'queued', message: undefined });
          break;
        }
        update(uid, { status: 'running', message: undefined });
        result = await importUidAction(uid);
      }

      if (result.ok) {
        update(uid, { status: 'done', message: `${result.nickname} · ${formatNumber(result.finalDamage)}` });
      } else {
        update(uid, { status: 'failed', message: result.error });
        // Everything fails during game maintenance, so there's no point going on
        if (result.code === 'MAINTENANCE') break;
      }
    }
    setRunning(false);
  }

  const start = () => {
    setRows(uids.map((uid) => ({ uid, status: 'queued' })));
    void run(uids);
  };
  const failed = rows.filter((row) => row.status === 'failed' || row.status === 'queued').map((row) => row.uid);
  const retry = () => {
    setRows((current) => current.map((row) => (failed.includes(row.uid) ? { uid: row.uid, status: 'queued' } : row)));
    void run(failed);
  };
  const done = rows.filter((row) => row.status === 'done').length;
  const errors = rows.filter((row) => row.status === 'failed').length;
  const buttonClass =
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50';

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-black/30 bg-ink p-5 shadow-2xl shadow-black/30">
      <label className="flex flex-col gap-1.5 text-sm text-stone-300">
        UIDs
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={running}
          rows={8}
          placeholder={'700000001\n700000002, 800000003 …'}
          className="rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-sm text-stone-100 outline-none focus:border-amber-400 disabled:opacity-60"
        />
        <span className="text-xs text-stone-500">
          Any separator works. {uids.length} UID{uids.length === 1 ? '' : 's'} found
          {uids.length ? `, about ${Math.ceil((uids.length * delay) / 60)} min` : ''}.
        </span>
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm text-stone-300">
          Seconds between UIDs
          <input
            type="number"
            min={1}
            max={120}
            value={delay}
            onChange={(event) => setDelay(Math.min(Math.max(Number(event.target.value) || 1, 1), 120))}
            disabled={running}
            className="h-10 w-28 rounded-lg border border-white/10 bg-black/30 px-3 font-mono text-stone-100 outline-none focus:border-amber-400"
          />
        </label>
        {running ? (
          <button type="button" onClick={() => (stopRef.current = true)} className={cn(buttonClass, 'bg-rose-600 text-white hover:bg-rose-500')}>
            Stop
          </button>
        ) : (
          <>
            <button type="button" onClick={start} disabled={!uids.length} className={cn(buttonClass, 'bg-amber-400 text-ink hover:bg-amber-300')}>
              Import {uids.length || ''}
            </button>
            {failed.length > 0 && (
              <button type="button" onClick={retry} className={cn(buttonClass, 'bg-white/10 text-stone-100 hover:bg-white/15')}>
                Retry {failed.length} unfinished
              </button>
            )}
          </>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <p className="text-sm text-stone-400" aria-live="polite">
            {done} imported · {errors} failed · {rows.length - done - errors} left
          </p>
          <ul className="flex max-h-[28rem] flex-col divide-y divide-white/5 overflow-y-auto rounded-lg bg-black/20 text-sm">
            {rows.map((row) => (
              <li key={row.uid} className="flex items-center gap-3 px-3 py-2">
                {STATUS_ICONS[row.status]}
                <span className="font-mono text-stone-100">{row.uid}</span>
                {row.message && (
                  <span className={cn('min-w-0 truncate', row.status === 'failed' ? 'text-rose-300' : 'text-stone-400')} title={row.message}>
                    {row.message}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
