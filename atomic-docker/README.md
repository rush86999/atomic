# Docker solution

## Disclaimer
- ⚠️ This is a work in progress and will take some time to be complete

## Seeking help
- Are you interested in creating then next open source self hosted AI planner for your calendar?
- Imagine a self-hosted solution integrating with all the popular calendars and be first to market. Contact me! I'm looking for cofounders and / or co-maintainers.

## Roadmap

Each service currently used needs to be replaced with a containerized docker solution

1. OpenSearch - docker image is available and with nginx can be used with basic Auth server side
2. Dynamodb - Replace with Postgres tables. 
3. DataStore - Replace with nHost + Apollo client. Already using apollo client.
4. Cognito - Replace with nhost Auth
5. SQS - Replace with Apache Kafka + Quarkus for a native docker image
6. Serverless functions - nHost
7. SES - Replace with nodemailer but email delivery provider will still be SES
8. Optaplanner - Already a native docker container

