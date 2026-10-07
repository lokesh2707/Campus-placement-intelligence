# AI-Powered Campus Placement Intelligence & Management Platform

[![Phase](https://img.shields.io/badge/Phase-0%20Foundation-emerald)](.)
[![License](https://img.shields.io/badge/Cost-%E2%82%B90%20Mandatory%20Free-blue)](.)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20React%20Native%20%7C%20Node.js%20%7C%20FastAPI%20%7C%20PostgreSQL-indigo)](.)

An enterprise-grade, localized, zero-cost intelligence and management platform designed for college placement cells, students, and recruiters.

---

## 🌟 Vision & Key Highlights

- **Complete Placement Lifecycle**: From company registration, eligibility verification, and drive announcements to online rounds, interview rubrics, and offer letter dispatches.
- **₹0 Mandatory Operating Cost**: Runs 100% on open-source, local-first technology. No required paid APIs (OpenAI, AWS, Pinecone, Twilio, Auth0).
- **Dual Engine Architecture**:
  - **Deterministic Rule Engine (Node.js)**: Handles CGPA, backlogs, branch quotas, and placement eligibility rules with zero hallucinations.
  - **AI/ML Microservice (FastAPI + Ollama)**: Powers resume parsing, semantic embedding matching with **pgvector**, and candidate readiness predictions via **scikit-learn & XGBoost**.
- **Unified Multi-Platform Client**:
  - **Web Application** (Next.js 15, Tailwind CSS): Responsive administrative and recruiter portals.
  - **Mobile Application** (React Native, Expo): Student-focused application sharing the same backend REST API.

---

## 📁 Repository Structure

```text
campus-placement-os/
├── apps/
│   ├── web/                     # Next.js 15 Web Portal (Admin, Recruiter & Student)
│   ├── mobile/                  # Expo React Native Student Mobile Client
│   ├── api/                     # Node.js + Express + Prisma Central Backend
│   └── ml/                      # Python + FastAPI Local-First AI/ML Microservice
│
├── packages/
│   ├── shared-types/            # Shared TypeScript Interfaces, Enums & DTOs
│   ├── config/                  # Shared Constants & Role Permission Matrices
│   └── validation/              # Shared Zod Input Validation Schemas
│
├── infrastructure/
│   └── docker/                  # Production & Dev Dockerfiles for all services
│
├── docs/                        # In-depth architectural & planning documentation
│   ├── database-design.md       # Complete 30+ entity relational & pgvector plan
│   ├── api-conventions.md       # REST contracts, envelopes, and status codes
│   ├── security-model.md        # RBAC, token rotation, and zero-trust model
│   ├── ai-ml-architecture.md    # Local-first Ollama & pgvector strategy
│   ├── storage-architecture.md  # File storage abstraction & path sanitization
│   └── auth-architecture.md     # Dual-token JWT session lifecycle
│
├── .env.example                 # Documented environment configuration
├── docker-compose.yml           # Unified multi-container local development stack
├── ARCHITECTURE.md              # Global system architecture specification
├── DEVELOPMENT.md               # Local developer onboarding and setup guide
└── README.md                    # Project overview & roadmap
```

---

## 🚀 Getting Started

Check out [DEVELOPMENT.md](file:///c:/Users/Ratnam/Documents/Clg%20OS/DEVELOPMENT.md) for full instructions.

### Quick Start via Docker Compose:

```bash
cp .env.example .env
docker compose up -d
```

- **Web Portal**: http://localhost:3000
- **API Base**: http://localhost:4000/api/v1
- **API Health**: http://localhost:4000/api/v1/health
- **AI/ML Service**: http://localhost:8000/health

---

## 👥 Supported User Roles

1. `SUPER_ADMIN`: Institutional system administrator.
2. `PLACEMENT_ADMIN`: Head of Placement & Training Department.
3. `PLACEMENT_COORDINATOR`: Placement committee team member.
4. `DEPARTMENT_COORDINATOR`: Faculty representative for specific academic departments.
5. `RECRUITER`: Corporate recruitment partner.
6. `STUDENT`: Registered graduating candidate.

---

## 🗺️ Roadmap & Phases

- **Phase 0 (Complete)**: Architecture, Monorepo Foundation, Free-Tier Stack, Docker, Documentation & Setup.
- **Phase 1**: Authentication, User Sessions, Profile Management & Core Multi-Tenancy.
- **Phase 2**: Placement Drive Creation, Job Postings, and Deterministic Eligibility Engine.
- **Phase 3**: Student Applications, Multi-Stage Selection Pipeline & Live Interview Scheduling.
- **Phase 4**: Offers, Placement Policies ("One Student One Job"), and Realtime Notifications.
- **Phase 5**: Local-First AI Resume Parsing, Semantic Job Matching & Placement Readiness Prediction.
- **Phase 6**: Analytics Dashboards, Audit Logs, and Mobile Polish.
