'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/session-store';
import { StreakData } from '@/types';

export function useStreak() {
  const { streak, setStreak } = useStore();

  useEffect(() => {
    if (streak) return;

    const load = async () => {
      try {
        const res = await fetch('/api/streak');
        if (!res.ok) return;
        const data: StreakData = await res.json();
        setStreak(data);
      } catch {
        // non-critical
      }
    };

    load();
  }, [streak, setStreak]);

  return streak;
}
