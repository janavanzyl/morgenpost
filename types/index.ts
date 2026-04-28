export interface NewsItem {
  title: string;
  url: string;
  description: string;
  source: string;
  publishedAt: string;
}

export interface Session {
  id: string;
  user_id: string;
  date: string;
  story_index: number;
  news_title: string;
  news_url: string;
  news_source: string;
  german_briefing: string;
  quote: string;
  quote_author: string | null;
  conversation_transcript: Message[] | null;
  conversation_status: 'not_started' | 'in_progress' | 'completed';
  analysis_completed: boolean;
  created_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Mistake {
  id: string;
  session_id: string;
  original_text: string;
  correction: string;
  explanation: string;
  category: string | null;
  created_at: string;
}

export interface VocabItem {
  id: string;
  session_id: string;
  word: string;
  translation: string;
  example: string;
  created_at: string;
}

export type ExerciseType = 'fill_blank' | 'multiple_choice' | 'rewrite';

export interface FillBlankContent {
  sentence: string;
  answer: string;
  hint: string;
}

export interface MultipleChoiceContent {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface RewriteContent {
  prompt: string;
  sample_answer: string;
  focus: string;
}

export type ExerciseContent = FillBlankContent | MultipleChoiceContent | RewriteContent;

export interface Exercise {
  id: string;
  session_id: string;
  type: ExerciseType;
  content: ExerciseContent;
  completed: boolean;
  created_at: string;
}

export interface StreakData {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_sessions: number;
  updated_at: string;
}

export type ConversationPhase =
  | 'idle'
  | 'ready_to_record'
  | 'recording'
  | 'transcribing'
  | 'transcript_review'
  | 'sending'
  | 'exchange_done'
  | 'completed'
  | 'error';

export interface AnalysisResult {
  mistakes: Omit<Mistake, 'id' | 'session_id' | 'created_at'>[];
  vocabulary: Omit<VocabItem, 'id' | 'session_id' | 'created_at'>[];
  exercises: { type: ExerciseType; content: ExerciseContent }[];
}
