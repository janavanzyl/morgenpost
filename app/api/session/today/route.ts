import { NextResponse } from 'next/server';
import { getSupabaseAdmin, USER_UUID, todayDate } from '@/lib/supabase-server';
import { fetchPositiveNews } from '@/lib/rss';
import { Session } from '@/types';

export async function GET() {
  try {
    const today = todayDate();
    const userId = USER_UUID();
    const db = getSupabaseAdmin();

    const { data: existing } = await db
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      return NextResponse.json({ session: existing as Session, isNew: false });
    }

    const news = await fetchPositiveNews();

    const briefingRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/briefing`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsTitle: news.title,
          newsDescription: news.description,
          newsSource: news.source,
        }),
      }
    );

    if (!briefingRes.ok) throw new Error('Briefing generation failed');

    const { germanBriefing, quote, quoteAuthor } = await briefingRes.json();

    const { data: session, error } = await db
      .from('sessions')
      .insert({
        user_id: userId,
        date: today,
        news_title: news.title,
        news_url: news.url,
        news_source: news.source,
        german_briefing: germanBriefing,
        quote,
        quote_author: quoteAuthor,
      })
      .select('*')
      .single();

    if (error) throw error;

    await db
      .from('user_streak')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    return NextResponse.json({ session: session as Session, isNew: true });
  } catch (err) {
    console.error('[/api/session/today]', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
