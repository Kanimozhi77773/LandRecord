import os
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from .config import settings
from .api.routes import router as api_router
from .services.database_service import DatabaseService
from .services.gemini_health_service import GeminiHealthService

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Historical Tamil Nadu Land Document Digitization System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload/processed directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)

# Mount static file directories for viewing original and enhanced document images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/processed", StaticFiles(directory=settings.PROCESSED_DIR), name="processed")

# Custom Exception Handler to return clean JSON errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Exception during request {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "processing_status": "failed",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while processing the land document. Please try again."
            }
        }
    )

# Include API Router under /api
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Also expose direct health checks at root for maximum client compatibility
@app.get("/health", tags=["System"])
async def root_health():
    mongo_ok = DatabaseService.ping_database()
    gemini_health = await GeminiHealthService.check_gemini_health()
    overall = "healthy" if (mongo_ok and gemini_health.get("status") == "healthy") else "degraded"
    return {
        "status": overall,
        "services": {
            "api": "healthy",
            "mongodb": "healthy" if mongo_ok else "offline",
            "gemini": gemini_health.get("status", "healthy")
        },
        "gemini_details": gemini_health,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health/gemini", tags=["System"])
async def root_gemini_health():
    return await GeminiHealthService.check_gemini_health()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
