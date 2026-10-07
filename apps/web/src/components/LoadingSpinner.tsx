import React from 'react';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }[size];

  return (
    <div
      className={`inline-block animate-spin rounded-full border-sky-500 border-t-transparent ${sizeClasses}`}
      role="status"
      aria-label="Loading"
    />
  );
}
