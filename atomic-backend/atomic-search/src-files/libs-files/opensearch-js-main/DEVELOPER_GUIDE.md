- [Developer Guide](#developer-guide)
  - [Getting Started](#getting-started)
    - [Git Clone OpenSearch Node.js Client Repository](#git-clone-opensearch-nodejs-client-repository)
    - [Install Prerequisites](#install-prerequisites)
      - [Node.js](#nodejs)
      - [Docker](#docker)
    - [Unit Testing](#unit-testing)
    - [Integration Testing](#integration-testing)
      - [Execute integration tests from your terminal](#execute-integration-tests-from-your-terminal)

# Developer Guide

So you want to contribute code to the OpenSearch Node.js Client? Excellent! We're glad you're here. Here's what you need to do:

## Getting Started

### Git Clone OpenSearch Node.js Client Repository

Fork [opensearch-project/opensearch-js](https://github.com/opensearch-project/opensearch-js) and clone locally,
e.g. `git clone https://github.com/[your username]/opensearch-js.git`.

### Install Prerequisites

#### Node.js

The minimum supported version of Node.js is v10.

#### Docker

[Docker](https://docs.docker.com/install/) is required for building some OpenSearch artifacts and executing integration tests.

### Unit Testing

Go to your terminal and run:

```
cd folder-path
npm run test:unit
```

To run a specific unit test, you can use the following jest command. `npm test` will not work.

```
cd folder-path/to/test
jest TestName
```

If you don't have jest, you can install it via npm or yarn

```
npm i -g jest-cli
yarn global add jest-cli
```

### Integration Testing

In order to test opensearch-js client, you need a running OpenSearch cluster. You can use Docker to accomplish this.
The [Docker Compose file](.ci/opensearch/docker-compose.yml) supports the ability to run integration tests for the project in local environments.
If you have not installed docker-compose, you can install it from this [link](https://docs.docker.com/compose/install/).

#### Execute integration tests from your terminal

1. Run below command to start containers. By default, it will launch latest OpenSearch cluster.

   ```
   cd folder-path/.ci/opensearch
   docker-compose up
   ```

2. Run all integration tests.
   ```
   npm run test:integration:helpers
   ```
3. Stop and clean containers.
   ```
   docker-compose down
   ```
