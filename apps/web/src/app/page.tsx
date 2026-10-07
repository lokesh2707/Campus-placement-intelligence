'use client';

import React from 'react';
import { useSystemHealth } from '../hooks/use-health';
import { ServiceStatusCard } from '../components/ServiceStatusCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ShieldAlert, RefreshCw, Server, Database, Cpu, Layers } from 'lucide-react';

export default function HomePage() {
  const { health, readiness, loading, error, refetch } = useSystemHealth();

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 max-w-6xl mx-auto space-y-12">
      {/* Platform Shell Header */}
      <header className="space-y-4 text-center pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Phase 1 Development Foundation • Active Infrastructure Shell</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Campus Placement Intelligence & Management Platform
        </h1>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-400">
          The development foundation is active. Business workflows (students, companies, drives, and AI matching)
          will be enabled in subsequent phases.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh Infrastructure Status
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && <ErrorAlert message={error} onRetry={refetch} />}

      {/* Live Services Communication Status */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Live Services Communication Matrix</h2>
          </div>
          {health && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40">
              API Liveness: {health.status.toUpperCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Node.js Backend API */}
          <ServiceStatusCard
            title="Backend API"
            subtitle="Node.js • Express • REST v1"
            status={health ? (health.status === 'ok' ? 'ok' : 'not_ready') : 'not_ready'}
            details={health ? `v${health.version} operational` : 'Connecting...'}
          />

          {/* PostgreSQL via Prisma */}
          <ServiceStatusCard
            title="Database (PostgreSQL)"
            subtitle="Prisma ORM • pgvector"
            status={readiness ? readiness.checks.database.status : 'disconnected'}
            latencyMs={readiness?.checks.database.latencyMs}
            details="Relational Placement Store"
          />

          {/* Redis Cache */}
          <ServiceStatusCard
            title="Redis Cache"
            subtitle="In-Memory Cache & Session"
            status={readiness ? readiness.checks.redis.status : 'disabled'}
            latencyMs={readiness?.checks.redis.latencyMs}
            details="Graceful fallback active"
          />

          {/* Python ML Service */}
          <ServiceStatusCard
            title="AI/ML Engine"
            subtitle="Python FastAPI • HTTP Client"
            status={readiness ? readiness.checks.mlService.status : 'unavailable'}
            latencyMs={readiness?.checks.mlService.latencyMs}
            details={readiness?.checks.mlService.service || 'placement-ml'}
          />

          {/* Local Ollama Inference */}
          <ServiceStatusCard
            title="Ollama Local LLM"
            subtitle="Local Open-Source Inference"
            status="available"
            details="Local provider default"
          />

          {/* Local Storage Service */}
          <ServiceStatusCard
            title="Storage Provider"
            subtitle="Local Disk Abstraction"
            status="available"
            details="₹0 mandatory cloud cost"
          />
        </div>
      </section>

      {/* Development Status Notice */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2 text-sky-400">
          <Layers className="w-5 h-5" />
          <h3 className="text-sm font-semibold text-white">Under Active Development</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          This shell confirms successful Web-to-API and API-to-ML communication.
          Authentication, placement drives, recruiter workflows, and student portals will be unlocked
          sequentially following the Phase roadmap.
        </p>
      </section>
    </main>
  );
}
