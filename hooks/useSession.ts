'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/session-store';
import { Session } from '@/types';

export function useFeed() {
  const {
    dailySessions,
    feedLoading,
    feedError,
    setDailySessions,
    setFeedLoading,
    setFeedError,
  } = useStore();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Only show loading spinner if we have no cached sessions yet
      if (dailySessions.length === 0) setFeedLoading(true);
      setFeedError(null);
      try {
        const res = await fetch('/api/feed/today');
        if (!res.ok) throw new Error('Failed to load feed');
        const { sessions }: { sessions: Session[] } = await res.json();
        if (!cancelled) setDailySessions(sessions);
      } catch (err) {
        if (!cancelled) setFeedError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { dailySessions, feedLoading, feedError };
}

// Backwards-compat alias used by corrections/exercises/progress pages
export function useSession() {
  const { getActiveSession } = useStore();
  const { feedLoading, feedError } = useFeed();
  return { session: getActiveSession(), sessionLoading: feedLoading, sessionError: feedError };
}
