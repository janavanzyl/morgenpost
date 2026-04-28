'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/layout/LoadingState';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import { useStore } from '@/lib/session-store';
import { useFeed } from '@/hooks/useSession';

export default function ExercisesPage() {
  const router = useRouter();
  const { activeSessionId, getActiveSession, getAnalysis, markExerciseComplete } = useStore();
  const { dailySessions } = useFeed();

  const session = getActiveSession();
  const analysis = activeSessionId ? getAnalysis(activeSessionId) : null;

  const exercises = analysis?.exercises ?? [];
  const analysisLoading = analysis?.loading ?? false;
  const conversationDone = session?.conversation_status === 'completed';
  const completed = exercises.filter((e) => e.completed).length;

  const handleComplete = async (id: string) => {
    if (!activeSessionId) return;
    markExerciseComplete(activeSessionId, id);
    try {
      await fetch('/api/exercises/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: id }),
      });
    } catch { /* non-critical */ }
  };

  if (!session) {
    const completedSessions = dailySessions.filter((s) => s.conversation_status === 'completed');
    return (
      <div className="min-h-screen bg-paper-50 pb-24">
        <PageHeader subtitle="Übungen" />
        <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
          {completedSessions.length === 0 ? (
            <div className="bg-paper-100 rounded-card p-6 text-center shadow-card">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-serif text-base text-ink-700">
                Schließe zuerst ein Gespräch ab, um Übungen zu erhalten.
              </p>
              <button
                onClick={() => router.push('/today')}
                className="mt-4 text-sm text-morning-700 underline font-medium"
              >
                Zu den Geschichten →
              </button>
            </div>
          ) : (
            <>
              <p className="text-caption text-ink-500 px-1">Wähle eine Geschichte:</p>
              {completedSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => useStore.getState().setActiveSessionId(s.id)}
                  className="w-full bg-paper-100 rounded-card shadow-card p-4 text-left hover:shadow-card-hover transition-shadow"
                >
                  <p className="text-[10px] uppercase tracking-widest text-morning-700 mb-1">
                    {s.news_source}
                  </p>
                  <p className="text-sm font-semibold text-ink-900">{s.news_title}</p>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 pb-24">
      <PageHeader subtitle="Personalisierte Übungen" />

      <div className="bg-morning-700 px-4 py-2">
        <p className="text-paper-50 text-xs font-serif line-clamp-1 max-w-lg mx-auto">
          {session.news_title}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {!conversationDone && (
          <div className="bg-paper-100 rounded-card p-6 text-center shadow-card">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-serif text-base text-ink-700">
              Schließe zuerst das Gespräch ab, um Übungen zu erhalten.
            </p>
          </div>
        )}

        {conversationDone && analysisLoading && (
          <LoadingState message="10 Übungen werden erstellt…" />
        )}

        {conversationDone && !analysisLoading && exercises.length === 0 && (
          <div className="bg-paper-100 rounded-card p-6 text-center shadow-card">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-serif text-base text-ink-700">
              Übungen werden noch erstellt. Bitte warte einen Moment.
            </p>
          </div>
        )}

        {exercises.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-ink-900">
                Übungen ({exercises.length})
              </h2>
              <span className="text-caption text-ink-500">
                {completed} / {exercises.length} erledigt
              </span>
            </div>

            <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-morning-700 rounded-full transition-all duration-500"
                style={{ width: exercises.length ? `${(completed / exercises.length) * 100}%` : '0%' }}
              />
            </div>

            {exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                index={i}
                onComplete={handleComplete}
              />
            ))}

            {completed === exercises.length && exercises.length > 0 && (
              <div className="bg-green-50 rounded-card p-4 text-center border border-green-200">
                <p className="text-green-700 font-serif text-base font-semibold">
                  🎉 Alle {exercises.length} Übungen abgeschlossen!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
