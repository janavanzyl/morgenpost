'use client';

import { clsx } from 'clsx';
import { RecorderState } from '@/hooks/useVoiceRecorder';

interface RecordButtonProps {
  recorderState: RecorderState;
  onStart: () => void;
  onStop: () => void;
}

export default function RecordButton({ recorderState, onStart, onStop }: RecordButtonProps) {
  const isRecording = recorderState === 'recording';
  const isProcessing = recorderState === 'transcribing';
  const isDisabled = isProcessing;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={!isDisabled && !isRecording ? onStart : undefined}
        onPointerUp={isRecording ? onStop : undefined}
        onPointerLeave={isRecording ? onStop : undefined}
        onClick={isRecording ? onStop : undefined}
        disabled={isDisabled}
        className={clsx(
          'relative w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center',
          isRecording
            ? 'bg-red-600 scale-110 shadow-lg ring-4 ring-red-300 ring-opacity-60'
            : isProcessing
            ? 'bg-paper-200 cursor-not-allowed'
            : 'bg-morning-700 hover:bg-morning-800 active:scale-95 shadow-card'
        )}
      >
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
        )}
        {isProcessing ? (
          <div className="w-7 h-7 border-3 border-ink-400 border-t-morning-600 rounded-full animate-spin" />
        ) : isRecording ? (
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" strokeWidth={1.5} stroke="white" fill="none" />
          </svg>
        )}
      </button>
      <p className="text-sm text-ink-500 font-medium">
        {isRecording
          ? 'Aufnahme läuft… zum Beenden tippen'
          : isProcessing
          ? 'Wird transkribiert…'
          : 'Tippen zum Aufnehmen'}
      </p>
    </div>
  );
}
