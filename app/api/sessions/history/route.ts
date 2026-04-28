import { NextResponse } from 'next/server';
import { getSupabaseAdmin, USER_UUID } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('sessions')
      .select('id, date, news_title, news_source, conversation_status')
      .eq('user_id', USER_UUID())
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    console.error('[/api/sessions/history]', err);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
