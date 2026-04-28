'use client';

import PageHeader from '@/components/layout/PageHeader';
import { SkeletonCard } from '@/components/layout/LoadingState';
import StoryCard from '@/components/today/StoryCard';
import { useFeed } from '@/hooks/useSession';

export default function TodayPage() {
  const { dailySessions, feedLoading, feedError } = useFeed();

  const completed = dailySessions.filter((s) => s.conversation_status === 'completed').length;

  return (
    <div className="min-h-screen bg-paper-50 pb-24">
      <PageHeader subtitle="Wähle eine Geschichte für heute" />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {feedLoading && (
          <div className="space-y-4">
            <div className="h-5 w-48 bg-paper-200 rounded animate-pulse mx-auto" />
            {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {feedError && (
          <div className="bg-red-50 border border-red-200 rounded-card p-4 text-center">
            <p className="text-red-700 font-medium">Fehler beim Laden</p>
            <p className="text-red-500 text-sm mt-1">{feedError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-morning-700 font-medium underline"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {dailySessions.length > 0 && (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-caption text-ink-500">
                {completed} von {dailySessions.length} abgeschlossen
              </p>
              {completed === dailySessions.length && dailySessions.length > 0 && (
                <span className="text-caption text-green-600 font-semibold">Alle erledigt 🎉</span>
              )}
            </div>

            {dailySessions.map((session, i) => (
              <StoryCard key={session.id} session={session} index={i} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
