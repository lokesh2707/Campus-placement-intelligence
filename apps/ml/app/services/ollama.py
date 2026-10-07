import httpx
from typing import Dict, Any, List
from app.config import settings

class OllamaService:
    def __init__(self, base_url: str = settings.ollama_base_url):
        self.base_url = base_url.rstrip("/")

    async def check_status(self, timeout_sec: float = 2.0) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=timeout_sec) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "provider": "ollama",
                        "status": "connected",
                        "is_local": True,
                        "default_model": settings.ollama_model,
                        "available_models": models,
                    }
        except Exception as e:
            return {
                "provider": "ollama",
                "status": "disconnected",
                "is_local": True,
                "default_model": settings.ollama_model,
                "available_models": [],
                "error": str(e),
            }

        return {
            "provider": "ollama",
            "status": "unknown",
            "is_local": True,
            "default_model": settings.ollama_model,
            "available_models": [],
        }

ollama_service = OllamaService()
