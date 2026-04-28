import { Message } from '@/types';
import { clsx } from 'clsx';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-morning-700 text-paper-50 rounded-br-sm'
            : 'bg-paper-100 text-ink-900 rounded-bl-sm shadow-card'
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
