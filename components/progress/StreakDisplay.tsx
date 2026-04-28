interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
}

export default function StreakDisplay({
  currentStreak,
  longestStreak,
  totalSessions,
}: StreakDisplayProps) {
  return (
    <div className="bg-morning-700 text-paper-50 rounded-card p-5 shadow-card">
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-5xl">🔥</span>
        <div>
          <p className="text-5xl font-bold font-serif leading-none">{currentStreak}</p>
          <p className="text-sm opacity-80 mt-0.5">Tage in Folge</p>
        </div>
      </div>
      <div className="flex justify-around border-t border-white border-opacity-20 pt-4">
        <div className="text-center">
          <p className="text-xl font-bold font-serif">{longestStreak}</p>
          <p className="text-[10px] opacity-70 uppercase tracking-wide mt-0.5">Rekord</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold font-serif">{totalSessions}</p>
          <p className="text-[10px] opacity-70 uppercase tracking-wide mt-0.5">Gesamt</p>
        </div>
      </div>
    </div>
  );
}
