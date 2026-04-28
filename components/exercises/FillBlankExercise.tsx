'use client';

import { useState } from 'react';
import { FillBlankContent } from '@/types';
import { clsx } from 'clsx';

interface Props {
  content: FillBlankContent;
  onComplete: () => void;
  completed: boolean;
}

export default function FillBlankExercise({ content, onComplete, completed }: Props) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(completed);
  const [correct, setCorrect] = useState<boolean | null>(completed ? true : null);

  const check = () => {
    const isRight = answer.trim().toLowerCase() === content.answer.toLowerCase();
    setCorrect(isRight);
    setRevealed(true);
    if (isRight) onComplete();
  };

  const parts = content.sentence.split('___');

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-700 leading-relaxed">
        {parts[0]}
        <span className="inline-block border-b-2 border-morning-600 min-w-[60px] text-center font-medium text-ink-900 mx-1">
          {revealed ? content.answer : answer || '        '}
        </span>
        {parts[1]}
      </p>

      {content.hint && !revealed && (
        <p className="text-caption text-ink-500 italic">Tipp: {content.hint}</p>
      )}

      {!revealed && (
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            placeholder="Deine Antwort…"
            className="flex-1 px-3 py-2 rounded-lg border border-paper-200 bg-paper-50 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-morning-600"
          />
          <button
            onClick={check}
            disabled={!answer.trim()}
            className="px-4 py-2 bg-morning-700 text-paper-50 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-morning-800 transition-colors"
          >
            Prüfen
          </button>
        </div>
      )}

      {revealed && (
        <div
          className={clsx(
            'rounded-lg px-3 py-2 text-sm font-medium',
            correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}
        >
          {correct ? '✓ Richtig!' : `✕ Die Antwort ist: ${content.answer}`}
        </div>
      )}
    </div>
  );
}
