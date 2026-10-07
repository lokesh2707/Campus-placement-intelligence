import os
from pydantic import BaseModel

class MLConfig(BaseModel):
    service_name: str = "Campus Placement AI/ML Engine"
    version: str = "0.1.0"
    environment: str = os.getenv("PYTHON_ENV", "development")
    port: int = int(os.getenv("PORT", "8000"))
    
    # AI Provider Settings
    ai_provider: str = os.getenv("AI_PROVIDER", "ollama")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

config = MLConfig()
