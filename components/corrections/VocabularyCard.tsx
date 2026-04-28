import { VocabItem } from '@/types';

export default function VocabularyCard({ item }: { item: VocabItem }) {
  return (
    <div className="bg-paper-100 rounded-card shadow-card p-4 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-serif font-bold text-ink-900 text-base">{item.word}</span>
        <span className="text-caption text-ink-500 shrink-0">{item.translation}</span>
      </div>
      <p className="text-sm text-ink-700 italic leading-snug">&bdquo;{item.example}&ldquo;</p>
    </div>
  );
}
