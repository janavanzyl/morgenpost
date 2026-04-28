import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Session } from '@/types';

export default function SessionHistory({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-paper-100 rounded-card p-4 text-center shadow-card">
        <p className="text-ink-500 text-sm">Noch keine Sitzungen vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-paper-100 rounded-card shadow-card divide-y divide-paper-200 overflow-hidden">
      {sessions.map((s) => (
        <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{s.news_title}</p>
            <p className="text-caption text-ink-500">
              {format(parseISO(s.date), 'EEEE, d. MMMM', { locale: de })}
            </p>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
              s.conversation_status === 'completed'
                ? 'bg-green-100 text-green-700'
                : s.conversation_status === 'in_progress'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-paper-200 text-ink-500'
            }`}
          >
            {s.conversation_status === 'completed'
              ? 'Fertig'
              : s.conversation_status === 'in_progress'
              ? 'Läuft'
              : 'Offen'}
          </span>
        </div>
      ))}
    </div>
  );
}
