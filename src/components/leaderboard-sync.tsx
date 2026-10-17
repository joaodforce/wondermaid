'use client';

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

interface LeaderboardSync {
  /** Bumped after every successful submission so the table refetches */
  version: number;
  highlightUid: string | null;
  notifyUpdated: (uid: string) => void;
}

const LeaderboardSyncContext = createContext<LeaderboardSync | null>(null);

// Lets the UID form refresh the leaderboard table rendered next to it
export function LeaderboardSyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ version: 0, highlightUid: null as string | null });
  const notifyUpdated = useCallback(
    (uid: string) => setState((previous) => ({ version: previous.version + 1, highlightUid: uid })),
    [],
  );
  const value = useMemo(() => ({ ...state, notifyUpdated }), [state, notifyUpdated]);
  return <LeaderboardSyncContext value={value}>{children}</LeaderboardSyncContext>;
}

export function useLeaderboardSync(): LeaderboardSync {
  const context = use(LeaderboardSyncContext);
  if (!context) throw new Error('useLeaderboardSync must be used inside LeaderboardSyncProvider');
  return context;
}
