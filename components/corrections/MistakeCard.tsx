import { Mistake } from '@/types';

const categoryLabels: Record<string, string> = {
  grammar: 'Grammatik',
  vocabulary: 'Wortschatz',
  word_order: 'Wortstellung',
  article: 'Artikel',
  case: 'Kasus',
};

export default function MistakeCard({ mistake }: { mistake: Mistake }) {
  return (
    <div className="bg-paper-100 rounded-card shadow-card p-4 space-y-3">
      {mistake.category && (
        <span className="inline-block text-[10px] uppercase tracking-widest font-medium text-morning-700 bg-morning-700 bg-opacity-10 px-2 py-0.5 rounded-full">
          {categoryLabels[mistake.category] ?? mistake.category}
        </span>
      )}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-red-500 text-xs font-bold mt-0.5 shrink-0">✕</span>
          <p className="text-sm text-ink-700 line-through decoration-red-400">
            {mistake.original_text}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600 text-xs font-bold mt-0.5 shrink-0">✓</span>
          <p className="text-sm text-ink-900 font-medium">{mistake.correction}</p>
        </div>
      </div>
      <p className="text-caption text-ink-500 border-t border-paper-200 pt-2">
        {mistake.explanation}
      </p>
    </div>
  );
}
