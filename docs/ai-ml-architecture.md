# AI/ML Architecture & Zero-Cost Intelligence Engine

## 1. Zero-Cost Architectural Philosophy

The AI/ML subsystem is built around **open-source, local-first inference**.
The platform operates with **₹0 mandatory expenditure**, avoiding recurring billing from closed AI providers (OpenAI, Anthropic, Gemini, Pinecone).

```text
Next.js / Mobile Apps
        ↓ (HTTP/REST)
Node.js Backend API
        ↓ (Internal HTTP / gRPC)
Python FastAPI Service (port 8000)
        ↓
┌──────────────────────────────────────────────┐
│ AIProvider Abstraction Layer                 │
│                                              │
│   ├── OllamaProvider (Default Local LLM)     │
│   │     • Llama 3.2 (3B/1B)                  │
│   │     • Mistral / Qwen                     │
│   │                                          │
│   ├── Sentence Transformers (Local Vectors)  │
│   │     • all-MiniLM-L6-v2 (384-dim)         │
│   │                                          │
│   ├── ML Classifiers (scikit-learn, XGBoost) │
│   │     • Placement Readiness Engine         │
│   │                                          │
│   └── ExternalAIProvider (Optional Stub)     │
└──────────────────────────────────────────────┘
```

---

## 2. Separation of Deterministic Rules vs AI/ML

A critical design rule of this platform is: **Never use probabilistic LLMs for deterministic business logic.**

### 2.1 Handled by Deterministic Backend Engine (Node.js + PostgreSQL)
- **Eligibility criteria**:
  ```text
  Student.cgpa >= Drive.minCgpa (e.g., 7.5)
  AND Student.activeBacklogs == 0
  AND Drive.allowedDepartments CONTAINS Student.departmentId
  AND Student.gender IN Drive.allowedGenders
  ```
- **College Placement Policies**: "One Student One Offer", "Dream Slot Upgrades" (e.g., offer CTC must be >= 1.5x current offer CTC).
- **Deadlines**: Strict timestamp comparisons for drive registration cutoffs.

### 2.2 Handled by AI/ML Service (Python FastAPI)
- **Resume Information Extraction**: Extracting unstructured sections, projects, certifications, and achievements into structured JSON.
- **Semantic Matching & Ranking**: Comparing student resume embeddings against job descriptions using vector cosine distance in pgvector.
- **Skill-Gap Analysis**: Identifying missing skills required for target jobs and generating contextual improvement roadmaps.
- **Placement Readiness Score**: Supervised tabular models (XGBoost / Random Forest) trained on historical placement datasets (CGPA, assessment scores, internship count, mock interview ratings).
- **Student AI Career Assistant**: Contextual career guidance powered by local Ollama models.

---

## 3. Provider Abstraction Pattern

The ML service avoids vendor lock-in through the `AIProvider` base class:

```python
class AIProvider(ABC):
    @abstractmethod
    async def generate_completion(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        pass

    @abstractmethod
    async def generate_embeddings(self, text: str) -> List[float]:
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        pass
```

- **Default Implementation**: `OllamaProvider` connects to `http://localhost:11434` or the Docker container `ollama:11434`.
- **Zero Cost Execution**: Runs entirely on developer CPU or local consumer GPU.

---

## 4. Vector Search & Storage (pgvector)

Instead of hosted vector databases (Pinecone, Weaviate), vector embeddings are stored directly in PostgreSQL using `pgvector`:

1. **Embedding Dimension**: 384 dimensions using the lightweight, high-performance `all-MiniLM-L6-v2` model.
2. **Indexing**: Uses PostgreSQL HNSW (Hierarchical Navigable Small World) index:
   ```sql
   CREATE INDEX idx_embeddings_vector ON "Embedding" 
   USING hnsw (vector vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```
3. **Querying**: Fast cosine distance queries:
   ```sql
   SELECT entity_id, 1 - (vector <=> target_embedding) AS similarity
   FROM "Embedding"
   WHERE entity_type = 'STUDENT_RESUME'
   ORDER BY vector <=> target_embedding ASC
   LIMIT 50;
   ```

---

## 5. Machine Learning Models (scikit-learn & XGBoost)

- **Model 1: Placement Readiness Estimator**:
  - Algorithm: XGBoost Classifier / Regressor.
  - Features: Academic percentiles, CGPA, coding test performance, technical interview ratings, past internships count, verified skill counts.
  - Output: Readiness probability (0.0 to 1.0) and key risk factors.
- **Model 2: Placement Package Tier Predictor**:
  - Algorithm: Multi-class Random Forest / Gradient Boosting.
  - Output: Likelihood of placement in Mass, Core, Dream, or Super Dream categories.
