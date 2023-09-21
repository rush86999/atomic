# Self hosted docker solution

## Tech Stack
- Traefik
- Optaplanner [kotlin language]
- Classification model
- Node.js
- Typescript
- Opensearch
- Hasura
- Postgres
- Supertokens
## Build Steps

The build steps are to start a docker compose file on a local machine with Cloudflare tunnel. The tunnel will allow you to sync with Google calendar.

### 1. Get Cloudflared setup on your local machine
- Refer to docs to install and run [Cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/tunnel-guide/) locally
- You will need a custom domain

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
- Configure with Hasura. Read the [SuperTokens Guide](https://supertokens.com/docs/thirdpartyemailpassword/hasura-integration/with-jwt#)
- HASURA_GRAPHQL_JWT_SECRET='{ "jwk_url": "{apiDomain}/{apiBasePath}/jwt/jwks.json"}'

### 4. Generate Certs for OpenSearch

- See OpenSearch documentation. https://opensearch.org/docs/latest/security/configuration/generate-certificates/.

### 5. Opensearch setup

1. Change OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD
2. Generate hash using [gen_hash.py](./project/opensearch/gen_hash.py)
3. Store values in internal_users.yml
4. Check role_mapping.yml for username provided
5. Check roles.yml for consistency

### 6. Optaplanner sync
- OPTAPLANNER_USERNAME & OPTAPLANNER_PASSWORD -> sync with add data to table sql command for admin_user table:
  - ```INSERT INTO admin_user (id, username, password, role) VALUES (1, 'admin', 'password', 'admin');```
    - Change values 2nd and 3rd position part of the ```VALUES``` t

### 7. Classification sync
- CLASSIFICATION_PASSWORD is SAME AS API_TOKEN and MUST BE SAME
- CLASSIFICATION_USERNAME is hard coded
### 8. Start docker compose

```
cp .env.example .env
docker-compose up -d
```

### 9. Apply Hasura Metadata
- ```hasura metadata apply --endpoint "http://localhost:8080" --admin-secret "hello123"```
- Make sure to have [hasura cli installed](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)
- Make sure to cd into ```project``` directory 



