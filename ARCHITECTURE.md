# Campus Placement Intelligence Platform — System Architecture

## 1. Executive Architecture Summary

The **AI-Powered Campus Placement Intelligence & Management Platform** is designed as a modular, enterprise-grade, monorepo system. It serves four key stakeholder groups: Students, Placement Officers/Coordinators, Recruiters, and Academic Leadership.

A foundational constraint governing this entire architecture is **₹0 mandatory operating cost**: all core systems, databases, vector stores, and AI models run locally on open-source technologies without requiring paid third-party SaaS subscriptions, paid vector databases, or proprietary AI APIs.

---

## 2. Global System Architecture Diagram

```text
                     ┌─────────────────────────────────────────┐
                     │            WEB APPLICATION              │
                     │  Next.js 15 • React 19 • Tailwind CSS   │
                     │  (Admin, Recruiter & Student Portals)   │
                     └────────────────────┬────────────────────┘
                                          │
                                          │ HTTP / WebSocket
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │           MOBILE APPLICATION            │
                     │   React Native • Expo • TypeScript      │
                     │     (Student Native Mobile App)         │
                     └────────────────────┬────────────────────┘
                                          │
                                          │ HTTP (REST v1) / Socket.IO
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │           BACKEND API SERVICE           │
                     │     Node.js • Express • TypeScript      │
                     │     • Single Source of Business Rules   │
                     │     • Deterministic Eligibility Engine  │
                     │     • RBAC & Dual-Token Auth            │
                     │     • Socket.IO Realtime Server         │
                     └──────┬──────────────────────┬───────────┘
                            │                      │
             ┌──────────────┼──────────────┐       │ Internal HTTP
             │              │              │       ▼
             ▼              ▼              ▼ ┌───────────────────────────┐
      ┌─────────────┐ ┌───────────┐ ┌──────┐ │      AI / ML SERVICE      │
      │ PostgreSQL  │ │   Redis   │ │Local │ │       Python FastAPI      │
      │   Prisma    │ │  (Cache / │ │Store │ │• Resume Parsing           │
      │  pgvector   │ │ Graceful) │ │Upload│ │• Semantic Vector Matching │
      └─────────────┘ └───────────┘ └──────┘ │• Placement Readiness (XGB)│
                                             └─────────────┬─────────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            ▼                             ▼
                                   ┌─────────────────┐           ┌─────────────────┐
                                   │  Ollama Engine  │           │ Sentence Trans. │
                                   │  (Local Llama3) │           │  (Local MiniLM) │
                                   └─────────────────┘           └─────────────────┘
```

---

## 3. Technology Selection Rationale

| Layer | Chosen Technology | Rationale & Zero-Cost Benefit |
|:---|:---|:---|
| **Web Frontend** | Next.js 15, React 19, Tailwind CSS | Fast SSR/SSG rendering, strong TypeScript DX, responsive dark UI design system, active enterprise ecosystem. |
| **Mobile App** | React Native, Expo, TypeScript | True cross-platform Android/iOS from a single TypeScript codebase, sharing API contract types with web. |
| **Backend API** | Node.js, Express, TypeScript | Highly performant non-blocking I/O, rich ecosystem, type safety, direct sharing of DTOs and validation schemas across monorepo. |
| **Relational Database** | PostgreSQL 16, Prisma ORM | Relational integrity across complex multi-table placement drives, ACID compliance, type-safe schema migrations via Prisma. |
| **Vector Database** | pgvector | Eliminates the need for paid vector databases (Pinecone, Qdrant Cloud); stores 384-dimensional dense vectors directly in Postgres. |
| **Cache / Queue** | Redis 7 | High-performance in-memory caching and session indexing. Architected with graceful degradation when Redis is absent locally. |
| **AI / ML Service** | Python, FastAPI, Ollama, scikit-learn, XGBoost | Python is the gold standard for ML. FastAPI provides high-throughput async APIs. Ollama enables 100% free local LLM execution. |
| **Realtime Events** | Socket.IO | Bi-directional event broadcasting for live interview scheduling, offer releases, and drive status alerts. |
| **File Storage** | Local Filesystem Abstraction | Local storage provider with directory isolation and path sanitization; runs free on local disk with optional S3 cloud adapter. |
| **Orchestration** | Docker & Docker Compose | Single-command reproducible environment setup across heterogeneous services (Node.js, Python, Postgres, Redis, Ollama). |

---

## 4. Subsystem Architectures

### 4.1 Web Architecture (`apps/web`)
- **Structure**: Next.js App Router (`src/app/`).
- **Design System**: Tailored dark-mode glassmorphic theme with Tailwind CSS, Lucide icons, responsive grids.
- **Responsibilities**:
  - Administrative workflows: College drive setup, department management, recruiter verification, policy creation.
  - Recruiter workflows: Candidate shortlisting, interview scorecards, job postings.
  - Student workflows: Web-based profile management, drive discovery, and offer letter downloads.

### 4.2 Mobile Architecture (`apps/mobile`)
- **Structure**: Expo managed workflow (`App.tsx`, `src/services/api.ts`).
- **Client Philosophy**: Student-first experience. Consumes the same `/api/v1` REST endpoints as the web application.
- **Responsibilities**:
  - Push notifications and timeline tracking for ongoing drives.
  - Student profile, resume uploads, and skill tags.
  - Personalized AI placement readiness tips and interview reminders.

### 4.3 Backend Architecture (`apps/api`)
- **Structure**: Layered architectural pattern:
  `Routes -> Controllers -> Services -> Repositories (Prisma) -> Database`.
- **Central Business Logic**:
  - **Deterministic Eligibility Engine**: Validates criteria (CGPA, backlogs, department, gender) using deterministic algebraic conditions, never LLMs.
  - **Security & Authorization**: Express middleware pipeline enforcing helmet, cors, Zod input validation, JWT authentication, and RBAC.
  - **Storage Service Factory**: Manages uploads through `IStorageService`.

### 4.4 AI/ML Architecture (`apps/ml`)
- **Structure**: Standalone Python microservice running FastAPI on port 8000.
- **Provider Abstraction**: `AIProvider` base class with `OllamaProvider` as default.
- **Dual Pipeline Strategy**:
  1. **Generative / NLP**: Local Ollama (e.g. `llama3.2`) parses messy resume PDFs and unstructured job requirements into structured schemas.
  2. **Predictive / Classical ML**: Scikit-learn and XGBoost regression/classification models compute placement readiness scores based on quantitative features.
  3. **Dense Embeddings**: Sentence-transformers compute 384-dimensional embeddings stored directly in PostgreSQL via pgvector for semantic search.

### 4.5 Realtime Architecture
- Powered by Socket.IO mounted on the Node.js HTTP server.
- Clients authenticate during the handshake using JWT access tokens.
- Automatic room assignment based on `userId` and `collegeId` allows instant targeted broadcasts (e.g., candidate shortlisted, interview rescheduled).

### 4.6 File Storage Architecture
- Abstracted via `IStorageService`.
- `LocalStorageProvider` writes files to disk under `./uploads/` with cryptographically randomized filenames and path-traversal prevention.
- `CloudStorageProvider` stub allows zero-friction migration to MinIO/S3 if an institution deploys cloud infrastructure in the future.

---

## 5. Deployment Architecture

- **Local Machine**: Native execution via npm workspaces and Python virtual environment, or all-in-one execution using Docker Compose.
- **Docker Compose Topology**:
  - `postgres` (5432)
  - `redis` (6379)
  - `ollama` (11434)
  - `ml` (8000)
  - `api` (4000)
  - `web` (3000)
- **Zero Cloud Cost Guarantee**: Complete system functions out-of-the-box on a laptop with 8GB-16GB RAM without any internet connection or cloud billing account.
