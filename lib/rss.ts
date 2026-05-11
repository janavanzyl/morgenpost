import { XMLParser } from 'fast-xml-parser';
import he from 'he';
import striptags from 'striptags';
import { NewsItem } from '@/types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export const RSS_FEEDS = [
  { url: 'https://www.goodnewsnetwork.org/feed/', source: 'Good News Network' },
  { url: 'https://www.goodgoodgood.co/feed/', source: 'Good Good Good' },
  { url: 'https://www.positive.news/feed/', source: 'Positive News' },
  { url: 'https://www.optimistdaily.com/feed/', source: 'The Optimist Daily' },
  { url: 'https://www.treehugger.com/feeds/latest/', source: 'TreeHugger' },
];

const FALLBACKS: Record<string, NewsItem> = {
  'Good News Network': {
    title: 'Scientists develop biodegradable packaging from seaweed',
    url: 'https://www.goodnewsnetwork.org',
    description: 'Researchers have created a fully biodegradable alternative to plastic packaging using seaweed that dissolves harmlessly in seawater within weeks, offering a promising solution to ocean plastic pollution.',
    source: 'Good News Network',
    publishedAt: new Date().toISOString(),
  },
  'Good Good Good': {
    title: 'Record number of young people volunteering in local communities',
    url: 'https://www.goodgoodgood.co',
    description: 'A new report shows that volunteering among 18–25 year olds has reached its highest level in a decade, with millions giving their time to support neighbours, plant trees, and build community resilience.',
    source: 'Good Good Good',
    publishedAt: new Date().toISOString(),
  },
  'Positive News': {
    title: 'Renewable energy now powers majority of homes in several countries',
    url: 'https://www.positive.news',
    description: 'Solar and wind power have surpassed fossil fuels as the primary electricity source in multiple European nations, marking a historic shift driven by falling costs and growing public investment.',
    source: 'Positive News',
    publishedAt: new Date().toISOString(),
  },
  'The Optimist Daily': {
    title: 'Coral reef restoration project shows remarkable recovery',
    url: 'https://www.optimistdaily.com',
    description: 'Marine biologists report that a large-scale coral restoration initiative has successfully regrown healthy reef ecosystems across several sites, providing new habitat for hundreds of fish species.',
    source: 'The Optimist Daily',
    publishedAt: new Date().toISOString(),
  },
  'TreeHugger': {
    title: 'Endangered whale species makes stunning comeback',
    url: 'https://www.treehugger.com',
    description: 'Thanks to decades of international conservation efforts and stricter fishing regulations, humpback whale populations have rebounded to near pre-hunting levels — a stunning success for wildlife protection.',
    source: 'TreeHugger',
    publishedAt: new Date().toISOString(),
  },
};

const SKIP_PATTERNS = [
  /good news in history/i,
  /on this day in history/i,
  /\bthis day in\b/i,
];

function cleanText(raw: string): string {
  return he.decode(striptags(String(raw))).trim().replace(/\s+/g, ' ');
}

async function fetchFeedItems(url: string, source: string, count = 5): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Morgenpost/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const data = parser.parse(xml);
    const items: unknown[] = data?.rss?.channel?.item ?? data?.feed?.entry ?? [];
    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .slice(0, count + 4)
      .map((item) => {
        const i = item as Record<string, unknown>;
        const title = cleanText(String(i.title ?? ''));
        const rawLink = i.link;
        const link =
          typeof rawLink === 'object' && rawLink !== null
            ? String((rawLink as Record<string, unknown>)['@_href'] ?? '')
            : String(rawLink ?? i.guid ?? '');
        const description = cleanText(
          String(i.description ?? i.summary ?? i['content:encoded'] ?? '')
        ).slice(0, 1500);
        const pubDate = String(i.pubDate ?? i.published ?? new Date().toISOString());
        if (!title || !link) return null;
        if (SKIP_PATTERNS.some((p) => p.test(title))) return null;
        return { title, url: link, description, source, publishedAt: pubDate } as NewsItem;
      })
      .filter((x): x is NewsItem => x !== null)
      .slice(0, count);
  } catch {
    return [];
  }
}

// Returns up to `count` candidates per feed, keyed by source name
export async function fetchStoryCandidates(): Promise<Record<string, NewsItem[]>> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeedItems(f.url, f.source, 5))
  );

  const bySource: Record<string, NewsItem[]> = {};
  RSS_FEEDS.forEach((feed, i) => {
    const result = results[i];
    const items = result.status === 'fulfilled' ? result.value : [];
    bySource[feed.source] = items.length > 0 ? items : [FALLBACKS[feed.source]];
  });

  return bySource;
}

// Legacy export — kept for any other callers
export async function fetchFiveStories(): Promise<NewsItem[]> {
  const bySource = await fetchStoryCandidates();
  return Object.values(bySource).map((items) => items[0]);
}

export async function fetchPositiveNews(): Promise<NewsItem> {
  const stories = await fetchFiveStories();
  return stories[0];
}
