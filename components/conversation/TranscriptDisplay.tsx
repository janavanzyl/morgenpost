'use client';

interface TranscriptDisplayProps {
  transcript: string;
  onSend: (text: string) => void;
  onRetry: () => void;
  isSending: boolean;
}

export default function TranscriptDisplay({
  transcript,
  onSend,
  onRetry,
  isSending,
}: TranscriptDisplayProps) {
  return (
    <div className="bg-paper-100 rounded-card p-4 shadow-card space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-ink-500 font-medium">
        Deine Antwort
      </p>
      <p className="text-ink-900 text-sm leading-relaxed">{transcript}</p>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onRetry}
          disabled={isSending}
          className="flex-1 py-2 rounded-lg border border-paper-200 text-ink-700 text-sm font-medium hover:bg-paper-200 transition-colors disabled:opacity-50"
        >
          Nochmal
        </button>
        <button
          onClick={() => onSend(transcript)}
          disabled={isSending}
          className="flex-1 py-2 rounded-lg bg-morning-700 text-paper-50 text-sm font-semibold hover:bg-morning-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSending ? (
            <span className="w-4 h-4 border-2 border-paper-200 border-t-transparent rounded-full animate-spin" />
          ) : null}
          Senden
        </button>
      </div>
    </div>
  );
}
