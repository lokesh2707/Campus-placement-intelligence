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

---

## 6. Authentication, Identity & RBAC Architecture

### 6.1 Authentication Hierarchy
```text
User
 ↓
Authentication (Argon2id Password Verification)
 ↓
Session (Database-Backed with Secure Refresh Hash)
 ↓
Access Token (15-Minute Short-Lived JWT)
 ↓
Authorization (requireAuth + requireRole + requirePermission)
 ↓
Resource Authorization (canAccessResource Owner / Admin Check)
```

### 6.2 Token Strategy
- **JWT Access Token**: Signed with HMAC SHA-256 (`JWT_ACCESS_SECRET`). Claims: `sub`, `userId`, `email`, `role`, `sessionId`, `collegeId`. Expiration: 15 minutes.
- **Refresh Token**: 40-byte cryptographically secure random token generated on the server. Stored in database exclusively as a SHA-256 hash. Expiration: 7 days.
- **Token Rotation**: Every refresh request rotates the token. If an attacker presents an already-rotated or revoked token, token reuse detection immediately triggers revocation of all active sessions for that user family.

### 6.3 Fine-Grained Role & Permission Model
- Roles: `SUPER_ADMIN`, `PLACEMENT_ADMIN`, `PLACEMENT_COORDINATOR`, `DEPARTMENT_COORDINATOR`, `RECRUITER`, `STUDENT`.
- Permission Matrix (`ROLE_PERMISSIONS` in `@campus-os/config`):
  - Self management: `USER_READ_SELF`, `USER_UPDATE_SELF`
  - Student operations: `STUDENT_READ`, `STUDENT_UPDATE`, `STUDENT_MANAGE`, `STUDENTS_DEPARTMENT_ONLY`
  - Company operations: `COMPANY_CREATE`, `COMPANY_READ`, `COMPANY_UPDATE`, `COMPANIES_MANAGE`, `RECRUITERS_MANAGE`
  - Drive operations: `DRIVE_CREATE`, `DRIVE_READ`, `DRIVE_UPDATE`, `DRIVES_MANAGE`
  - Application operations: `APPLICATION_READ`, `APPLICATION_UPDATE`, `APPLICATIONS_SUBMIT`, `APPLICATIONS_VIEW_OWN`, `APPLICATIONS_MANAGE`
  - Interview & Offer operations: `INTERVIEWS_SCHEDULE`, `INTERVIEWS_VIEW_OWN`, `INTERVIEWS_FEEDBACK`, `OFFERS_ISSUE`, `OFFERS_VIEW_OWN`
  - Administrative oversight: `ADMIN_MANAGE_USERS`, `SYSTEM_MANAGE`, `COLLEGES_MANAGE`, `DEPARTMENTS_MANAGE`, `ANALYTICS_READ`, `AUDIT_LOGS_READ`

### 6.4 Web & Mobile Client Authentication Flows
- **Web App (Next.js)**:
  - `AuthProvider` maintains in-memory authentication state and restores session via `GET /api/v1/auth/me`.
  - Refresh tokens are transmitted via `httpOnly` secure cookies or response JSON.
  - Route guards (`ProtectedRoute`) verify authentication state and role eligibility before rendering children.
- **Mobile App (React Native / Expo)**:
  - Tokens are persisted via `secureStorage` adapter.
  - Universal `MobileApiClient` automatically intercepts 401 responses, executes token refresh, and replays requests without infinite loops.
  - `RootNavigator` seamlessly switches between Unauthenticated Stack (`Login`, `Register`, `ForgotPassword`) and Authenticated Stack based on `user.role`.

---

## 7. Student & Academic Management Architecture (Phase 3)

### 7.1 Entity Relationship Model
```text
User (1) ──── (1) StudentProfile
                     ├── College (N:1)
                     ├── Department (N:1)
                     ├── Degree (N:1)
                     ├── Batch (N:1)
                     ├── StudentSkill (1:N) ──── Skill (N:1)
                     ├── StudentProject (1:N)
                     ├── StudentInternship (1:N)
                     ├── StudentCertification (1:N)
                     ├── StudentCareerPreference (1:1)
                     └── Resume (1:N)
```

### 7.2 Field Control & Verification Matrix

| Domain Category | Specific Fields | Editable By | Verification State |
|:---|:---|:---|:---|
| **Identity & Auth** | `email`, `passwordHash`, `role`, `status` | User / Admin | Managed via Phase 2 Auth |
| **Personal Info** | `bio`, `phone`, `profilePhoto`, `dateOfBirth`, `gender` | Student | Self-Managed |
| **Academic Records** | `studentId`, `collegeId`, `departmentId`, `degreeId`, `batchId`, `graduationYear`, `cgpa`, `tenthPercentage`, `twelfthPercentage`, `diplomaPercentage`, `backlogs`, `activeBacklogs` | Institution Staff Only (Admin / Coordinator) | `PENDING` / `VERIFIED` / `REJECTED` |
| **Skills** | `proficiency`, `yearsOfExperience` | Student (Taxonomy normalized) | Self-Managed |
| **Projects & Experience** | Projects, Internships, Certifications | Student | Verification supported |
| **Career Preferences** | Preferred Roles, Locations, Minimum Salary, Work Mode | Student | Self-Managed |
| **Resumes** | Resume files, version numbers, active selection | Student | Private streaming |

### 7.3 Deterministic Profile Completion Formula
Profile completion is computed deterministically without AI/LLMs:
- **Basic Information** (15%): Valid phone number and either bio or profile photo.
- **Academic Information** (20%): Verified CGPA, 10th percentage, and 12th percentage populated.
- **Skills Profile** (20%): At least 3 taxonomy skills added with proficiency levels.
- **Projects Portfolio** (15%): At least 1 project added.
- **Internships / Experience** (10%): At least 1 internship added.
- **Certifications** (5%): At least 1 certification added.
- **Active Resume** (15%): At least 1 active resume version uploaded.
- **Total Score**: $\sum \text{Weights} = 100\%$.

