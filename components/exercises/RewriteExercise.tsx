'use client';

import { useState } from 'react';
import { RewriteContent } from '@/types';

interface Props {
  content: RewriteContent;
  onComplete: () => void;
  completed: boolean;
}

export default function RewriteExercise({ content, onComplete, completed }: Props) {
  const [showAnswer, setShowAnswer] = useState(completed);
  const [userText, setUserText] = useState('');

  const reveal = () => {
    setShowAnswer(true);
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-caption text-ink-500 mb-1 font-medium uppercase tracking-widest">
          Schwerpunkt: {content.focus}
        </p>
        <p className="text-sm text-ink-900 leading-relaxed">{content.prompt}</p>
      </div>

      {!showAnswer && (
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          rows={3}
          placeholder="Schreibe deine Antwort hier…"
          className="w-full px-3 py-2 rounded-lg border border-paper-200 bg-paper-50 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-morning-600 resize-none"
        />
      )}

      {!showAnswer && (
        <button
          onClick={reveal}
          className="w-full py-2 rounded-lg border border-morning-600 text-morning-700 text-sm font-semibold hover:bg-morning-700 hover:text-paper-50 transition-colors"
        >
          Musterlösung anzeigen
        </button>
      )}

      {showAnswer && (
        <div className="bg-green-50 rounded-lg px-4 py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-medium text-green-700">
            Musterlösung
          </p>
          <p className="text-sm text-green-900 font-medium">{content.sample_answer}</p>
        </div>
      )}
    </div>
  );
}
