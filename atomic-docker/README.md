# Self hosted docker solution

## Tech Stack
- Traefik
- [Optaplanner](https://github.com/rush86999/atomic-scheduler/tree/main/kotlin-quarkus)
- LLM
- Node.js
- Typescript
- LanceDb
- PostGraphile
- Postgres
- Supertokens
- Kafka
- Express
- Agenda
- Mongodb
  
## Build Steps

The build steps are to start a docker compose file on a local machine with Cloudflare tunnel. The tunnel will allow you to sync with Google calendar.

### 1. Get Cloudflared setup on your local machine
- Refer to docs to install and run [Cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/tunnel-guide/) locally
- You will need a custom domain that resolves to your server's public IP address.
- Ensure ports 80 and 443 are open on your server's firewall to allow Traefik to perform the Let's Encrypt HTTP challenge and serve HTTPS traffic.

### 2. Get Google Client Ids for Google Calendar

To get the client ID and client secret for testing Google Calendar API, you need to follow these steps:

- Go to the [Google APIs Console](^1^) and sign in with your Google account.
- Create a new project or select an existing one.
- Enable the Google Calendar API for your project.
- Click on Credentials in the left sidebar and then click on Create credentials > OAuth client ID.
- Select Web application as the application type and enter a name for your client ID.
- Specify the authorized JavaScript origins and redirect URIs for your web application. For testing purposes, you can use http://localhost or http://localhost:<port_number> as the origin and redirect URI. For this guide, it will be the domain you use for Cloudflared.
- Click on Create and you will see a pop-up window with your client ID and client secret. Copy and save them somewhere safe.
- You will be generating 2 sets of client Ids. 1 for handshake and 1 for the web. 
  - Handshake redirect env variable: GOOGLE_REDIRECT_URL: https://${HOST_NAME}/v1/oauth/api/google-calendar-handshake/oauth2callback
  - Web redirect env variable: NEXT_PUBLIC_GOOGLE_OAUTH_ATOMIC_WEB_REDIRECT_URL: https://${HOST_NAME}/api/google/oauth-callback

You can also refer to this [guide](^3^) for more details and screenshots.

(1) Get your Google API client ID. https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid.
(2) Google Client ID and Client Secret - Simply Schedule Appointments. https://simplyscheduleappointments.com/guides/google-api-credentials/.
(3) Get Google Calendar Client ID And Client Secret Key. https://weblizar.com/blog/get-google-calendar-client-id-and-client-secret-key/.
(4) how we get client ID and client secret of google calendar in Salesforce .... https://www.forcetalks.com/salesforce-topic/how-we-get-client-id-and-client-secret-of-google-calendar-in-salesforce/.
(5) undefined. https://console.developers.google.com/apis.


### 3. For Supertokens
- Configure with PostGraphile. SuperTokens provides JWTs that PostGraphile can consume.
- You will need to ensure that the JWT generated by SuperTokens contains a `role` claim (or another claim you configure PostGraphile to use) that corresponds to a PostgreSQL role.
- The `PGRAPHILE_JWT_SECRET` in PostGraphile's environment should match the secret SuperTokens uses to sign the JWTs.
- For JWT verification, PostGraphile typically expects a raw secret or a JWKS URL. If SuperTokens exposes a JWKS URL, you can use `PGRAPHILE_JWT_VERIFY="jwks-url"` and `PGRAPHILE_JWT_JWKS_URL="your_supertokens_jwks_url"`. If using a shared secret, ensure `PGRAPHILE_JWT_SECRET` is set.
- Refer to PostGraphile documentation on JWT authentication and SuperTokens documentation for JWT customization.

### 4. Generate Certs for OpenSearch

- See OpenSearch documentation. https://opensearch.org/docs/latest/security/configuration/generate-certificates/.
- Mount volume with certs accordingly to generated files

### 5. Opensearch setup

1. Change OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD
2. Generate hash using [gen_hash.py](./project/opensearch/gen_hash.py)
3. Store values in [internal_users.yml](./project/opensearch/config/internal_users.yml)
4. Check [role_mapping.yml](./project/opensearch/config/roles_mapping.yml) for username provided
5. Check [roles.yml](./project/opensearch/config/roles.yml) for consistency

### 6. Optaplanner sync
- OPTAPLANNER_USERNAME & OPTAPLANNER_PASSWORD -> sync with add data to table sql command for admin_user table:
  - ```INSERT INTO admin_user (id, username, password, role) VALUES (1, 'admin', 'password', 'admin');```
    - Change values 2nd and 3rd position part of the ```VALUES``` 
    - located in ```atomic-docker/project/initdb.d/optaplanner-create-schema.sql```

### 7. Classification sync
- CLASSIFICATION_PASSWORD is SAME AS API_TOKEN and MUST BE SAME
- CLASSIFICATION_USERNAME is hard coded
### 8. Start docker compose
- Make sure to fill in empty env variables in your `.env` file based on `.env.example`. Key variables to add/update for new features include:
  - `NOTION_API_TOKEN`
  - `NOTION_NOTES_DATABASE_ID`
  - `DEEPGRAM_API_KEY`
  - `NOTION_RESEARCH_PROJECTS_DB_ID`
  - `NOTION_RESEARCH_TASKS_DB_ID`
  - `LANCEDB_URI` (e.g., `file:///app/project/data/lancedb` if you want to store LanceDB data within the `project/data` directory, which is volume-mounted by the `python-agent` service. Adjust path as needed.)
  - `LETSENCRYPT_EMAIL`: **Important for HTTPS**. Your valid email address for Let's Encrypt registration and renewal notifications.
  - Remove any OpenSearch-related variables (e.g., `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`).
- Make sure the necessary data folders are created for storage such as
  - ```./project/postgres/data``` (Note: path updated to be relative to `atomic-docker` directory, assuming docker-compose is run from `atomic-docker/project`)
  - ```./project/data/lancedb``` (If using the example `LANCEDB_URI` above)
  - ```./project/letsencrypt```

```
# Navigate to the directory containing docker-compose.yaml
cd project
cp .env.example .env # Then edit .env with your actual secrets and IDs
docker-compose up -d
```

### Important Security Considerations for `.env` File

The `.env` file contains highly sensitive information, including database credentials, API keys, and secret keys. Protecting this file is crucial for the security of your deployment.

- **Strong, Unique Values:** Replace **ALL** placeholder values in your `.env` file (copied from `.env.example`) with strong, unique, and randomly generated secrets where applicable (e.g., `POSTGRES_PASSWORD`, `PGRAPHILE_JWT_SECRET`, `API_TOKEN`). Do not use default or easily guessable passwords. PostGraphile doesn't use a direct admin secret like Hasura for API access; control is via PostgreSQL roles and JWTs.
- **Secure File Permissions:** Once your `.env` file is on the server, set strict file permissions to ensure it's only readable by the user that will run the `docker-compose` command (this is often the `root` user or a dedicated `docker` user).
  ```bash
  chmod 600 .env
  ```
- **Do Not Commit `.env`:** The `.env` file itself should **NEVER** be committed to version control (e.g., Git). The `.gitignore` file in the project should already list `.env` to prevent accidental commits. Only `.env.example` should be version controlled.
- **Secure Transfer to Server:** When transferring the populated `.env` file to your server, use secure methods like `scp`, `sftp`, or by copy-pasting the content into a file via a secure SSH session. Avoid insecure methods like email.
- **Periodic Review:** Periodically review and consider rotating critical secrets stored in the `.env` file, especially if you suspect a potential compromise or as part of good security hygiene.

For more advanced deployments, especially when scaling beyond a single host or using container orchestration platforms like Docker Swarm or Kubernetes, consider using their built-in secret management features (e.g., Docker Secrets, Kubernetes Secrets) or dedicated secret management tools like HashiCorp Vault.

### Updating the Application (Docker Compose)

To update your self-hosted Docker Compose deployment to the latest version or apply configuration changes:

1.  **Backup Your Data:** **Strongly recommended before any update.** At a minimum, backup your PostgreSQL database (see "Database Backup and Restore" section) and any other critical data stored in Docker volumes (e.g., Minio data, LanceDB data if its path is within a persistent volume defined in `docker-compose.yaml`).
2.  **Navigate to Project Directory:** Ensure you are in the `atomic-docker/project` directory where your `docker-compose.yaml` and `.env` files are located.
    ```bash
    cd /path/to/your/atomic-docker/project
    ```
3.  **Pull Latest Changes (if tracking a Git repository):** If you're running the application from a clone of the official repository or your own fork, pull the latest changes:
    ```bash
    git pull origin main # Or your relevant branch
    ```
    This will update `docker-compose.yaml`, application code (if using local builds and volume mounts for development - less common for production), and potentially other configuration files.
4.  **Pull Latest Docker Images (for services not built locally):** For images pulled from Docker Hub or other registries (e.g., `postgres`, `traefik`, `mongo`, `supertokens`, `hasura/graphql-engine`, `minio/minio`, `confluentinc/*`, `mailhog/mailhog`):
    ```bash
    docker-compose pull
    ```
5.  **Rebuild Local Images (if applicable):** If your `docker-compose.yaml` uses `build:` directives for services like `app`, `functions`, `python-agent`, `handshake`, `oauth`, or `optaplanner` (if `atomic-scheduler:latest` is built locally), you need to rebuild them:
    ```bash
    docker-compose build
    ```
6.  **Restart Services:** Apply the changes by restarting your Docker Compose stack. Using `--remove-orphans` is good practice to remove any containers for services that might have been removed from `docker-compose.yaml`.
    ```bash
    docker-compose up -d --remove-orphans
    ```
7.  **Apply Database Migrations:**
    *   PostGraphile automatically picks up schema changes from the PostgreSQL database. Ensure your database migration scripts (SQL files) are applied to the database directly using a tool like `psql` or your chosen migration tool.
    *   The concept of "applying metadata" like with Hasura is not directly applicable. PostGraphile reflects the live database schema.
    *   If you have SQL migration files (e.g., in `project/migrations/`), ensure they are run against the PostgreSQL container.
8.  **Verify Application:** Check that all services are running correctly (`docker-compose ps`) and test the application's functionality. Review logs for any errors (`docker-compose logs <service_name>`). Pay special attention to `postgraphile` logs and any services that consume the GraphQL API.

### Basic Monitoring and Health Checks (Docker Compose)

When running the application using Docker Compose on your own server, basic monitoring is essential to ensure services are operational.

**1. Checking Container Status:**

*   Use `docker-compose ps` (from within the `atomic-docker/project` directory) or `docker ps -a` to view the status of all containers.
    *   Look at the `STATUS` column. Healthy containers with healthchecks defined (like `postgres`, `app`, `functions`, `supertokens`, `postgraphile`, `optaplanner`, `handshake`, `oauth`) will show `Up X seconds (healthy)`.
    *   If a container is `Up X seconds (unhealthy)`, it means its healthcheck is failing.
    *   If a container is constantly restarting, there's likely an issue with its configuration or an internal error.
*   Check logs for specific containers if they are unhealthy or restarting:
    ```bash
    docker-compose logs <service_name>
    # Example: docker-compose logs app
    # Example: docker-compose logs postgraphile
    # To follow logs: docker-compose logs -f <service_name>
    ```
*   Most services are configured with `restart: always` or `restart: unless-stopped`, so Docker will attempt to restart them if they crash.

**2. Host Server Resource Monitoring:**

The overall health of your server impacts the application. Monitor basic resources:
*   **CPU and Memory Usage:** Use tools like `top`, `htop`, or `vmstat`. Sustained high CPU or memory usage might indicate a need to upgrade your server resources or optimize application performance.
*   **Disk Space:** Use `df -h`. Ensure your server has enough free disk space, especially for Docker images, container logs, and persistent data volumes (like Postgres data, Minio storage). Running out of disk space is a common cause of service failure.
    *   Regularly prune unused Docker images, volumes, and build caches if disk space is a concern: `docker system prune -a --volumes` (use with caution as it removes unused data).
*   **Network Connectivity:** Ensure your server has stable network connectivity.

**3. Basic Alerting (Self-Managed):**

For a self-hosted Docker Compose setup, you might consider:
*   **External Uptime Monitoring:** Use a free or paid service (e.g., UptimeRobot, Freshping, StatusCake) to ping your application's main URL (`https://${HOST_NAME}`). This will alert you if the application becomes unreachable from the internet.
*   **Disk Space Alerts:** Set up a simple cron job on your server to check available disk space and send an email if it falls below a critical threshold (e.g., less than 10-20% free).
    Example script snippet for disk check:
    ```bash
    #!/bin/bash
    THRESHOLD=20 # Alert if less than 20% free
    CURRENT_USAGE=$(df / | grep / | awk '{ print $5 }' | sed 's/%//g')
    if [ "$CURRENT_USAGE" -gt $((100-THRESHOLD)) ] ; then
        # Send email alert
        echo "CRITICAL: Disk space usage on $(hostname) is at ${CURRENT_USAGE}%" | mail -s "Disk Space Alert: $(hostname)" your-email@example.com
    fi
    ```
*   **Regular Log Review:** Periodically check the logs of critical services for errors or unusual activity, especially if you notice performance issues.

More advanced monitoring and alerting (like Prometheus, Grafana, ELK stack for logs) can be set up but require more configuration and resources. For a single-user or small business VPS setup, the basics above provide a good starting point.

### 9. Apply Hasura Metadata
- ```hasura metadata apply --endpoint "http://localhost:8080" --admin-secret "YOUR_HASURA_ADMIN_SECRET"```
- Make sure to have [hasura cli installed](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)
- Make sure to `cd` into the `project/metadata` directory or use `--project project/metadata --skip-update-check` flags if running from `project` directory.

### Database Backup and Restore (PostgreSQL)

Regularly backing up your PostgreSQL database is crucial for data protection and recovery in case of hardware failure, data corruption, or accidental deletion. This section outlines how to perform backups and restores for the PostgreSQL container running in this Docker Compose setup.

**1. Performing Backups**

We will use the `pg_dump` utility to create a logical backup of your database. This command should be run on the host machine where Docker is running.

*   **Identify your PostgreSQL container name:** By default, it's `postgres` as defined in `docker-compose.yaml` (inside the `project` directory, the full name might be `project-postgres-1` or similar if `docker-compose` adds project prefixes. Use `docker ps` to confirm the running container name). For the commands below, we'll assume the service name `postgres` can be used with `docker-compose exec`.
*   **Database Name:** The default database name used by Hasura and other services is typically `postgres`. Confirm this from your `HASURA_GRAPHQL_DATABASE_URL` in the `.env` file if unsure (it's the part after the last `/`).
*   **PostgreSQL Username:** This is defined by `POSTGRES_USERNAME` in your `.env` file (default is `postgres`).

**Command to create a backup:**

```bash
# Ensure you are in the atomic-docker/project directory where your docker-compose.yaml is
# Replace YOUR_BACKUP_PATH with the desired path on your host machine to store the backup
# Example: /srv/backups/atomic-postgres/
YOUR_BACKUP_PATH="/path/to/your/backups/"
DB_USER="${POSTGRES_USERNAME:-postgres}" # Use default from .env.example if not set
DB_NAME="postgres" # Default database name
BACKUP_FILE="${YOUR_BACKUP_PATH}atomic_db_backup_$(date +%Y%m%d_%H%M%S).sql"

# Create the backup directory if it doesn't exist
mkdir -p "${YOUR_BACKUP_PATH}"

# Execute pg_dump inside the container
docker-compose exec -T postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"

echo "Database backup created at ${BACKUP_FILE}"
# Optional: Compress the backup
# gzip "${BACKUP_FILE}"
# echo "Backup compressed: ${BACKUP_FILE}.gz"
```

**Important Considerations for Backups:**
- **Permissions:** Ensure the directory specified by `YOUR_BACKUP_PATH` is writable by the user running the `docker-compose exec` command.
- **Database Activity:** `pg_dump` creates a consistent snapshot. However, for very busy databases, consider performing backups during off-peak hours.
- **Security of Backup Files:** Backup files contain all your data. Store them in a secure location with restricted access. Encrypt them if necessary, especially if storing off-site.

**2. Automating Backups (using cron)**

You can automate the backup process using a cron job on your host machine.

Create a shell script (e.g., `backup_atomic_db.sh`) with the backup command:
```bash
#!/bin/bash

# Path to your atomic-docker/project directory
PROJECT_DIR="/path/to/your/atomic-docker/project" # ADJUST THIS PATH
BACKUP_DIR="/srv/backups/atomic-postgres/" # ADJUST THIS PATH
DB_USER="${POSTGRES_USERNAME:-postgres}" # Ensure POSTGRES_USERNAME is available in this script's env or hardcode
DB_NAME="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}atomic_db_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Navigate to project directory to use docker-compose
cd "${PROJECT_DIR}" || exit 1

# Execute pg_dump
docker-compose exec -T postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"

# Optional: Compress the backup
gzip "${BACKUP_FILE}"
echo "Database backup created and compressed: ${BACKUP_FILE}.gz"

# Optional: Prune old backups (e.g., keep last 7 days)
# find "${BACKUP_DIR}" -name "atomic_db_backup_*.sql.gz" -mtime +7 -exec rm {} \;
```
Make the script executable: `chmod +x backup_atomic_db.sh`.

Then, add a cron job. Edit your crontab using `crontab -e` and add a line like this to run the backup daily at 2 AM:
```cron
0 2 * * * /path/to/your/backup_atomic_db.sh >> /var/log/atomic_backup.log 2>&1
```
Adjust the script path and schedule as needed. Ensure the `POSTGRES_USERNAME` variable is correctly sourced by the cron job or hardcode it in the script if necessary.

**3. Backup Storage and Retention**

- **Off-Host Storage:** **Crucially important.** Do not rely solely on backups stored on the same server as your Docker host. Regularly transfer your backups to a remote, secure location (e.g., another server, cloud storage like AWS S3, Backblaze B2, Google Cloud Storage, or even a separate physical drive stored securely).
- **Retention Policy:** Define how long you need to keep backups. A common strategy is:
    - Daily backups for the last 7 days.
    - Weekly backups for the last 4 weeks.
    - Monthly backups for the last 6-12 months.
  Implement this policy by regularly deleting older backups that are no longer needed, either manually or via scripting in your backup storage solution.

**4. Restoring Backups**

Restoring a database backup typically involves dropping the existing database (if it exists and you want a clean restore) and then recreating it and importing the data.

**CAUTION: Restoring a backup will overwrite the current data in the target database. Ensure you are restoring to the correct environment and have taken necessary precautions (like backing up the current state if needed).**

*   **Command to restore a backup (assuming an uncompressed .sql file):**
    ```bash
    # Ensure you are in the atomic-docker/project directory
    YOUR_BACKUP_FILE="/path/to/your/backups/atomic_db_backup_YYYYMMDD_HHMMSS.sql" # Path to your .sql backup file
    # If compressed, decompress first: gunzip "${YOUR_BACKUP_FILE}.gz"

    DB_USER="${POSTGRES_USERNAME:-postgres}"
    DB_NAME="postgres"

    # 1. Optional: Stop services that use the database (e.g., hasura, functions, app)
    # docker-compose stop hasura functions app supertokens optaplanner python-agent
    # This is to prevent connections while restoring.

    # 2. Drop and recreate the database (if you want a clean slate)
    # docker-compose exec -T postgres psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    # docker-compose exec -T postgres psql -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"
    # Note: Dropping the 'postgres' database itself can be problematic if other system-level
    #       objects depend on it or if it's the default connection DB for psql.
    #       A safer approach for a full restore might be to restore into a new, temporary database,
    #       verify, and then rename, or to drop all tables within the existing database.
    #       For simplicity here, we assume restoring into the existing (potentially empty or to-be-overwritten) DB.

    # 3. Restore the database from the .sql file
    cat "${YOUR_BACKUP_FILE}" | docker-compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}"

    echo "Database restore from ${YOUR_BACKUP_FILE} attempted."

    # 4. Optional: Restart services if stopped
    # docker-compose start postgraphile functions app supertokens optaplanner python-agent
    ```
*   **For compressed backups (`.sql.gz`):**
    ```bash
    # Decompress and pipe to psql
    gunzip < "${YOUR_BACKUP_FILE}.gz" | docker-compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}"
    ```
*   **Using `pg_restore` (for custom format or directory format backups):** If you used `pg_dump` with `-Fc` (custom format) or `-Fd` (directory format), you would use `pg_restore`. For plain SQL dumps (`.sql`), `psql` is used as shown above.

**5. Testing Your Backups**
Regularly test your backup and restore process in a non-production environment to ensure your backups are valid and you know how to perform a restore when needed. This is a critical step often overlooked.

**6. Point-In-Time Recovery (PITR) - Advanced**
For more stringent RPO (Recovery Point Objective) requirements, PostgreSQL supports Point-In-Time Recovery by continuously archiving Write-Ahead Log (WAL) files. Setting up PITR is more complex and involves configuring `archive_command` in PostgreSQL and managing WAL archives. This is beyond a basic backup strategy but provides finer-grained recovery capabilities.


