import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PageHeaderProps {
  subtitle?: string;
}

export default function PageHeader({ subtitle }: PageHeaderProps) {
  const today = new Date();
  const dateStr = format(today, 'EEEE, d. MMMM yyyy', { locale: de });

  return (
    <header className="bg-paper-50 border-b border-paper-200 px-4 pt-4 pb-3">
      <p className="text-caption text-ink-500 text-center uppercase tracking-widest mb-1">
        {dateStr}
      </p>
      <h1 className="font-serif text-2xl font-bold text-ink-900 text-center tracking-tight">
        Morgenpost
      </h1>
      {subtitle && (
        <p className="text-caption text-ink-500 text-center mt-1">{subtitle}</p>
      )}
    </header>
  );
}
