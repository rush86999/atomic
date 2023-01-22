/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict';

/* eslint camelcase: 0 */
/* eslint no-unused-vars: 0 */

const { handleError, snakeCaseKeys, normalizeArguments, kConfigurationError } = require('../utils');
const acceptedQuerystring = [
  'format',
  'local',
  'h',
  'help',
  's',
  'v',
  'expand_wildcards',
  'pretty',
  'human',
  'error_trace',
  'source',
  'filter_path',
  'bytes',
  'cluster_manager_timeout',
  'master_timeout',
  'fields',
  'time',
  'ts',
  'health',
  'pri',
  'include_unloaded_segments',
  'allow_no_match',
  'allow_no_datafeeds',
  'allow_no_jobs',
  'from',
  'size',
  'full_id',
  'include_bootstrap',
  'active_only',
  'detailed',
  'index',
  'ignore_unavailable',
  'nodes',
  'actions',
  'parent_task_id',
];
const snakeCase = {
  expandWildcards: 'expand_wildcards',
  errorTrace: 'error_trace',
  filterPath: 'filter_path',
  clusterManagerTimeout: 'cluster_manager_timeout',
  masterTimeout: 'master_timeout',
  includeUnloadedSegments: 'include_unloaded_segments',
  allowNoMatch: 'allow_no_match',
  allowNoDatafeeds: 'allow_no_datafeeds',
  allowNoJobs: 'allow_no_jobs',
  fullId: 'full_id',
  includeBootstrap: 'include_bootstrap',
  activeOnly: 'active_only',
  ignoreUnavailable: 'ignore_unavailable',
  parentTaskId: 'parent_task_id',
};

function CatApi(transport, ConfigurationError) {
  this.transport = transport;
  this[kConfigurationError] = ConfigurationError;
}

CatApi.prototype.aliases = function catAliasesApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, name, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (name != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'aliases' + '/' + encodeURIComponent(name);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'aliases';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.allocation = function catAllocationApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, nodeId, node_id, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if ((node_id || nodeId) != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'allocation' + '/' + encodeURIComponent(node_id || nodeId);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'allocation';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.count = function catCountApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, index, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (index != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'count' + '/' + encodeURIComponent(index);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'count';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.fielddata = function catFielddataApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, fields, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (fields != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'fielddata' + '/' + encodeURIComponent(fields);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'fielddata';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.health = function catHealthApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'health';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.help = function catHelpApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.indices = function catIndicesApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, index, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (index != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'indices' + '/' + encodeURIComponent(index);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'indices';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.cluster_manager = function catClusterManagerApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'cluster_manager';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

/**
 * // TODO: delete CatApi.prototype.master when it is removed from OpenSearch
 * @deprecated use CatApi.prototype.cluster_manager instead
 */
CatApi.prototype.master = function catMasterApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'master';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.nodeattrs = function catNodeattrsApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'nodeattrs';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.nodes = function catNodesApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'nodes';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.pendingTasks = function catPendingTasksApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'pending_tasks';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.plugins = function catPluginsApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'plugins';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.recovery = function catRecoveryApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, index, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (index != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'recovery' + '/' + encodeURIComponent(index);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'recovery';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.repositories = function catRepositoriesApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'repositories';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.segments = function catSegmentsApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, index, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (index != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'segments' + '/' + encodeURIComponent(index);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'segments';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.shards = function catShardsApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, index, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (index != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'shards' + '/' + encodeURIComponent(index);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'shards';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.snapshots = function catSnapshotsApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, repository, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (repository != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'snapshots' + '/' + encodeURIComponent(repository);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'snapshots';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.tasks = function catTasksApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (method == null) method = 'GET';
  path = '/' + '_cat' + '/' + 'tasks';

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.templates = function catTemplatesApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, name, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if (name != null) {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'templates' + '/' + encodeURIComponent(name);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'templates';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

CatApi.prototype.threadPool = function catThreadPoolApi(params, options, callback) {
  [params, options, callback] = normalizeArguments(params, options, callback);

  let { method, body, threadPoolPatterns, thread_pool_patterns, ...querystring } = params;
  querystring = snakeCaseKeys(acceptedQuerystring, snakeCase, querystring);

  let path = '';
  if ((thread_pool_patterns || threadPoolPatterns) != null) {
    if (method == null) method = 'GET';
    path =
      '/' +
      '_cat' +
      '/' +
      'thread_pool' +
      '/' +
      encodeURIComponent(thread_pool_patterns || threadPoolPatterns);
  } else {
    if (method == null) method = 'GET';
    path = '/' + '_cat' + '/' + 'thread_pool';
  }

  // build request object
  const request = {
    method,
    path,
    body: null,
    querystring,
  };

  return this.transport.request(request, options, callback);
};

Object.defineProperties(CatApi.prototype, {
  pending_tasks: {
    get() {
      return this.pendingTasks;
    },
  },
  thread_pool: {
    get() {
      return this.threadPool;
    },
  },
});

module.exports = CatApi;
