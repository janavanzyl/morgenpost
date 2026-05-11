import { NextResponse } from 'next/server';
import { getSupabaseAdmin, USER_UUID, todayDate } from '@/lib/supabase-server';
import { getAnthropic } from '@/lib/anthropic';
import { fetchStoryCandidates } from '@/lib/rss';
import { NewsItem, Session } from '@/types';

export const dynamic = 'force-dynamic';

// Picks the single most compelling story from each source's candidates.
// Guarantees exactly 1 story per source (5 total).
async function selectBestStories(bySource: Record<string, NewsItem[]>): Promise<NewsItem[]> {
  const sources = Object.keys(bySource);

  const list = sources
    .map((src, si) => {
      const items = bySource[src];
      const numbered = items
        .map((s, i) => `  ${i + 1}. ${s.title}\n     ${s.description.slice(0, 200)}`)
        .join('\n');
      return `SOURCE ${si + 1} — ${src}:\n${numbered}`;
    })
    .join('\n\n');

  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    temperature: 0,
    system: 'You are a news editor. Respond with valid JSON only, no markdown, no explanation.',
    messages: [
      {
        role: 'user',
        content: `For each of the ${sources.length} news sources below, pick the single most compelling story. Prioritise surprising breakthroughs, powerful human stories, meaningful progress, and genuinely uplifting outcomes. Avoid generic feel-good fluff.

${list}

Respond with JSON where each key is the source number (1-based) and value is the story index (1-based) chosen from that source:
{"1": 2, "2": 1, "3": 3, "4": 1, "5": 2}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  try {
    const picks = JSON.parse(text.trim()) as Record<string, number>;
    return sources.map((src, si) => {
      const idx = (picks[String(si + 1)] ?? 1) - 1;
      return bySource[src][idx] ?? bySource[src][0];
    });
  } catch {
    return sources.map((src) => bySource[src][0]);
  }
}

async function generateBriefing(
  newsTitle: string,
  newsDescription: string
): Promise<{ germanTitle: string; germanBriefing: string; quote: string; quoteAuthor: string | null }> {
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    temperature: 0,
    system:
      'You are a German language teacher creating daily reading material for B1 learners. Always respond with valid JSON only, no markdown fences, no explanation.',
    messages: [
      {
        role: 'user',
        content: `Based on this positive news story, write a German title and summary for B1 learners. The summary must be AT LEAST 170 words. You may use your own knowledge to add context. Structure the summary in 3 short paragraphs: (1) what happened, (2) why it matters, (3) what it means for the future. Use clear vocabulary and short sentences. Vary tenses. Also provide an inspirational German quote relevant to the theme.

News Title: ${newsTitle}
News Summary: ${newsDescription}

Respond with this exact JSON:
{
  "germanTitle": "...",
  "germanBriefing": "...",
  "quote": "...",
  "quoteAuthor": "..." or null
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  // Extract the first JSON object from the response, tolerating extra text
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error('[generateBriefing] No JSON found in response:', text.slice(0, 200));
    throw new Error('No JSON in briefing response');
  }
  return JSON.parse(match[0]);
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

    const bySource = await fetchStoryCandidates();
    const stories = await selectBestStories(bySource);
    const newSessions: Session[] = [];

    // Generate sequentially to avoid rate limits
    for (const idx of missingIndices) {
      const story = stories[idx];
      console.log(`[feed] story ${idx}:`, story?.title ?? 'MISSING');
      if (!story) continue;
      let briefing: { germanBriefing: string; quote: string; quoteAuthor: string | null };
      try {
        briefing = await generateBriefing(story.title, story.description);
      } catch (err) {
        console.error(`[feed] generateBriefing failed for story ${idx}, using fallback:`, err);
        briefing = {
          germanTitle: null as unknown as string,
          germanBriefing: `Heute gibt es eine interessante Geschichte: ${story.title}. ${story.description.slice(0, 300)}`,
          quote: 'Jeder Tag bringt neue Möglichkeiten.',
          quoteAuthor: null,
        };
      }
      try {
        const { data, error } = await db
          .from('sessions')
          .upsert(
            {
              user_id: userId,
              date: today,
              story_index: idx,
              news_title: story.title,
              german_title: briefing.germanTitle ?? null,
              news_url: story.url,
              news_source: story.source,
              german_briefing: briefing.germanBriefing,
              quote: briefing.quote,
              quote_author: briefing.quoteAuthor,
            },
            { onConflict: 'user_id,date,story_index', ignoreDuplicates: true }
          )
          .select('*')
          .single();
        if (error) console.error(`[feed] DB upsert failed for story ${idx}:`, error);
        if (!error && data) newSessions.push(data as Session);
      } catch (err) {
        console.error(`[feed] DB upsert threw for story ${idx}:`, err);
      }
    }

    await db
      .from('user_streak')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    // Re-fetch all sessions rather than relying on upsert return values,
    // which can return 0 rows under race conditions with ignoreDuplicates.
    const { data: finalSessions } = await db
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('story_index', { ascending: true });

    return NextResponse.json({ sessions: (finalSessions ?? []) as Session[] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[/api/feed/today]', err);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  }
}
