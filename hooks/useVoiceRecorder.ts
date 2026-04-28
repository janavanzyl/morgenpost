'use client';

import { useState, useRef, useCallback } from 'react';

export type RecorderState = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function useVoiceRecorder() {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopTracks();
        const mimeUsed = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeUsed });

        if (blob.size < 1000) {
          setError('Aufnahme zu kurz. Bitte nochmal versuchen.');
          setRecorderState('error');
          return;
        }

        setRecorderState('transcribing');
        try {
          const fd = new FormData();
          const ext = mimeUsed.includes('mp4') ? 'mp4' : 'webm';
          fd.append('audio', blob, `recording.${ext}`);
          fd.append('mimeType', mimeUsed);

          const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
          if (!res.ok) throw new Error('Transcription failed');
          const { transcript: t } = await res.json();
          setTranscript(t);
          setRecorderState('done');
        } catch {
          setError('Transkription fehlgeschlagen. Bitte nochmal versuchen.');
          setRecorderState('error');
        }
      };

      recorder.start(250);
      setRecorderState('recording');

      // Auto-stop after 90 seconds
      timeoutRef.current = setTimeout(() => stopRecording(), 90_000);
    } catch {
      setError('Mikrofon nicht verfügbar. Bitte Berechtigung erteilen.');
      setRecorderState('error');
    }
  }, [stopTracks]);

  const stopRecording = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    stopTracks();
    setRecorderState('idle');
    setTranscript(null);
    setError(null);
    chunksRef.current = [];
  }, [stopTracks]);

  return { recorderState, transcript, error, startRecording, stopRecording, reset };
}
