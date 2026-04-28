import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { Message } from '@/types';

interface MessageRequest {
  sessionId: string;
  userMessage: string;
  exchangeNumber: number;
  conversationHistory: Message[];
  maxExchanges?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: MessageRequest = await req.json();
    const { sessionId, userMessage, exchangeNumber, conversationHistory, maxExchanges = 10 } = body;

    const updatedHistory: Message[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are a warm, encouraging German language conversation partner helping a B1 learner practise their German. The learner has just read a German news briefing. Have a genuine, engaging conversation about the topic. Ask thoughtful follow-up questions to keep the discussion going. If you notice a significant grammar error, weave the correct form naturally into your reply without making it feel like a correction. Keep your responses to 3-5 sentences. Respond in German only. This is exchange ${exchangeNumber} of ${maxExchanges}.`,
      messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const finalHistory: Message[] = [
      ...updatedHistory,
      { role: 'assistant', content: assistantMessage },
    ];

    const isComplete = exchangeNumber >= maxExchanges;
    const newStatus = isComplete ? 'completed' : 'in_progress';

    await getSupabaseAdmin()
      .from('sessions')
      .update({
        conversation_transcript: finalHistory,
        conversation_status: newStatus,
      })
      .eq('id', sessionId);

    return NextResponse.json({ assistantMessage, updatedHistory: finalHistory, isComplete });
  } catch (err) {
    console.error('[/api/conversation/message]', err);
    return NextResponse.json({ error: 'Conversation failed' }, { status: 500 });
  }
}
