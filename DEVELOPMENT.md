# Development Guide

## 1. Prerequisites

To run this platform in local development mode, you need:

- **Node.js**: v20.x, v22.x, or v24.x
- **npm**: v10.x or v11.x
- **Python**: 3.11+ (or `py` launcher on Windows, with `uv` or `pip`)
- **Git**: Installed and configured
- **Docker & Docker Compose** (Recommended for the all-in-one local stack)
- **Ollama** (Optional for local machine LLM execution; downloadable free from [ollama.com](https://ollama.com))

---

## 2. Quickstart with Docker Compose (Recommended)

The simplest way to start the entire system (Postgres + pgvector, Redis, Ollama, API, Web, ML) is with Docker Compose:

```bash
# 1. Clone the repository and enter directory
git clone <repo-url>
cd "Clg OS"

# 2. Copy the example environment file
cp .env.example .env

# 3. Start all services in detached mode
docker compose up -d

# 4. Check running service health
docker compose ps
```

Services will be accessible at:
- **Web Portal**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **API Health Check**: http://localhost:4000/api/v1/health
- **AI/ML Service**: http://localhost:8000/health
- **Ollama Local Runner**: http://localhost:11434

---

## 3. Native Local Development (Without Docker)

You can also run every service directly on your development machine.

### Step 3.1: Install Node Dependencies
From the monorepo root:
```bash
npm install
```

### Step 3.2: Build Shared Packages
```bash
npm run build --workspace=@campus-os/shared-types
npm run build --workspace=@campus-os/config
npm run build --workspace=@campus-os/validation
```

### Step 3.3: Configure Prisma Client
In `apps/api`:
```bash
cd apps/api
npx prisma generate
cd ../..
```

### Step 3.4: Set Up the Python ML Service
In `apps/ml`:
```bash
cd apps/ml

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start FastAPI development server
uvicorn main:app --reload --port 8000
```

### Step 3.5: Run Web & Backend Concurrently
From the project root:
```bash
# Terminal 1: Run Backend API
npm run dev:api

# Terminal 2: Run Web Portal
npm run dev:web

# Terminal 3: Run Mobile Portal (Expo)
npm run dev:mobile
```

---

## 4. Verification & Testing

### 4.1 Running TypeScript Typechecks
```bash
npm run typecheck
```

### 4.2 Running Linter
```bash
npm run lint
```

### 4.3 Running Unit Tests & Integration Tests
```bash
# Run API tests
npm test --workspace=@campus-os/api

# Run Web & Mobile tests
npm test --workspace=@campus-os/web
npm test --workspace=@campus-os/mobile

# Run all TypeScript monorepo test suites
npm run test:all
```

### 4.4 Running Python ML Tests
Using local Python:
```bash
npm run test:ml
```
Or inside `apps/ml` with virtual environment activated:
```bash
pytest
```

### 4.5 Service Health Verification Script
To verify connectivity across local endpoints concurrently:
```bash
npm run check:services
```

---

## 5. Working with Shared Packages

When making modifications across shared packages:

- `packages/shared-types`: Common interfaces, enums, DTOs, and API responses.
- `packages/config`: Constants, permission matrix, and default parameters.
- `packages/validation`: Zod schemas for input validation.

Rebuild modified packages with:
```bash
npm run build --workspace=@campus-os/<package-name>
```

---

## 6. ₹0 Cost Local AI Verification

To verify that the local AI service operates without any paid keys:

1. Install Ollama locally from [ollama.com](https://ollama.com) (or via Docker).
2. Pull a lightweight model:
   ```bash
   ollama pull llama3.2
   ```
3. Check the ML service health status at `http://localhost:8000/health` or `http://localhost:8000/api/v1/models/status`.
4. The service will report `ollama` as the active provider with `is_local: true`.

---

## 7. Authentication, RBAC & Database Seeding

### 7.1 Running Database Seed (6 Roles)
To populate local PostgreSQL with predefined development test accounts:
```bash
npm run db:seed
```
This provisions accounts with Argon2id password hashes for `SUPER_ADMIN`, `PLACEMENT_ADMIN`, `PLACEMENT_COORDINATOR`, `DEPARTMENT_COORDINATOR`, `RECRUITER`, and `STUDENT` with password `Password123!`.

### 7.2 Authentication Token Lifecycle
- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Contain `sub`, `email`, `role`, and `sessionId`.
- **Refresh Tokens**: Cryptographically secure 40-byte random tokens stored as SHA-256 hashes in the `Session` table.
- **Rotation**: Every call to `POST /api/v1/auth/refresh` invalidates the old refresh token and issues a new pair.
- **Reuse Detection**: Presenting an already-revoked refresh token triggers automated session termination across all devices for that user.

### 7.3 Zero-Cost Local Email Verification
In local development, the platform uses `DevelopmentEmailProvider` which outputs simulated email verification and password reset links directly to the application console logger, storing them in memory for test access without requiring paid SMTP or external SaaS services.

---

## 8. Student & Academic Management (Phase 3)

### 8.1 Domain Separation & Architecture
The platform enforces strict separation between authentication and domain profiles:
- `User`: Identity, authentication credentials, role, status, email verification.
- `StudentProfile`: 1-to-1 relationship with `User`. Holds student registration number, academic metrics (CGPA, percentages, backlogs), and relations to skills, projects, internships, certifications, career preferences, and resumes.

### 8.2 Academic Structure Hierarchy
```text
College (AIT)
  ├── Campus (Main, North)
  └── Department (CSE, ECE, EEE, MECH)
        └── Degree (B.Tech CSE, B.Tech ECE, etc.)
              └── Batch (Batch 2025, Batch 2026)
                    └── StudentProfile
```

### 8.3 Ownership & Field Control Rules
- **Student-Controlled Fields**: Students can edit their personal `phone`, `bio`, `profilePhoto`, `dateOfBirth`, `gender`, skills, projects, internships, certifications, career preferences, and resumes.
- **Institution-Controlled Fields**: `studentId` (registration number), `collegeId`, `departmentId`, `degreeId`, `batchId`, `graduationYear`, `cgpa`, `tenthPercentage`, `twelfthPercentage`, `diplomaPercentage`, `backlogs`, `activeBacklogs`, and `verificationStatus`. Students cannot modify these fields; any payload attempts are discarded or rejected.
- **Verification Workflow**: Placement administrators and department coordinators verify academic metrics (`PENDING`, `VERIFIED`, `REJECTED`).

### 8.4 Department Coordinator Object-Level Authorization
Department Coordinators are scoped to their assigned `departmentId`.
- Coordinator queries (`/api/v1/admin/students`) are automatically forced to filter by `user.departmentId`.
- Direct ID lookups or verification attempts against students outside their department return `403 FORBIDDEN`.

### 8.5 Local File Storage & Private Resume Streams
- Resumes are validated on the server (MIME types: PDF/DOC/DOCX, max 5 MB).
- Uploaded via `LocalStorageProvider` to `./uploads/resumes/` with sanitized, cryptographically random names.
- Public URLs are never exposed. Resumes are accessed only via authenticated streaming at `GET /api/v1/resumes/:id/download`, checking student ownership or administrator privileges.

---

## 9. Company & Recruiter Management (Phase 4)

### 9.1 Domain Architecture & Object-Level Access Control
- `Company`: Holds corporate information, unique slug, status (`ACTIVE`, `SUSPENDED`, `INACTIVE`), verification status (`PENDING`, `VERIFIED`, `REJECTED`), and soft-delete timestamp.
- `RecruiterProfile`: 1-to-1 relationship with `User` and N-to-1 with `Company`. Holds designation, status, and verification state.
- **Access Rule**: Recruiters can only access or modify the company bound to their `recruiterProfile.companyId`. Direct manipulation of other companies is rejected with `403 Forbidden`.

### 9.2 Recruiter Invitation Flow
- Admins or verified company recruiters send invites via `POST /api/v1/companies/:id/recruiters/invite`.
- A 32-byte cryptographic random token is generated; its SHA-256 hash is saved in `RecruiterInvitation`.
- The recruiter opens the invite link (`/auth/recruiter-invite?token=...`) and registers or accepts via `POST /api/v1/recruiters/accept-invite`.

### 9.3 Company Contacts & Compliance Documents
- **Contacts**: Supports `HR`, `PRIMARY`, `TECHNICAL`, `CAMPUS_LEAD`, and `FINANCE` contact types with primary designation flagging.
- **Documents**: Allows uploading certificates of incorporation, tax registrations, or company policy PDFs (max 5 MB). Uploads go through `IStorageService` into `./uploads/company-docs/` with private download streaming at `GET /api/v1/companies/:id/documents/:docId/download`.
- **Logos**: Scaled and validated image files (max 2 MB) saved to `./uploads/company-logos/`.

### 9.4 Verification & Suspension Workflows
- Placement Administrators verify corporate paperwork via `POST /api/v1/companies/:id/verify`.
- Admins can suspend or reactivate companies via `POST /api/v1/companies/:id/suspend` and `POST /api/v1/companies/:id/activate`.
- All operational transitions emit audit logs (`COMPANY_VERIFIED`, `COMPANY_SUSPENDED`, `RECRUITER_INVITED`, etc.).

