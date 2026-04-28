'use client';

import { eachDayOfInterval, subDays, format, isToday, startOfDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { clsx } from 'clsx';

interface CalendarHeatmapProps {
  activeDates: string[];
}

export default function CalendarHeatmap({ activeDates }: CalendarHeatmapProps) {
  const today = new Date();
  const start = subDays(today, 34);
  const days = eachDayOfInterval({ start, end: today });

  const activeSet = new Set(
    activeDates.map((d) => format(startOfDay(parseISO(d)), 'yyyy-MM-dd'))
  );

  const weeks: Date[][] = [];
  let week: Date[] = [];
  days.forEach((day, i) => {
    week.push(day);
    if (week.length === 7 || i === days.length - 1) {
      weeks.push(week);
      week = [];
    }
  });

  return (
    <div className="bg-paper-100 rounded-card shadow-card p-4 space-y-3">
      <h2 className="font-serif text-base font-bold text-ink-900">Aktivität</h2>
      <div className="flex gap-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const active = activeSet.has(key);
              const todayDay = isToday(day);
              return (
                <div
                  key={key}
                  title={format(day, 'd. MMMM', { locale: de })}
                  className={clsx(
                    'w-7 h-7 rounded-sm transition-colors',
                    active
                      ? 'bg-morning-700'
                      : todayDay
                      ? 'bg-paper-200 ring-2 ring-morning-600'
                      : 'bg-paper-200'
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-caption text-ink-500">
        <div className="w-3 h-3 rounded-sm bg-paper-200" />
        <span>Kein Eintrag</span>
        <div className="w-3 h-3 rounded-sm bg-morning-700 ml-2" />
        <span>Aktiv</span>
      </div>
    </div>
  );
}
