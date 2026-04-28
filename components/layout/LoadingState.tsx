export default function LoadingState({ message = 'Wird geladen…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-paper-200 border-t-morning-600 rounded-full animate-spin" />
      <p className="text-ink-500 text-sm font-medium">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-paper-100 rounded-card p-4 animate-pulse space-y-3">
      <div className="h-4 bg-paper-200 rounded w-3/4" />
      <div className="h-4 bg-paper-200 rounded w-full" />
      <div className="h-4 bg-paper-200 rounded w-5/6" />
      <div className="h-4 bg-paper-200 rounded w-full" />
      <div className="h-4 bg-paper-200 rounded w-2/3" />
    </div>
  );
}
