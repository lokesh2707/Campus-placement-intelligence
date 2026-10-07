from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "placement-ml"
    timestamp: str
    version: str = "0.1.0"
    ai_provider: Optional[Dict[str, Any]] = None

class OllamaStatus(BaseModel):
    provider: str = "ollama"
    status: str
    is_local: bool = True
    default_model: str
    available_models: List[str] = []
