import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediPredict AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security & Cryptography
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medipredict_ai_secure_dev_jwt_key_2026_change_in_production")
    AUDIT_SIGNING_SECRET: str = os.getenv("AUDIT_SIGNING_SECRET", "medipredict_ai_audit_signing_hmac_secret_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting & Abuse Prevention
    RATE_LIMIT_LOGIN_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", "15"))
    RATE_LIMIT_AI_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_AI_PER_MINUTE", "30"))
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_UPLOAD_PER_MINUTE", "15"))
    RATE_LIMIT_GENERAL_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_GENERAL_PER_MINUTE", "120"))
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB strict limit
    
    # Database
    # Default to sqlite for local dev and testing, easily overridden by DATABASE_URL for Postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{Path(__file__).resolve().parent.parent.parent}/medipredict.db"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v or f"sqlite:///{Path(__file__).resolve().parent.parent.parent}/medipredict.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "https://medipredict-k2upabmcy-ranjeet7680s-projects.vercel.app",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]] | None) -> List[str]:
        default_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:5173",
            "https://medipredict-k2upabmcy-ranjeet7680s-projects.vercel.app",
        ]
        if isinstance(v, str) and not v.startswith("["):
            extra = [i.strip() for i in v.split(",") if i.strip()]
            return list(set(default_origins + extra))
        elif isinstance(v, list):
            return list(set(default_origins + v))
        return default_origins
    
    # Storage (Private quarantine directory)
    UPLOAD_DIR: Path = Path(__file__).resolve().parent.parent.parent / "uploads"
    
    # AI Providers Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "clinical_evidence")  # clinical_evidence, gemini, openai, local
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    LOCAL_MODEL_BASE_URL: str = os.getenv("LOCAL_MODEL_BASE_URL", "http://localhost:11434/v1")

    # Supabase Configuration (Safely sourced from environment)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://affjbuibhbejzzrwdusw.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_PROJECT_REF: str = os.getenv("SUPABASE_PROJECT_REF", "affjbuibhbejzzrwdusw")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
