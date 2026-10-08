import React from 'react';

export function LoadingSpinner({
  size = 'md',
  message,
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`inline-block animate-spin rounded-full border-sky-500 border-t-transparent ${sizeClasses}`}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="text-xs text-slate-400 font-medium">{message}</p>}
    </div>
  );
}
