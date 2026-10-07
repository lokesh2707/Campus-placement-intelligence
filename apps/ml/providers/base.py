from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProvider(ABC):
    """
    Abstract AI Provider Interface.
    Enables swapping between local open-source models (Ollama)
    and optional cloud providers with zero architecture lock-in.
    """

    @abstractmethod
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2
    ) -> str:
        """Generate text completion from the language model."""
        pass

    @abstractmethod
    async def generate_embeddings(self, text: str) -> List[float]:
        """Generate dense vector embedding for text using sentence-transformers or Ollama."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check provider connectivity, available models, and operational readiness."""
        pass
