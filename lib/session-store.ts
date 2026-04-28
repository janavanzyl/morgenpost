'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Session,
  Message,
  Mistake,
  VocabItem,
  Exercise,
  ConversationPhase,
  StreakData,
} from '@/types';

interface ConversationSlice {
  history: Message[];
  phase: ConversationPhase;
  currentExchange: number;
  pendingTranscript: string | null;
  error: string | null;
}

const emptyConversation = (): ConversationSlice => ({
  history: [],
  phase: 'idle',
  currentExchange: 1,
  pendingTranscript: null,
  error: null,
});

interface AnalysisSlice {
  mistakes: Mistake[];
  vocabulary: VocabItem[];
  exercises: Exercise[];
  loading: boolean;
}

const emptyAnalysis = (): AnalysisSlice => ({
  mistakes: [],
  vocabulary: [],
  exercises: [],
  loading: false,
});

interface SessionStore {
  // All today's story sessions
  dailySessions: Session[];
  feedLoading: boolean;
  feedError: string | null;
  setDailySessions: (s: Session[]) => void;
  updateSession: (s: Session) => void;
  setFeedLoading: (v: boolean) => void;
  setFeedError: (e: string | null) => void;

  // Which story the user is currently working on
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  getActiveSession: () => Session | null;

  // Per-session conversation state (keyed by sessionId)
  conversations: Record<string, ConversationSlice>;
  getConversation: (sessionId: string) => ConversationSlice;
  setConversationPhase: (sessionId: string, phase: ConversationPhase) => void;
  setCurrentExchange: (sessionId: string, n: number) => void;
  setPendingTranscript: (sessionId: string, t: string | null) => void;
  setConversationError: (sessionId: string, e: string | null) => void;
  addMessage: (sessionId: string, m: Message) => void;
  resetConversation: (sessionId: string) => void;

  // Per-session analysis (keyed by sessionId)
  analyses: Record<string, AnalysisSlice>;
  getAnalysis: (sessionId: string) => AnalysisSlice;
  setAnalysis: (sessionId: string, data: Omit<AnalysisSlice, 'loading'>) => void;
  setAnalysisLoading: (sessionId: string, v: boolean) => void;
  markExerciseComplete: (sessionId: string, exerciseId: string) => void;

  // Streak
  streak: StreakData | null;
  setStreak: (s: StreakData) => void;
}

const today = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const useStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      dailySessions: [],
      feedLoading: false,
      feedError: null,
      setDailySessions: (s) => set({ dailySessions: s }),
      updateSession: (s) =>
        set((state) => ({
          dailySessions: state.dailySessions.map((x) => (x.id === s.id ? s : x)),
        })),
      setFeedLoading: (v) => set({ feedLoading: v }),
      setFeedError: (e) => set({ feedError: e }),

      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      getActiveSession: () => {
        const { dailySessions, activeSessionId } = get();
        return dailySessions.find((s) => s.id === activeSessionId) ?? null;
      },

      conversations: {},
      getConversation: (sid) => get().conversations[sid] ?? emptyConversation(),
      setConversationPhase: (sid, phase) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [sid]: { ...(state.conversations[sid] ?? emptyConversation()), phase },
          },
        })),
      setCurrentExchange: (sid, n) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [sid]: { ...(state.conversations[sid] ?? emptyConversation()), currentExchange: n },
          },
        })),
      setPendingTranscript: (sid, t) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [sid]: { ...(state.conversations[sid] ?? emptyConversation()), pendingTranscript: t },
          },
        })),
      setConversationError: (sid, e) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [sid]: { ...(state.conversations[sid] ?? emptyConversation()), error: e },
          },
        })),
      addMessage: (sid, m) =>
        set((state) => {
          const conv = state.conversations[sid] ?? emptyConversation();
          return {
            conversations: {
              ...state.conversations,
              [sid]: { ...conv, history: [...conv.history, m] },
            },
          };
        }),
      resetConversation: (sid) =>
        set((state) => ({
          conversations: { ...state.conversations, [sid]: emptyConversation() },
        })),

      analyses: {},
      getAnalysis: (sid) => get().analyses[sid] ?? emptyAnalysis(),
      setAnalysis: (sid, data) =>
        set((state) => ({
          analyses: {
            ...state.analyses,
            [sid]: { ...data, loading: false },
          },
        })),
      setAnalysisLoading: (sid, v) =>
        set((state) => ({
          analyses: {
            ...state.analyses,
            [sid]: { ...(state.analyses[sid] ?? emptyAnalysis()), loading: v },
          },
        })),
      markExerciseComplete: (sid, exerciseId) =>
        set((state) => {
          const analysis = state.analyses[sid] ?? emptyAnalysis();
          return {
            analyses: {
              ...state.analyses,
              [sid]: {
                ...analysis,
                exercises: analysis.exercises.map((ex) =>
                  ex.id === exerciseId ? { ...ex, completed: true } : ex
                ),
              },
            },
          };
        }),

      streak: null,
      setStreak: (s) => set({ streak: s }),
    }),
    {
      name: `morgenpost-v2-${today()}`,
      partialize: (state) => ({
        // dailySessions intentionally NOT persisted — always re-fetched from server
        activeSessionId: state.activeSessionId,
        conversations: state.conversations,
        analyses: state.analyses,
      }),
    }
  )
);
