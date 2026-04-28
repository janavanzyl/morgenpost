import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';

interface BriefingRequest {
  newsTitle: string;
  newsDescription: string;
  newsSource: string;
}

interface BriefingResponse {
  germanBriefing: string;
  quote: string;
  quoteAuthor: string | null;
}

async function callClaude(newsTitle: string, newsDescription: string): Promise<BriefingResponse> {
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    temperature: 0,
    system:
      'You are a German language teacher creating daily reading material for B1 learners. Always respond with valid JSON only, no markdown fences, no explanation.',
    messages: [
      {
        role: 'user',
        content: `Based on this positive news story, write a 100-word German summary suitable for B1 learners. Use common vocabulary, short sentences, and primarily present or perfect tense. Also provide an inspirational German quote relevant to the theme (can be a famous quote or one you compose).

News Title: ${newsTitle}
News Summary: ${newsDescription}

Respond with this exact JSON structure:
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
  return JSON.parse(cleaned) as BriefingResponse;
}

export async function POST(req: NextRequest) {
  try {
    const body: BriefingRequest = await req.json();
    const { newsTitle, newsDescription } = body;

    let result: BriefingResponse;
    try {
      result = await callClaude(newsTitle, newsDescription);
    } catch {
      result = await callClaude(newsTitle, newsDescription);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/briefing]', err);
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
  }
}
