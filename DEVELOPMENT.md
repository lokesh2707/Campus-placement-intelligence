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

### 4.3 Running Unit Tests
```bash
# Run API & Storage & Response tests
npm test

# Run all monorepo test suites
npm run test:all
```

### 4.4 Running Python ML Tests
In `apps/ml` with virtual environment activated:
```bash
pytest
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
