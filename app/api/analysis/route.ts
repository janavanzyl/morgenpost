import { NextRequest, NextResponse } from 'next/server';
import { getAnthropic } from '@/lib/anthropic';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { Message, AnalysisResult } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { sessionId }: { sessionId: string } = await req.json();
    const db = getSupabaseAdmin();

    const { data: session, error: fetchErr } = await db
      .from('sessions')
      .select('conversation_transcript')
      .eq('id', sessionId)
      .single();

    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const history = session.conversation_transcript as Message[];
    if (!history || history.length === 0) {
      return NextResponse.json({ error: 'No conversation to analyse' }, { status: 400 });
    }

    const transcriptText = history
      .map((m) => `[${m.role === 'user' ? 'Lerner' : 'Lehrer'}]: ${m.content}`)
      .join('\n\n');

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0,
      system:
        "You are an expert German language teacher. Analyse the learner's output thoroughly and respond with valid JSON only, no markdown fences.",
      messages: [
        {
          role: 'user',
          content: `Carefully analyse all lines marked [Lerner] in this German conversation transcript. Provide a thorough, honest analysis.

${transcriptText}

Return JSON with exactly this structure:
{
  "mistakes": [
    {
      "originalText": "exact phrase the learner used",
      "correction": "corrected German",
      "explanation": "clear explanation in English of the rule",
      "category": "grammar|vocabulary|word_order|article|case|verb_tense|preposition"
    }
  ],
  "vocabulary": [
    {
      "word": "German word or phrase",
      "translation": "English meaning",
      "example": "natural example sentence using the word"
    }
  ],
  "exercises": [
    ... exactly 10 exercises ...
  ]
}

EXERCISE RULES — generate exactly 10 exercises, all directly based on the mistakes and topics from this conversation. Mix these types:
- "fill_blank": { "sentence": "sentence with ___ for the gap", "answer": "correct word", "hint": "grammatical hint" }
- "multiple_choice": { "question": "question text", "options": ["option1","option2","option3","option4"], "answer": "correct option", "explanation": "why this is correct" }
- "rewrite": { "prompt": "rewrite this sentence correctly / translate this / transform the tense", "sample_answer": "correct version", "focus": "the grammar point being practised" }

Make the exercises CHALLENGING and SPECIFIC to this learner's mistakes:
- Fill-blank exercises should use real sentences from the conversation context
- Multiple choice should have plausible wrong answers, not obvious distractors
- Rewrite tasks should include translations (German→English and English→German), tense transformations, and sentence reconstruction
- At least 3 exercises should directly address the learner's most significant mistakes
- Include at least 2 translation exercises (one each direction)
- Vocabulary exercises: 5-8 interesting words from the conversation with good example sentences

If the learner made very few mistakes, still generate 10 exercises targeting B1-level German based on the conversation topics.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: AnalysisResult = JSON.parse(cleaned);

    // Clear old analysis for this session first
    await Promise.all([
      db.from('mistakes').delete().eq('session_id', sessionId),
      db.from('vocabulary').delete().eq('session_id', sessionId),
      db.from('exercises').delete().eq('session_id', sessionId),
    ]);

    const [{ data: insertedMistakes }, { data: insertedVocab }, { data: insertedExercises }] =
      await Promise.all([
        db
          .from('mistakes')
          .insert(analysis.mistakes.map((m) => ({ ...m, session_id: sessionId })))
          .select('*'),
        db
          .from('vocabulary')
          .insert(analysis.vocabulary.map((v) => ({ ...v, session_id: sessionId })))
          .select('*'),
        db
          .from('exercises')
          .insert(analysis.exercises.map((e) => ({ ...e, session_id: sessionId })))
          .select('*'),
      ]);

    await db.from('sessions').update({ analysis_completed: true }).eq('id', sessionId);

    return NextResponse.json({
      mistakes: insertedMistakes ?? [],
      vocabulary: insertedVocab ?? [],
      exercises: insertedExercises ?? [],
    });
  } catch (err) {
    console.error('[/api/analysis]', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
