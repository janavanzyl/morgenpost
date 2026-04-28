'use client';

import { Exercise, FillBlankContent, MultipleChoiceContent, RewriteContent } from '@/types';
import FillBlankExercise from './FillBlankExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import RewriteExercise from './RewriteExercise';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onComplete: (id: string) => void;
}

const typeLabel: Record<string, string> = {
  fill_blank: 'Lückentext',
  multiple_choice: 'Multiple Choice',
  rewrite: 'Umschreiben',
};

export default function ExerciseCard({ exercise, index, onComplete }: ExerciseCardProps) {
  return (
    <div className="bg-paper-100 rounded-card shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-medium text-morning-700">
          Übung {index + 1} · {typeLabel[exercise.type] ?? exercise.type}
        </span>
        {exercise.completed && (
          <span className="text-green-600 text-xs font-bold">✓ Erledigt</span>
        )}
      </div>

      {exercise.type === 'fill_blank' && (
        <FillBlankExercise
          content={exercise.content as FillBlankContent}
          completed={exercise.completed}
          onComplete={() => onComplete(exercise.id)}
        />
      )}

      {exercise.type === 'multiple_choice' && (
        <MultipleChoiceExercise
          content={exercise.content as MultipleChoiceContent}
          completed={exercise.completed}
          onComplete={() => onComplete(exercise.id)}
        />
      )}

      {exercise.type === 'rewrite' && (
        <RewriteExercise
          content={exercise.content as RewriteContent}
          completed={exercise.completed}
          onComplete={() => onComplete(exercise.id)}
        />
      )}
    </div>
  );
}
