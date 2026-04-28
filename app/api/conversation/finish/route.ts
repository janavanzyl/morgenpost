import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { Message } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, history }: { sessionId: string; history: Message[] } = await req.json();

    const { error } = await getSupabaseAdmin()
      .from('sessions')
      .update({
        conversation_transcript: history,
        conversation_status: 'completed',
      })
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/conversation/finish]', err);
    return NextResponse.json({ error: 'Failed to finish conversation' }, { status: 500 });
  }
}
