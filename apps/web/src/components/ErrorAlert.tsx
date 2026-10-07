import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-300">Communication Error</h4>
          <p className="text-xs text-red-300/80 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-xs font-medium rounded-lg text-red-100 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}
