from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_hours: int = 8
    app_env: str = "development"
    allowed_origins: str = "http://localhost:3000"
    frontend_url: str = "http://localhost:3000"

    # SMTP email (Gmail)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "MedVerify"

    # Pinecone (Phase 2)
    pinecone_api_key: str = ""
    pinecone_index_name: str = "medverify"

    # Supabase Storage bucket for raw document files (Phase 2)
    supabase_storage_bucket: str = "documents"

    # Groq LLM (Phase 3)
    groq_api_key: str = ""



    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
