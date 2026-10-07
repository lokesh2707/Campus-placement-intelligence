import httpx
from typing import List, Dict, Any, Optional
from .base import AIProvider

class OllamaProvider(AIProvider):
    """
    Default Local AI Provider utilizing locally hosted Ollama instances.
    Operates with ₹0 mandatory cost and complete data privacy.
    """

    def __init__(self, base_url: str = "http://localhost:11434", default_model: str = "llama3.2"):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2
    ) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload: Dict[str, Any] = {
                "model": self.default_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature
                }
            }
            if system_prompt:
                payload["system"] = system_prompt

            response = await client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def generate_embeddings(self, text: str) -> List[float]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "model": self.default_model,
                "prompt": text
            }
            response = await client.post(f"{self.base_url}/api/embeddings", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    return {
                        "provider": "ollama",
                        "status": "connected",
                        "available_models": models,
                        "default_model": self.default_model,
                        "is_local": True
                    }
        except Exception as e:
            return {
                "provider": "ollama",
                "status": "disconnected",
                "error": str(e),
                "is_local": True
            }
        return {"provider": "ollama", "status": "unknown", "is_local": True}
