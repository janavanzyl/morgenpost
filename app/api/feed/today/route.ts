import { NextResponse } from 'next/server';
import { getSupabaseAdmin, USER_UUID, todayDate } from '@/lib/supabase-server';
import { getAnthropic } from '@/lib/anthropic';
import { fetchFiveStories } from '@/lib/rss';
import { Session } from '@/types';

export const dynamic = 'force-dynamic';

async function generateBriefing(
  newsTitle: string,
  newsDescription: string
): Promise<{ germanBriefing: string; quote: string; quoteAuthor: string | null }> {
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    temperature: 0,
    system:
      'You are a German language teacher creating daily reading material for B1 learners. Always respond with valid JSON only, no markdown fences, no explanation.',
    messages: [
      {
        role: 'user',
        content: `Based on this positive news story, write a 100-word German summary suitable for B1 learners. Use common vocabulary, short sentences, and primarily present or perfect tense. Also provide an inspirational German quote relevant to the theme.

News Title: ${newsTitle}
News Summary: ${newsDescription}

Respond with this exact JSON:
{
  "germanBriefing": "...",
  "quote": "...",
  "quoteAuthor": "..." or null
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function GET() {
  try {
    const today = todayDate();
    const userId = USER_UUID();
    const db = getSupabaseAdmin();

    // Return existing sessions if all 5 exist for today
    const { data: existing } = await db
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('story_index', { ascending: true });

    if (existing && existing.length >= 5) {
      return NextResponse.json({ sessions: existing as Session[] });
    }

    const existingIndices = new Set((existing ?? []).map((s: Record<string, unknown>) => s.story_index));
    const missingIndices = [0, 1, 2, 3, 4].filter((i) => !existingIndices.has(i));

    const stories = await fetchFiveStories();
    const newSessions: Session[] = [];

    // Generate sequentially to avoid rate limits
    for (const idx of missingIndices) {
      const story = stories[idx];
      if (!story) continue;
      try {
        const { germanBriefing, quote, quoteAuthor } = await generateBriefing(
          story.title,
          story.description
        );
        const { data, error } = await db
          .from('sessions')
          .upsert(
            {
              user_id: userId,
              date: today,
              story_index: idx,
              news_title: story.title,
              news_url: story.url,
              news_source: story.source,
              german_briefing: germanBriefing,
              quote,
              quote_author: quoteAuthor,
            },
            { onConflict: 'user_id,date,story_index', ignoreDuplicates: true }
          )
          .select('*')
          .single();
        if (error) console.error(`[feed] DB upsert failed for story ${idx}:`, error);
        if (!error && data) newSessions.push(data as Session);
      } catch (err) {
        console.error(`[feed] Failed to generate story ${idx}:`, err);
      }
    }

    await db
      .from('user_streak')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    const all = [...(existing ?? []), ...newSessions].sort(
      (a, b) => (a as Session).story_index - (b as Session).story_index
    ) as Session[];

    return NextResponse.json({ sessions: all }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[/api/feed/today]', err);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  }
}
