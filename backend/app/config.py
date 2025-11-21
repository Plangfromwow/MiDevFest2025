from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Convex Configuration
    convex_url: str
    convex_admin_key: str
    
    # Google Business Profile Configuration
    google_client_id: str
    google_client_secret: str
    google_refresh_token: str
    google_location_id: str
    google_account_id: Optional[str] = None
    
    # watsonx.ai Configuration
    watsonx_api_key: str
    watsonx_project_id: str
    watsonx_url: str
    watsonx_model_id: str
    watsonx_deployment_id: Optional[str] = None
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get application settings singleton"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reload_settings() -> Settings:
    global _settings
    _settings = Settings()
    return _settings