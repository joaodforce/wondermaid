'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * A timestamp in the visitor's own timezone and locale. The server can't know either, so it renders
 * UTC and the browser swaps in local time once hydrated.
 */
export function LocalTime({ iso }: { iso: string }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const date = new Date(iso);
  const text = isClient
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : `${date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
  return (
    <time dateTime={iso} title={date.toISOString()}>
      {text}
    </time>
  );
}
