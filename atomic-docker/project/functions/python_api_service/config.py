import logging
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """
    Centralized application settings.
    Reads from environment variables and .env file.
    """
    # Model config: load from a .env file if present
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # --- Core Application Secrets ---
    FLASK_SECRET_KEY: str = "a_very_insecure_default_secret_key"
    DATABASE_URL: str
    OPENAI_API_KEY: str
    ATOM_OAUTH_ENCRYPTION_KEY: str # For encrypting user tokens

    # --- Service-Specific Secrets ---
    DROPBOX_APP_KEY: Optional[str] = None
    DROPBOX_APP_SECRET: Optional[str] = None
    NOTION_API_KEY: Optional[str] = None # Used by ingestion pipeline
    DEEPGRAM_API_KEY: Optional[str] = None # Used by audio processing
    SERPAPI_API_KEY: Optional[str] = None # Used by research agent

    # --- Meilisearch Config ---
    MEILI_HTTP_ADDR: str = "http://meilisearch:7700"
    MEILI_MASTER_KEY: str

    # --- LanceDB Config ---
    LANCEDB_URI: str = "/lancedb_data/atom_core_db" # Default path inside Docker
    LANCEDB_DOCUMENTS_TABLE: str = "generic_documents"
    LANCEDB_DOCUMENT_CHUNKS_TABLE: str = "document_chunks"

    # --- Application Behavior ---
    APP_CLIENT_URL: str = "http://localhost:3000"
    LOG_LEVEL: str = "INFO"


# Create a single, immutable instance of the settings to be used across the application.
try:
    settings = Settings()
    # Log a warning if the default Flask secret key is being used.
    if settings.FLASK_SECRET_KEY == "a_very_insecure_default_secret_key":
        logger.warning("SECURITY WARNING: Using the default FLASK_SECRET_KEY. This is insecure and should be changed for production.")
except Exception as e:
    # This will catch errors from Pydantic if a required setting (one without a default) is missing.
    logger.error(f"CRITICAL: Failed to load application settings. Missing required environment variable(s). Error: {e}", exc_info=True)
    # Re-raise the exception to prevent the application from starting with incomplete configuration.
    raise
