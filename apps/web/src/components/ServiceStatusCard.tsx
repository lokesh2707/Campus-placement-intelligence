import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  status: 'connected' | 'disconnected' | 'disabled' | 'available' | 'unavailable' | 'ok' | 'ready' | 'not_ready';
  latencyMs?: number;
  details?: string;
}

export function ServiceStatusCard({ title, subtitle, status, latencyMs, details }: Props) {
  const isGood = status === 'connected' || status === 'available' || status === 'ok' || status === 'ready';
  const isWarn = status === 'disabled';

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
            isGood
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : isWarn
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {isGood ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : isWarn ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>{details || (isGood ? 'Operational' : isWarn ? 'Optional disabled' : 'Offline / Unreachable')}</span>
        {latencyMs !== undefined && (
          <span className="font-mono text-slate-400">{latencyMs}ms</span>
        )}
      </div>
    </div>
  );
}
