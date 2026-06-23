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
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
