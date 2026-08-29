from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import init_indexes
from backend.modules.ingestion.router import router as ingestion_router
from backend.modules.digital_twin.router import router as digital_twin_router
from backend.modules.audit.router import router as audit_router
from backend.modules.validation.router import router as validation_router
from backend.modules.cases.router import router as cases_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_indexes()

app.include_router(ingestion_router, prefix=settings.API_V1_STR)
app.include_router(validation_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(digital_twin_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"status": "ONLINE", "system": settings.PROJECT_NAME}