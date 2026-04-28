interface NewsBannerProps {
  title: string;
  url: string;
  source: string;
}

export default function NewsBanner({ title, url, source }: NewsBannerProps) {
  return (
    <div className="bg-morning-700 text-paper-50 px-4 py-3 rounded-card">
      <p className="text-[10px] font-medium uppercase tracking-widest opacity-80 mb-1">
        Quelle: {source}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-serif font-semibold leading-snug hover:underline line-clamp-2"
      >
        {title} ↗
      </a>
    </div>
  );
}
