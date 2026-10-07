import os
from pydantic import BaseModel

class Settings(BaseModel):
    service_name: str = "placement-ml"
    version: str = "0.1.0"
    environment: str = os.getenv("PYTHON_ENV", "development")
    port: int = int(os.getenv("PORT", os.getenv("ML_PORT", "8000")))

    # Local Ollama Settings (Default & Zero-cost)
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

settings = Settings()
