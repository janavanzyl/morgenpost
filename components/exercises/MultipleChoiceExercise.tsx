'use client';

import { useState } from 'react';
import { MultipleChoiceContent } from '@/types';
import { clsx } from 'clsx';

interface Props {
  content: MultipleChoiceContent;
  onComplete: () => void;
  completed: boolean;
}

export default function MultipleChoiceExercise({ content, onComplete, completed }: Props) {
  const [selected, setSelected] = useState<string | null>(completed ? content.answer : null);
  const [submitted, setSubmitted] = useState(completed);

  const submit = (option: string) => {
    if (submitted) return;
    setSelected(option);
    setSubmitted(true);
    if (option === content.answer) onComplete();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-900 font-medium leading-relaxed">{content.question}</p>

      <div className="space-y-2">
        {content.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = opt === content.answer;
          const showResult = submitted;

          return (
            <button
              key={opt}
              onClick={() => submit(opt)}
              disabled={submitted}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                showResult && isCorrect
                  ? 'bg-green-50 border-green-400 text-green-800 font-medium'
                  : showResult && isSelected && !isCorrect
                  ? 'bg-red-50 border-red-400 text-red-700'
                  : isSelected
                  ? 'bg-morning-700 bg-opacity-10 border-morning-600 text-ink-900'
                  : 'bg-paper-50 border-paper-200 text-ink-700 hover:bg-paper-100'
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {submitted && content.explanation && (
        <p className="text-caption text-ink-500 italic">{content.explanation}</p>
      )}
    </div>
  );
}
