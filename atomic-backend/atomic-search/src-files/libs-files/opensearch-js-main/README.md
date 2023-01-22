[![Nodejs](https://github.com/opensearch-project/opensearch-js/actions/workflows/nodejs.yml/badge.svg)](https://github.com/opensearch-project/opensearch-js/actions/workflows/nodejs.yml)
[![Integration](https://github.com/opensearch-project/opensearch-js/actions/workflows/integration.yml/badge.svg)](https://github.com/opensearch-project/opensearch-js/actions/workflows/integration.yml)
[![Bundler](https://github.com/opensearch-project/opensearch-js/actions/workflows/bundler.yml/badge.svg)](https://github.com/opensearch-project/opensearch-js/actions/workflows/bundler.yml)
[![codecov](https://codecov.io/gh/opensearch-project/opensearch-js/branch/main/graph/badge.svg?token=1qbAgj1DnX)](https://codecov.io/gh/opensearch-project/opensearch-js)
[![Chat](https://img.shields.io/badge/chat-on%20forums-blue)](https://discuss.opendistrocommunity.dev/c/clients/)
![PRs welcome!](https://img.shields.io/badge/PRs-welcome!-success)

![OpenSearch logo](OpenSearch.svg)

OpenSearch Node.js client

- [Welcome!](#welcome)
- [Example use](#example-use)
  - [Setup](#setup)
  - [Sample code](#sample-code)
- [Project Resources](#project-resources)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
- [Copyright](#copyright)

## Welcome!

**[opensearch-js](https://www.npmjs.com/package/@opensearch-project/opensearch)** is [a community-driven, open source fork](https://aws.amazon.com/blogs/opensource/introducing-opensearch/) of elasticsearch-js licensed under the [Apache v2.0 License](LICENSE.txt). For more information, see [opensearch.org](https://opensearch.org/).

## Example use

The OpenSearch JavaScript client provides a safer and easier way to interact with your OpenSearch cluster. Rather than using OpenSearch from the browser and potentially exposing your data to the public, you can build an OpenSearch client that takes care of sending requests to your cluster.

The client contains a library of APIs that let you perform different operations on your cluster and return a standard response body. The example here demonstrates some basic operations like creating an index, adding documents, and searching your data.

### Setup

To add the client to your project, install it with npm:

```bash
npm i @opensearch-project/opensearch
```

If you prefer to add the client manually or just want to examine the source code, see [opensearch-js](https://github.com/opensearch-project/opensearch-js) on GitHub.

Then require the client:

```javascript
const { Client } = require('@opensearch-project/opensearch');
```

### Sample code

```javascript
'use strict';

var host = 'localhost';
var protocol = 'https';
var port = 9200;
var auth = 'admin:admin'; // For testing only. Don't store credentials in code.
var ca_certs_path = '/full/path/to/root-ca.pem';

// Optional client certificates if you don't want to use HTTP basic authentication.
// var client_cert_path = '/full/path/to/client.pem'
// var client_key_path = '/full/path/to/client-key.pem'

// Create a client with SSL/TLS enabled.
var { Client } = require('@opensearch-project/opensearch');
var fs = require('fs');
var client = new Client({
  node: protocol + '://' + auth + '@' + host + ':' + port,
  ssl: {
    ca: fs.readFileSync(ca_certs_path),
    // You can turn off certificate verification (rejectUnauthorized: false) if you're using self-signed certificates with a hostname mismatch.
    // cert: fs.readFileSync(client_cert_path),
    // key: fs.readFileSync(client_key_path)
  },
});

async function search() {
  // Create an index with non-default settings.
  var index_name = 'books';
  var settings = {
    settings: {
      index: {
        number_of_shards: 4,
        number_of_replicas: 3,
      },
    },
  };

  var response = await client.indices.create({
    index: index_name,
    body: settings,
  });

  
  

  // Add a document to the index.
  var document = {
    title: 'The Outsider',
    author: 'Stephen King',
    year: '2018',
    genre: 'Crime fiction',
  };

  var id = '1';

  var response = await client.index({
    id: id,
    index: index_name,
    body: document,
    refresh: true,
  });

  
  

  // Search for the document.
  var query = {
    query: {
      match: {
        title: {
          query: 'The Outsider',
        },
      },
    },
  };

  var response = await client.search({
    index: index_name,
    body: query,
  });

  
  

  // Delete the document.
  var response = await client.delete({
    index: index_name,
    id: id,
  });

  
  

  // Delete the index.
  var response = await client.indices.delete({
    index: index_name,
  });

  
  
}

search().catch(
```

## Project Resources

- [Project Website](https://opensearch.org/)
- [Downloads](https://opensearch.org/downloads.html).
- [Documentation](https://opensearch.org/docs/)
- Need help? Try [Forums](https://discuss.opendistrocommunity.dev/)
- [Project Principles](https://opensearch.org/#principles)
- [Contributing to OpenSearch](CONTRIBUTING.md)
- [Maintainer Responsibilities](MAINTAINERS.md)
- [Release Management](RELEASING.md)
- [Admin Responsibilities](ADMINS.md)
- [Security](SECURITY.md)
- [NPM Page](https://www.npmjs.com/package/@opensearch-project/opensearch)

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## License

This project is licensed under the [Apache v2.0 License](LICENSE.txt).

## Copyright

Copyright OpenSearch Contributors. See [NOTICE](NOTICE.txt) for details.
