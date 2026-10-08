'use client';

import React from 'react';
import { useSystemHealth } from '../hooks/use-health';
import { useAuth } from '../context/AuthContext';
import { ServiceStatusCard } from '../components/ServiceStatusCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { ShieldAlert, RefreshCw, Server, Database, Cpu, Layers, Lock, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { health, readiness, loading, error, refetch } = useSystemHealth();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 max-w-6xl mx-auto space-y-10">
      {/* Platform Header & Navigation Bar */}
      <nav className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            🎓
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">Placement OS</span>
            <span className="text-[10px] text-slate-400 block -mt-1 font-mono">Phase 2 • Identity & RBAC</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium hover:bg-indigo-600/30 transition"
              >
                Go to Portal ({user.firstName})
              </Link>
              <button
                onClick={() => logout()}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs px-3.5 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-xs px-3.5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition font-medium shadow-md shadow-indigo-600/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero section */}
      <header className="space-y-4 text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Phase 2 Active • Authentication, Identity & Role-Based Access Control</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Campus Placement Intelligence & Management Platform
        </h1>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-400">
          Production identity system enabled with Argon2id password hashing, rotating refresh tokens, session revocation, and fine-grained role-based access control.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh Infrastructure Status
          </button>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Protected User Portal Shell
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            Admin Route (Protected)
          </Link>
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            Recruiter Route (Protected)
          </Link>
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
          {/* Node.js API Service */}
          <ServiceStatusCard
            title="Backend API (Express)"
            subtitle="Node.js 22+ • Centralized Controller"
            status={health ? 'available' : 'unavailable'}
            details={health?.service || 'placement-api'}
          />

          {/* PostgreSQL Relational DB */}
          <ServiceStatusCard
            title="PostgreSQL 16"
            subtitle="Prisma ORM • pgvector"
            status={readiness?.checks.database.status === 'connected' ? 'available' : 'unavailable'}
            latencyMs={readiness?.checks.database.latencyMs}
            details={readiness?.checks.database.status === 'connected' ? 'Connected' : 'Degraded (Offline)'}
          />

          {/* Redis Cache */}
          <ServiceStatusCard
            title="Redis 7 (In-Memory)"
            subtitle="ioredis Client • Cache & Session"
            status={readiness?.checks.redis.status === 'connected' ? 'available' : 'unavailable'}
            latencyMs={readiness?.checks.redis.latencyMs}
            details={readiness?.checks.redis.status === 'connected' ? 'Connected' : 'Resilient Offline Fallback'}
          />

          {/* FastAPI ML Microservice */}
          <ServiceStatusCard
            title="AI/ML Microservice"
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

      {/* Phase 2 Architecture Notice */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Layers className="w-5 h-5" />
          <h3 className="text-sm font-semibold text-white">Phase 2 Completed: Authentication & RBAC</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The identity system is live. Features include public student signup, development seed accounts (SUPER_ADMIN, PLACEMENT_ADMIN, PLACEMENT_COORDINATOR, DEPARTMENT_COORDINATOR, RECRUITER, STUDENT), Argon2id memory-hardened password security, dual-token JWT lifecycle, refresh token rotation with reuse detection, and client route protection.
        </p>
      </section>
    </main>
  );
}
