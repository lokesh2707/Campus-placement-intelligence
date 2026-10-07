from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.health import router as health_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="Campus Placement Intelligence ML Service",
        version=settings.version,
        description="Python FastAPI service for local AI resume parsing and semantic embeddings.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)

    @app.get("/")
    async def root():
        return {
            "service": settings.service_name,
            "version": settings.version,
            "status": "online",
            "health_endpoint": "/health",
        }

    return app

app = create_app()
