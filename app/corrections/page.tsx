'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/layout/LoadingState';
import MistakeCard from '@/components/corrections/MistakeCard';
import VocabularyCard from '@/components/corrections/VocabularyCard';
import { useStore } from '@/lib/session-store';
import { useFeed } from '@/hooks/useSession';

export default function CorrectionsPage() {
  const router = useRouter();
  const { activeSessionId, getActiveSession, getAnalysis } = useStore();
  const { dailySessions } = useFeed();

  const session = getActiveSession();
  const analysis = activeSessionId ? getAnalysis(activeSessionId) : null;

  const mistakes = analysis?.mistakes ?? [];
  const vocabulary = analysis?.vocabulary ?? [];
  const analysisLoading = analysis?.loading ?? false;

  const conversationDone = session?.conversation_status === 'completed';
  const hasData = mistakes.length > 0 || vocabulary.length > 0;

  // If no active session, show picker
  if (!session) {
    const completedSessions = dailySessions.filter((s) => s.conversation_status === 'completed');
    return (
      <div className="min-h-screen bg-paper-50 pb-24">
        <PageHeader subtitle="Korrekturen" />
        <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
          {completedSessions.length === 0 ? (
            <div className="bg-paper-100 rounded-card p-6 text-center shadow-card">
              <p className="text-4xl mb-3">💬</p>
              <p className="font-serif text-base text-ink-700">
                Schließe zuerst ein Gespräch ab, um Korrekturen zu sehen.
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
              <p className="text-caption text-ink-500 px-1">Wähle eine abgeschlossene Geschichte:</p>
              {completedSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    useStore.getState().setActiveSessionId(s.id);
                  }}
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
      <PageHeader subtitle="Fehler & Wortschatz" />

      {/* Story context strip */}
      <div className="bg-morning-700 px-4 py-2">
        <p className="text-paper-50 text-xs font-serif line-clamp-1 max-w-lg mx-auto">
          {session.news_title}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        {!conversationDone && (
          <div className="bg-paper-100 rounded-card p-6 text-center shadow-card">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-serif text-base text-ink-700">
              Schließe zuerst das Gespräch ab, um deine Korrekturen zu sehen.
            </p>
          </div>
        )}

        {conversationDone && analysisLoading && (
          <LoadingState message="Deine Antworten werden analysiert…" />
        )}

        {conversationDone && !analysisLoading && !hasData && (
          <div className="bg-paper-100 rounded-card p-6 text-center shadow-card">
            <p className="text-4xl mb-3">✨</p>
            <p className="font-serif text-base text-ink-700">
              Keine Fehler gefunden — ausgezeichnetes Deutsch!
            </p>
          </div>
        )}

        {hasData && (
          <>
            {mistakes.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-serif text-lg font-bold text-ink-900">
                  Fehler ({mistakes.length})
                </h2>
                {mistakes.map((m) => (
                  <MistakeCard key={m.id} mistake={m} />
                ))}
              </section>
            )}

            {vocabulary.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-serif text-lg font-bold text-ink-900">
                  Wortschatz ({vocabulary.length})
                </h2>
                {vocabulary.map((v) => (
                  <VocabularyCard key={v.id} item={v} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
