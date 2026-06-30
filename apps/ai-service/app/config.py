"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AI Service settings — loaded from environment or .env file."""

    # App
    APP_NAME: str = "Community Hero AI Service"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:4000"]

    # API Key for service-to-service auth
    AI_SERVICE_API_KEY: str = "changeme"

    # Redis (for caching inference results)
    REDIS_URL: str = "redis://localhost:6379"

    # Model settings
    MODEL_CACHE_DIR: str = "/tmp/models"
    GEMINI_API_KEY: str = "changeme"
    
    # External services
    MAIN_API_URL: str = "http://localhost:4000/api/v1"
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
