'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Session } from '@/types';
import { useStore } from '@/lib/session-store';
import QuoteBlock from './QuoteBlock';

interface StoryCardProps {
  session: Session;
  index: number;
}

const statusConfig = {
  not_started: { label: 'Beginnen', colour: 'bg-morning-700 text-paper-50', disabled: false },
  in_progress: { label: 'Fortsetzen →', colour: 'bg-morning-600 text-paper-50', disabled: false },
  completed: { label: '✓ Abgeschlossen', colour: 'bg-paper-200 text-ink-500', disabled: true },
};

export default function StoryCard({ session, index }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const { setActiveSessionId } = useStore();

  const cfg = statusConfig[session.conversation_status];

  const handleStart = () => {
    setActiveSessionId(session.id);
    router.push('/conversation');
  };

  return (
    <div
      className={clsx(
        'bg-paper-100 rounded-card shadow-card overflow-hidden transition-all',
        session.conversation_status === 'completed' && 'opacity-80'
      )}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-4 flex items-start gap-3"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-morning-700 text-paper-50 text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-morning-700 font-medium mb-0.5">
            {session.news_source}
          </p>
          <p className="font-serif text-sm font-semibold text-ink-900 leading-snug line-clamp-2">
            {session.news_title}
          </p>
        </div>
        <span className="flex-shrink-0 text-ink-400 text-lg leading-none mt-0.5">
          {expanded ? '↑' : '↓'}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-paper-200 pt-4">
          <p className="briefing-text">{session.german_briefing}</p>
          <QuoteBlock quote={session.quote} author={session.quote_author} />

          <div className="flex items-center gap-3 pt-1">
            <a
              href={session.news_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-morning-700 underline underline-offset-2 hover:text-morning-800"
            >
              Originalartikel lesen ↗
            </a>
            <button
              onClick={handleStart}
              disabled={cfg.disabled}
              className={clsx(
                'ml-auto px-5 py-2.5 rounded-card text-sm font-semibold transition-all active:scale-95',
                cfg.colour,
                cfg.disabled ? 'cursor-not-allowed' : 'hover:opacity-90'
              )}
            >
              {cfg.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
