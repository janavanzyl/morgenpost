interface QuoteBlockProps {
  quote: string;
  author: string | null;
}

export default function QuoteBlock({ quote, author }: QuoteBlockProps) {
  return (
    <div className="border-l-4 border-morning-600 pl-4 py-1">
      <p className="font-serif text-base italic text-ink-700 leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
      {author && (
        <p className="text-caption text-ink-500 mt-2 font-medium">— {author}</p>
      )}
    </div>
  );
}
