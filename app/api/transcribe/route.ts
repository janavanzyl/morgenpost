import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const mimeType = (formData.get('mimeType') as string) || 'audio/webm';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (audioFile.size > 24 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([audioFile], `recording.${ext}`, { type: mimeType });

    const transcript = await getOpenAI().audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'de',
      response_format: 'text',
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Empty transcript' }, { status: 422 });
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error('[/api/transcribe]', err);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
