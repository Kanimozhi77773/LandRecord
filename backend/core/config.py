from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH 26018 - Land Record Digitization API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Cloud connection string with admin123 password
    MONGODB_URL: str = "mongodb+srv://727724eucy028_db_user:admin123@sih-land-records.duolzeb.mongodb.net/land_records_db?retryWrites=true&w=majority&appName=sih-land-records"
    DATABASE_NAME: str = "land_records_db"
    
    # Internal AI Engine Microservice
    AI_ENGINE_SERVICE_URL: str = "http://localhost:8001/api/v1/extract"

    # Master Key for AES-256-GCM Document Encryption (32-byte hex)
    AES_MASTER_KEY_HEX: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

    class Config:
        env_file = ".env"

settings = Settings()