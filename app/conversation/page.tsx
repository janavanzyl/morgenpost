'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/layout/LoadingState';
import ConversationThread from '@/components/conversation/ConversationThread';
import ConversationProgress from '@/components/conversation/ConversationProgress';
import RecordButton from '@/components/conversation/RecordButton';
import TranscriptDisplay from '@/components/conversation/TranscriptDisplay';
import { useFeed } from '@/hooks/useSession';
import { useConversation, MAX_EXCHANGES } from '@/hooks/useConversation';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useStore } from '@/lib/session-store';

export default function ConversationPage() {
  const router = useRouter();
  const { feedLoading } = useFeed();
  const { activeSessionId, getActiveSession } = useStore();
  const session = getActiveSession();

  const sessionId = session?.id ?? '';

  const {
    history,
    phase,
    currentExchange,
    pendingTranscript,
    conversationError,
    setPhase,
    setPendingTranscript,
    sendMessage,
    initConversation,
  } = useConversation(sessionId);

  const {
    recorderState,
    transcript,
    error: recorderError,
    startRecording,
    stopRecording,
    reset,
  } = useVoiceRecorder((t) => {
    setPendingTranscript(t);
    setPhase('transcript_review');
  });

  useEffect(() => {
    if (!session) return;
    if (phase === 'idle') {
      if (session.conversation_status === 'completed') {
        setPhase('completed');
      } else {
        initConversation();
      }
    }
  }, [session, phase, initConversation, setPhase]);

  const handleSend = async (text: string) => {
    reset();
    await sendMessage(text);
  };

  const handleRetry = () => {
    reset();
    setPhase('ready_to_record');
  };

  if (feedLoading || (!session && !activeSessionId)) {
    return (
      <div className="min-h-screen bg-paper-50 pb-24">
        <PageHeader />
        <LoadingState message="Gespräch wird vorbereitet…" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-paper-50 pb-24">
        <PageHeader />
        <div className="max-w-lg mx-auto px-4 py-10 text-center space-y-4">
          <p className="text-ink-500">Bitte wähle zuerst eine Geschichte aus.</p>
          <button
            onClick={() => router.push('/today')}
            className="bg-morning-700 text-paper-50 px-6 py-3 rounded-card font-semibold"
          >
            Zu den Geschichten →
          </button>
        </div>
      </div>
    );
  }

  const isSending = phase === 'sending';

  return (
    <div className="min-h-screen bg-paper-50 pb-24 flex flex-col">
      <PageHeader subtitle={session.news_source} />

      {/* Story title strip */}
      <div className="bg-morning-700 px-4 py-2">
        <p className="text-paper-50 text-xs font-serif line-clamp-1 max-w-lg mx-auto">
          {session.news_title}
        </p>
      </div>

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col px-4 py-4 gap-4">
        {phase === 'completed' ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="font-serif text-2xl font-bold text-ink-900">Gut gemacht!</h2>
            <p className="text-ink-500 text-sm max-w-xs leading-relaxed">
              10 Austausche abgeschlossen! Deine Korrekturen und Übungen werden jetzt erstellt.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => router.push('/corrections')}
                className="bg-morning-700 text-paper-50 px-8 py-3 rounded-card font-semibold text-base hover:bg-morning-800 transition-colors"
              >
                Korrekturen ansehen →
              </button>
              <button
                onClick={() => router.push('/today')}
                className="border border-morning-600 text-morning-700 px-8 py-3 rounded-card font-semibold text-base hover:bg-morning-700 hover:text-paper-50 transition-colors"
              >
                Andere Geschichte wählen
              </button>
            </div>
          </div>
        ) : (
          <>
            {phase !== 'idle' && (
              <ConversationProgress current={currentExchange} total={MAX_EXCHANGES} />
            )}

            <div className="flex-1 overflow-y-auto">
              {history.length === 0 && phase === 'ready_to_record' && (
                <div className="bg-morning-700 bg-opacity-10 rounded-card p-4 text-center">
                  <p className="font-serif text-base text-ink-700 italic">
                    Hallo! Ich habe den heutigen Artikel gelesen. Was denkst du darüber?
                  </p>
                </div>
              )}
              <ConversationThread messages={history} />
            </div>

            {(conversationError || recorderError) && (
              <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-red-700 text-sm text-center">
                {conversationError || recorderError}
              </div>
            )}

            <div className="pb-2 space-y-4">
              {phase === 'transcript_review' && pendingTranscript ? (
                <TranscriptDisplay
                  transcript={pendingTranscript}
                  onSend={handleSend}
                  onRetry={handleRetry}
                  isSending={isSending}
                />
              ) : (
                phase !== 'sending' &&
                phase !== 'exchange_done' && (
                  <div className="flex justify-center">
                    <RecordButton
                      recorderState={recorderState}
                      onStart={startRecording}
                      onStop={stopRecording}
                    />
                  </div>
                )
              )}

              {isSending && (
                <div className="flex items-center justify-center gap-2 text-ink-500 text-sm">
                  <span className="w-4 h-4 border-2 border-paper-200 border-t-morning-600 rounded-full animate-spin" />
                  Claude antwortet…
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
