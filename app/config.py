import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "REKHA - AI-Powered Land Record Intelligence"
    API_V1_PREFIX: str = "/api"
    
    # AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "models/gemini-3.6-flash")
    
    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "land_document_ai")
    
    # Perceptual Hashing & Duplicate Thresholds (Hamming Distance)
    PHASH_EXACT_THRESHOLD: int = int(os.getenv("PHASH_EXACT_THRESHOLD", "0"))
    PHASH_LIKELY_DUPLICATE_THRESHOLD: int = int(os.getenv("PHASH_LIKELY_DUPLICATE_THRESHOLD", "5"))
    PHASH_SIMILAR_THRESHOLD: int = int(os.getenv("PHASH_SIMILAR_THRESHOLD", "10"))
    
    # Storage & Upload Limits
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    PROCESSED_DIR: str = os.getenv("PROCESSED_DIR", "processed")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]
    
    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
