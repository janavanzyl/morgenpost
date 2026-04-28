import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { exerciseId }: { exerciseId: string } = await req.json();
    await getSupabaseAdmin().from('exercises').update({ completed: true }).eq('id', exerciseId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/exercises/complete]', err);
    return NextResponse.json({ error: 'Failed to mark complete' }, { status: 500 });
  }
}
