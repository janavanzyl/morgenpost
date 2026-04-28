interface BriefingCardProps {
  text: string;
}

export default function BriefingCard({ text }: BriefingCardProps) {
  return (
    <div className="bg-paper-100 rounded-card shadow-card p-5">
      <p className="text-[10px] font-medium uppercase tracking-widest text-ink-500 mb-3">
        Heutiger Artikel · B1
      </p>
      <p className="briefing-text">{text}</p>
    </div>
  );
}
