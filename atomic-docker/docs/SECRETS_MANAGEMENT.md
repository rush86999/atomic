# Secrets and Environment Variable Management

This document outlines the necessary environment variables for running the Atom Productivity Assistant application stack. These variables should be managed in a `.env` file at the root of the `atomic-docker/project/` directory for local development.

For production environments, these variables must be managed using a secure secret management system such as AWS Secrets Manager, HashiCorp Vault, Doppler, or your cloud provider's equivalent.

## Core Application Secrets

These are essential for the application to function correctly.

-   `FLASK_SECRET_KEY`: A long, random, and secret string used by Flask to sign session cookies. **This must be changed for production.**
    -   *Example Generation*: `python -c 'import secrets; print(secrets.token_hex(32))'`
-   `DATABASE_URL`: The full connection string for the PostgreSQL database.
    -   *Format*: `postgresql://<user>:<password>@<host>:<port>/<dbname>`
    -   *Local Docker Example*: `postgresql://postgres:secretpgpassword@postgres:5432/postgres`
-   `ATOM_OAUTH_ENCRYPTION_KEY`: A 32-byte, URL-safe base64-encoded key for encrypting OAuth tokens in the database.
    -   *Generation Script*: Use the `crypto-to-base64.js` script in `atomic-docker/scripts/` or run `python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'`

## Service API Keys

These keys are required for connecting to third-party services.

-   `OPENAI_API_KEY`: Your API key from OpenAI for accessing GPT models for summarization, NLU, and embeddings.
-   `DROPBOX_APP_KEY`: The "App key" from your Dropbox App Console.
-   `DROPBOX_APP_SECRET`: The "App secret" from your Dropbox App Console.
-   `GOOGLE_CLIENT_ID_ATOMIC_WEB`: The Google Cloud project Client ID for web applications, used for GDrive OAuth.
-   `GOOGLE_CLIENT_SECRET_ATOMIC_WEB`: The Google Cloud project Client Secret.
-   `NOTION_API_KEY`: The Notion API key (Internal Integration Token) for accessing Notion databases and pages.
-   `DEEPGRAM_API_KEY`: (Optional) API key for Deepgram for audio transcription features.
-   `SERPAPI_API_KEY`: (Optional) API key for SerpApi for the research agent's web search capabilities.

## Meilisearch Configuration

-   `MEILI_MASTER_KEY`: A long, random, and secret string for securing your Meilisearch instance.
    -   *Note*: If not provided, Meilisearch may start in development mode without a master key, which is insecure.

## Application Behavior Configuration

These variables control how the application runs.

-   `APP_CLIENT_URL`: The public-facing base URL of the frontend application (e.g., `http://localhost:3000` or `https://app.yourdomain.com`). This is used to construct redirect URIs for OAuth callbacks.
-   `HOST_NAME`: The domain name for the application, used by Traefik for routing.
-   `LETSENCRYPT_EMAIL`: The email address to use for Let's Encrypt SSL certificate registration.
-   `LOG_LEVEL`: The logging level for the Python services (e.g., `INFO`, `DEBUG`).

## Other Infrastructure Secrets

-   `TRAEFIK_USER` / `TRAEFIK_PASSWORD`: Credentials for basic authentication on the Traefik dashboard.
-   `POSTGRES_PASSWORD` / `POSTGRES_USERNAME`: Credentials for the PostgreSQL database itself. Must match the `DATABASE_URL`.
-   `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`: Credentials for the MinIO S3-compatible storage.

## Example `.env` File

Create a file named `.env` in `atomic-docker/project/` with the following structure:

```env
# Core Secrets
FLASK_SECRET_KEY="your_super_secret_flask_key_here"
DATABASE_URL="postgresql://postgres:secretpgpassword@postgres:5432/postgres"
ATOM_OAUTH_ENCRYPTION_KEY="your_fernet_key_here"

# Service API Keys
OPENAI_API_KEY="sk-..."
DROPBOX_APP_KEY="..."
DROPBOX_APP_SECRET="..."
GOOGLE_CLIENT_ID_ATOMIC_WEB="..."
GOOGLE_CLIENT_SECRET_ATOMIC_WEB="..."
NOTION_API_KEY="secret_..."

# Meilisearch
MEILI_MASTER_KEY="your_super_secret_meili_key_here"

# Application Behavior
APP_CLIENT_URL="http://localhost:3000"
HOST_NAME="localhost"
LETSENCRYPT_EMAIL="your-email@example.com"
LOG_LEVEL="INFO"

# Infrastructure
TRAEFIK_USER="admin"
TRAEFIK_PASSWORD="your_traefik_password_hash_here" # Generate with htpasswd
POSTGRES_PASSWORD="secretpgpassword"
POSTGRES_USERNAME="postgres"
STORAGE_ACCESS_KEY="minio"
STORAGE_SECRET_KEY="minio123"

# Note: Other variables from docker-compose.yaml can also be placed here.
```
