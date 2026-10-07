from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config
from providers import AIProvider, OllamaProvider, ExternalAIProvider

app = FastAPI(
    title=config.service_name,
    version=config.version,
    description="Campus Placement Intelligence AI/ML microservice - local-first, free-tier architecture."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_ai_provider() -> AIProvider:
    if config.ai_provider == "external":
        return ExternalAIProvider()
    return OllamaProvider(
        base_url=config.ollama_base_url,
        default_model=config.ollama_model
    )

provider = get_ai_provider()

@app.get("/")
async def root():
    return {
        "service": config.service_name,
        "version": config.version,
        "status": "online",
        "documentation": "/docs"
    }

@app.get("/health")
async def health():
    ai_health = await provider.health_check()
    return {
        "status": "healthy",
        "service": config.service_name,
        "version": config.version,
        "ai_provider": ai_health,
    }

@app.get("/api/v1/models/status")
async def models_status():
    ai_health = await provider.health_check()
    return {
        "configured_provider": config.ai_provider,
        "default_model": config.ollama_model,
        "embedding_model": config.embedding_model,
        "details": ai_health
    }
