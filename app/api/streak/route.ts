import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, USER_UUID } from '@/lib/supabase-server';
import { subDays, parseISO, isEqual, startOfDay } from 'date-fns';

export async function GET() {
  try {
    const userId = USER_UUID();
    const { data, error } = await getSupabaseAdmin()
      .from('user_streak')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        total_sessions: 0,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/streak GET]', err);
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date }: { date: string } = await req.json();
    const userId = USER_UUID();
    const db = getSupabaseAdmin();
    const today = startOfDay(parseISO(date));

    const { data: existing } = await db
      .from('user_streak')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      const newStreak = {
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: date,
        total_sessions: 1,
        updated_at: new Date().toISOString(),
      };
      await db.from('user_streak').insert(newStreak);
      return NextResponse.json(newStreak);
    }

    if (existing.last_active_date) {
      const lastActive = startOfDay(parseISO(existing.last_active_date));
      if (isEqual(lastActive, today)) {
        return NextResponse.json(existing);
      }
    }

    const yesterday = startOfDay(subDays(today, 1));
    const lastActive = existing.last_active_date
      ? startOfDay(parseISO(existing.last_active_date))
      : null;

    const isConsecutive = lastActive ? isEqual(lastActive, yesterday) : false;
    const newCurrentStreak = isConsecutive ? existing.current_streak + 1 : 1;
    const newLongest = Math.max(newCurrentStreak, existing.longest_streak);

    const updated = {
      current_streak: newCurrentStreak,
      longest_streak: newLongest,
      last_active_date: date,
      total_sessions: existing.total_sessions + 1,
      updated_at: new Date().toISOString(),
    };

    await db.from('user_streak').update(updated).eq('user_id', userId);

    return NextResponse.json({ ...existing, ...updated });
  } catch (err) {
    console.error('[/api/streak POST]', err);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}
