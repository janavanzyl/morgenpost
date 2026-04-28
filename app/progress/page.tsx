'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/layout/LoadingState';
import StreakDisplay from '@/components/progress/StreakDisplay';
import CalendarHeatmap from '@/components/progress/CalendarHeatmap';
import SessionHistory from '@/components/progress/SessionHistory';
import { useStreak } from '@/hooks/useStreak';
import { Session } from '@/types';

export default function ProgressPage() {
  const streak = useStreak();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/sessions/history');
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions ?? []);
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeDates = sessions.map((s) => s.date);

  return (
    <div className="min-h-screen bg-paper-50 pb-24">
      <PageHeader subtitle="Dein Lernfortschritt" />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {streak ? (
          <StreakDisplay
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
            totalSessions={streak.total_sessions}
          />
        ) : (
          <div className="h-36 bg-paper-100 rounded-card animate-pulse" />
        )}

        <CalendarHeatmap activeDates={activeDates} />

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-ink-900">Verlauf</h2>
          {loading ? <LoadingState message="Wird geladen…" /> : <SessionHistory sessions={sessions} />}
        </section>
      </div>
    </div>
  );
}
