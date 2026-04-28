'use client';

import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

interface StartConversationButtonProps {
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function StartConversationButton({ status }: StartConversationButtonProps) {
  const router = useRouter();

  const label =
    status === 'completed'
      ? 'Gespräch abgeschlossen ✓'
      : status === 'in_progress'
      ? 'Gespräch fortsetzen →'
      : 'Gespräch beginnen →';

  return (
    <button
      onClick={() => router.push('/conversation')}
      disabled={status === 'completed'}
      className={clsx(
        'w-full py-4 rounded-card font-semibold text-base transition-all',
        status === 'completed'
          ? 'bg-paper-200 text-ink-500 cursor-not-allowed'
          : 'bg-morning-700 text-paper-50 hover:bg-morning-800 active:scale-95 shadow-card'
      )}
    >
      {label}
    </button>
  );
}
