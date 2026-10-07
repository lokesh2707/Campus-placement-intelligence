# Campus Placement AI/ML Microservice

FastAPI microservice handling AI resume intelligence, semantic matching via embeddings, and candidate readiness classification.

---

## Zero-Cost Local AI Infrastructure (Ollama)

This service is engineered to run with **₹0 mandatory cost** using local open-source models via Ollama.

### 1. Installing Ollama

Download and install Ollama for your operating system:
- **Windows / macOS / Linux**: [https://ollama.com/download](https://ollama.com/download)
- Or via Docker Compose:
  ```bash
  docker compose up -d ollama
  ```

### 2. Pulling a Lightweight Model

Once Ollama is installed and running, pull the default lightweight model (`llama3.2` ~ 2.0 GB):

```bash
ollama pull llama3.2
```

For systems with lower RAM/CPU, you can also use:
```bash
ollama pull llama3.2:1b
```

### 3. Running the Service Locally

```bash
# 1. Create and activate a Python virtual environment
py -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start development server
uvicorn main:app --reload --port 8000
```

### 4. Health & Status Endpoints

- **Liveness check**: `GET http://localhost:8000/health`
- **Readiness check**: `GET http://localhost:8000/ready`
- **Interactive OpenAPI docs**: `GET http://localhost:8000/docs`
