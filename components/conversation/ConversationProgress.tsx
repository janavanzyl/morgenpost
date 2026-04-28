interface ConversationProgressProps {
  current: number;
  total?: number;
}

export default function ConversationProgress({ current, total = 3 }: ConversationProgressProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i < current - 1
                ? 'bg-morning-700'
                : i === current - 1
                ? 'bg-morning-600'
                : 'bg-paper-200'
            }`}
          />
        ))}
      </div>
      <span className="text-caption text-ink-500">
        Austausch {current} von {total}
      </span>
    </div>
  );
}
