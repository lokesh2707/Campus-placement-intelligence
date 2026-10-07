import React from 'react';
import { UserRole } from '@campus-os/shared-types';
import { ROLE_PERMISSIONS } from '@campus-os/config';
import {
  Server,
  Cpu,
  Smartphone,
  Globe,
  Database,
  Layers,
  ShieldCheck,
  Zap,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const roles = Object.keys(ROLE_PERMISSIONS) as UserRole[];

  const architectureLayers = [
    {
      title: 'Web Application',
      tech: 'Next.js 15, React 19, Tailwind CSS',
      icon: Globe,
      description:
        'Unified administrative portal, recruiter dashboard, and student web interface.',
      status: 'Foundation Active',
      color: 'from-blue-500/20 to-cyan-500/20',
      badgeColor: 'text-cyan-400 border-cyan-500/30',
    },
    {
      title: 'Mobile Application',
      tech: 'React Native, Expo, TypeScript',
      icon: Smartphone,
      description:
        'Student-centric mobile experience for real-time drive alerts, timelines, and AI career assistant.',
      status: 'Foundation Active',
      color: 'from-purple-500/20 to-indigo-500/20',
      badgeColor: 'text-purple-400 border-purple-500/30',
    },
    {
      title: 'Backend API Service',
      tech: 'Node.js, Express, TypeScript',
      icon: Server,
      description:
        'Single source of truth for business logic, deterministic eligibility, RBAC, and Socket.IO realtime events.',
      status: 'v1 Operational',
      color: 'from-emerald-500/20 to-teal-500/20',
      badgeColor: 'text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'AI/ML Intelligence Service',
      tech: 'Python, FastAPI, Ollama, Scikit-learn',
      icon: Cpu,
      description:
        'Separated intelligence engine utilizing local open-source LLMs & embeddings for zero-cost operation.',
      status: 'Local Provider Default',
      color: 'from-amber-500/20 to-orange-500/20',
      badgeColor: 'text-amber-400 border-amber-500/30',
    },
    {
      title: 'Data & Vector Store',
      tech: 'PostgreSQL, pgvector, Prisma ORM',
      icon: Database,
      description:
        'Relational placement records coupled with native pgvector high-dimensional embeddings storage.',
      status: 'Configured',
      color: 'from-rose-500/20 to-red-500/20',
      badgeColor: 'text-rose-400 border-rose-500/30',
    },
    {
      title: 'Cache & Local Storage',
      tech: 'Redis (Graceful Degradation), Local FS',
      icon: Layers,
      description:
        'Local-first storage abstraction with path traversal security and optional Redis caching.',
      status: 'Zero Cloud Cost',
      color: 'from-violet-500/20 to-pink-500/20',
      badgeColor: 'text-violet-400 border-violet-500/30',
    },
  ];

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Banner */}
      <section className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <ShieldCheck className="w-4 h-4" /> Phase 0 Foundation Initialized • ₹0 Mandatory Cost
        </div>
        <h1
          id="main-platform-heading"
          className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
        >
          AI-Powered Campus Placement <br className="hidden md:inline" />
          Intelligence & Management Platform
        </h1>
        <p className="max-w-3xl mx-auto text-base md:text-lg text-slate-400 font-normal">
          Enterprise-grade monorepo foundation unifying administrative drive workflows, recruiter
          pipelines, student mobile portals, and local-first AI resume matching with zero paid cloud
          dependencies.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <a
            href="http://localhost:4000/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            Check API Health (:4000)
          </a>
          <a
            href="http://localhost:8000/health"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            Check ML Health (:8000)
          </a>
        </div>
      </section>

      {/* System Architecture Pillars */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-sky-400" />
              Core Architecture Pillars
            </h2>
            <p className="text-sm text-slate-400">
              Clean separation of concerns with unified API contracts
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
            6 Services
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {architectureLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.title}
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-slate-600 transition duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${layer.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-mono font-medium ${layer.badgeColor}`}
                    >
                      {layer.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{layer.title}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{layer.tech}</p>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{layer.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role-Based Access Control Architecture */}
      <section className="glass-panel p-8 rounded-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Designed User Roles & Authorization Architecture
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic permission mapping across 6 distinct organizational roles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-400">{role}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                  {ROLE_PERMISSIONS[role].length} Permissions
                </span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {ROLE_PERMISSIONS[role].slice(0, 4).map((p) => (
                  <li key={p} className="flex items-center gap-1.5 font-mono text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                    <span className="truncate">{p}</span>
                  </li>
                ))}
                {ROLE_PERMISSIONS[role].length > 4 && (
                  <li className="text-[11px] text-slate-500 pt-1 font-mono">
                    + {ROLE_PERMISSIONS[role].length - 4} more permissions
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Local Development Commands */}
      <section className="glass-panel p-8 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          Zero-Cost Local Startup Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-slate-300">
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-sans font-semibold block text-sm">
              Docker Compose (Recommended)
            </span>
            <code className="text-emerald-400 block">$ docker compose up -d</code>
            <p className="text-slate-500 text-[11px] font-sans">
              Launches PostgreSQL with pgvector, Redis, Ollama, Backend API, Web App, and ML
              service simultaneously.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-sans font-semibold block text-sm">
              Local Development (Native)
            </span>
            <code className="text-sky-400 block">$ npm run dev</code>
            <p className="text-slate-500 text-[11px] font-sans">
              Runs Web (:3000) and Backend API (:4000) concurrently with hot-reloading.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
