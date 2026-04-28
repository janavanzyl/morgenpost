'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/session-store';
import { ConversationPhase } from '@/types';

export const MAX_EXCHANGES = 10;

export function useConversation(sessionId: string) {
  const store = useStore();
  const conv = store.getConversation(sessionId);
  const analysis = store.getAnalysis(sessionId);

  const sendMessage = useCallback(
    async (userText: string) => {
      store.setConversationPhase(sessionId, 'sending');
      store.setConversationError(sessionId, null);

      try {
        const res = await fetch('/api/conversation/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userMessage: userText,
            exchangeNumber: conv.currentExchange,
            conversationHistory: conv.history,
            maxExchanges: MAX_EXCHANGES,
          }),
        });

        if (!res.ok) throw new Error('Conversation request failed');
        const { assistantMessage, isComplete } = await res.json();

        store.addMessage(sessionId, { role: 'user', content: userText });
        store.addMessage(sessionId, { role: 'assistant', content: assistantMessage });
        store.setPendingTranscript(sessionId, null);

        if (isComplete) {
          store.setConversationPhase(sessionId, 'completed');
          // Update the session status in dailySessions
          const session = store.dailySessions.find((s) => s.id === sessionId);
          if (session) {
            store.updateSession({ ...session, conversation_status: 'completed' });
          }
          triggerAnalysis(sessionId);
          updateStreak();
        } else {
          store.setCurrentExchange(sessionId, conv.currentExchange + 1);
          setTimeout(() => store.setConversationPhase(sessionId, 'ready_to_record'), 800);
        }
      } catch {
        store.setConversationError(sessionId, 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.');
        store.setConversationPhase(sessionId, 'error');
      }
    },
    [sessionId, conv.currentExchange, conv.history, store]
  );

  const triggerAnalysis = useCallback(
    async (sid: string) => {
      store.setAnalysisLoading(sid, true);
      try {
        const res = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
        });
        if (!res.ok) return;
        const { mistakes, vocabulary, exercises } = await res.json();
        store.setAnalysis(sid, { mistakes, vocabulary, exercises });
      } finally {
        store.setAnalysisLoading(sid, false);
      }
    },
    [store]
  );

  const updateStreak = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      });
      if (res.ok) store.setStreak(await res.json());
    } catch { /* non-critical */ }
  }, [store]);

  const initConversation = useCallback(() => {
    if (conv.history.length === 0 && conv.phase === 'idle') {
      store.setConversationPhase(sessionId, 'ready_to_record');
    }
  }, [conv.history.length, conv.phase, sessionId, store]);

  const setPhase = (phase: ConversationPhase) =>
    store.setConversationPhase(sessionId, phase);

  const setPendingTranscript = (t: string | null) =>
    store.setPendingTranscript(sessionId, t);

  return {
    history: conv.history,
    phase: conv.phase,
    currentExchange: conv.currentExchange,
    pendingTranscript: conv.pendingTranscript,
    conversationError: conv.error,
    analysis,
    setPhase,
    setPendingTranscript,
    sendMessage,
    initConversation,
  };
}
