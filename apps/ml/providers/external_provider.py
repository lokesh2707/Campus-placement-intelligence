from typing import List, Dict, Any, Optional
from .base import AIProvider

class ExternalAIProvider(AIProvider):
    """
    Optional external cloud provider stub.
    NOT a mandatory dependency - purely for future optional cloud extension.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2
    ) -> str:
        raise NotImplementedError("External AI provider is optional and not enabled for this installation.")

    async def generate_embeddings(self, text: str) -> List[float]:
        raise NotImplementedError("External AI provider is optional and not enabled for this installation.")

    async def health_check(self) -> Dict[str, Any]:
        return {
            "provider": "external_optional",
            "status": "disabled",
            "is_local": False,
            "message": "Optional external provider not configured. Local Ollama engine used by default."
        }
