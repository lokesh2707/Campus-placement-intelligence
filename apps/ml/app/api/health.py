from fastapi import APIRouter
from datetime import datetime, timezone
from app.config import settings
from app.schemas.health import HealthResponse
from app.services.ollama import ollama_service

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def get_health():
    ai_status = await ollama_service.check_status(timeout_sec=1.0)
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.version,
        ai_provider=ai_status,
    )

@router.get("/ready")
async def get_readiness():
    ai_status = await ollama_service.check_status(timeout_sec=1.5)
    return {
        "status": "ready",
        "service": settings.service_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ollama": ai_status,
    }
