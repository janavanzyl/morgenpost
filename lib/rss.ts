import { XMLParser } from 'fast-xml-parser';
import he from 'he';
import striptags from 'striptags';
import { NewsItem } from '@/types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const RSS_FEEDS = [
  { url: 'https://www.goodnewsnetwork.org/feed/', source: 'Good News Network' },
  { url: 'https://www.positive.news/feed/', source: 'Positive News' },
  { url: 'https://www.sunnyskyznews.com/feed/', source: 'Sunny Skyz' },
  { url: 'https://www.optimistdaily.com/feed/', source: 'The Optimist Daily' },
  { url: 'https://www.treehugger.com/feeds/latest/', source: 'TreeHugger' },
];

function cleanText(raw: string): string {
  return he.decode(striptags(String(raw))).trim().replace(/\s+/g, ' ');
}

async function fetchFeedItems(url: string, source: string, count = 3): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Morgenpost/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const data = parser.parse(xml);
    const items: unknown[] = data?.rss?.channel?.item ?? data?.feed?.entry ?? [];
    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .slice(0, count + 2)
      .map((item) => {
        const i = item as Record<string, unknown>;
        const title = cleanText(String(i.title ?? ''));
        const link = String(i.link ?? i.guid ?? '');
        const description = cleanText(
          String(i.description ?? i.summary ?? i['content:encoded'] ?? '')
        ).slice(0, 600);
        const pubDate = String(i.pubDate ?? i.published ?? new Date().toISOString());
        if (!title || !link) return null;
        return { title, url: link, description, source, publishedAt: pubDate } as NewsItem;
      })
      .filter((x): x is NewsItem => x !== null)
      .slice(0, count);
  } catch {
    return [];
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchFiveStories(): Promise<NewsItem[]> {
  // Fetch from all feeds in parallel, 2 stories each
  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeedItems(f.url, f.source, 2))
  );

  const all: NewsItem[] = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  );

  // Shuffle so the order varies each day, then take 5
  const shuffled = shuffleArray(all);

  if (shuffled.length >= 5) return shuffled.slice(0, 5);

  // Fallback stories if feeds fail
  const fallbacks: NewsItem[] = [
    {
      title: 'Scientists develop new biodegradable plastic from seaweed',
      url: 'https://www.goodnewsnetwork.org',
      description:
        'Researchers have created a fully biodegradable alternative to plastic using seaweed that dissolves harmlessly in seawater within weeks.',
      source: 'Good News Network',
      publishedAt: new Date().toISOString(),
    },
    {
      title: 'Record number of young people volunteering in local communities',
      url: 'https://www.positive.news',
      description:
        'A new report shows that volunteering among 18-25 year olds has reached its highest level in a decade, with millions giving their time to help others.',
      source: 'Positive News',
      publishedAt: new Date().toISOString(),
    },
    {
      title: 'Solar energy now cheaper than fossil fuels in most countries',
      url: 'https://www.optimistdaily.com',
      description:
        'The cost of solar panels has fallen so dramatically that renewable energy is now the most affordable option for electricity generation across the globe.',
      source: 'The Optimist Daily',
      publishedAt: new Date().toISOString(),
    },
    {
      title: 'Endangered whale species makes remarkable recovery',
      url: 'https://www.treehugger.com',
      description:
        'Thanks to decades of conservation efforts, the humpback whale population has rebounded to near pre-hunting levels, a stunning success story for wildlife protection.',
      source: 'TreeHugger',
      publishedAt: new Date().toISOString(),
    },
    {
      title: 'Community garden transforms abandoned lot into thriving green space',
      url: 'https://www.sunnyskyznews.com',
      description:
        'Residents came together to convert a neglected urban space into a flourishing garden that now feeds over 200 local families and hosts weekly community events.',
      source: 'Sunny Skyz',
      publishedAt: new Date().toISOString(),
    },
  ];

  const needed = 5 - shuffled.length;
  return [...shuffled, ...fallbacks.slice(0, needed)];
}

// Keep single-story export for backwards compatibility
export async function fetchPositiveNews(): Promise<NewsItem> {
  const stories = await fetchFiveStories();
  return stories[0];
}
