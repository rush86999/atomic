import logging
from flask import Flask
from psycopg2 import pool

# Import the centralized settings object
from .config import settings

# Import Blueprints from all the handlers
from .auth_handler_dropbox import dropbox_auth_bp
from .dropbox_handler import dropbox_bp

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL.upper(), format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    """
    Application factory for the main Python API service.
    """
    app = Flask(__name__)

    # --- Configuration ---
    # The settings object handles loading and validation.
    app.secret_key = settings.FLASK_SECRET_KEY

    # --- Database Connection Pool ---
    try:
        logger.info("Initializing PostgreSQL connection pool...")
        app.config['DB_CONNECTION_POOL'] = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.DATABASE_URL
        )
        logger.info("PostgreSQL connection pool initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database connection pool: {e}", exc_info=True)
        # Depending on strictness, we could exit or continue with the pool as None.
        app.config['DB_CONNECTION_POOL'] = None


    # --- Register Blueprints ---
    # A real implementation would refactor other handlers to use blueprints and register them here.
    # For now, I will just register the new Dropbox auth blueprint.

    app.register_blueprint(dropbox_auth_bp)
    logger.info("Registered 'dropbox_auth_bp' blueprint.")
    app.register_blueprint(dropbox_bp)
    logger.info("Registered 'dropbox_bp' blueprint.")

    # Example of registering other blueprints:
    # app.register_blueprint(document_bp)
    # app.register_blueprint(search_routes_bp)

    @app.route('/healthz')
    def healthz():
        return "OK", 200

    logger.info("Flask app created and configured.")
    return app

if __name__ == '__main__':
    # This allows running the app directly for development/debugging
    # In production, a WSGI server like Gunicorn would call create_app()
    app = create_app()
    port = int(os.environ.get("PYTHON_API_PORT", 5058)) # Using a new port for the combined service
    app.run(host='0.0.0.0', port=port, debug=True)
