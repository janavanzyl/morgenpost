import { NextResponse } from 'next/server';
import { fetchPositiveNews } from '@/lib/rss';

export async function GET() {
  try {
    const news = await fetchPositiveNews();
    return NextResponse.json(news);
  } catch (err) {
    console.error('[/api/news]', err);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 503 });
  }
}
