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

/// <reference types="node" />

import { ConnectionOptions as TlsConnectionOptions } from 'tls';
import Transport, {
  ApiError,
  ApiResponse,
  RequestEvent,
  TransportRequestParams,
  TransportRequestOptions,
  nodeFilterFn,
  nodeSelectorFn,
  generateRequestIdFn,
  TransportRequestCallback,
  TransportRequestPromise,
  RequestBody,
  RequestNDBody,
  Context,
} from './lib/Transport';
import { URL } from 'url';
import Connection, { AgentOptions, agentFn } from './lib/Connection';
import {
  ConnectionPool,
  BaseConnectionPool,
  CloudConnectionPool,
  ResurrectEvent,
  BasicAuth,
} from './lib/pool';
import Serializer from './lib/Serializer';
import Helpers from './lib/Helpers';
import * as errors from './lib/errors';
import * as opensearchtypes from './api/types';
import * as RequestParams from './api/requestParams';

declare type callbackFn<TResponse, TContext> = (
  err: ApiError,
  result: ApiResponse<TResponse, TContext>
) => void;

// Extend API
interface ClientExtendsCallbackOptions {
  ConfigurationError: errors.ConfigurationError;
  makeRequest(
    params: TransportRequestParams,
    options?: TransportRequestOptions
  ): Promise<void> | void;
  result: {
    body: null;
    statusCode: null;
    headers: null;
    warnings: null;
  };
}
declare type extendsCallback = (options: ClientExtendsCallbackOptions) => any;
// /Extend API

// TODO: delete master role when it is removed from OpenSearch
interface NodeOptions {
  url: URL;
  id?: string;
  agent?: AgentOptions;
  ssl?: TlsConnectionOptions;
  headers?: Record<string, any>;
  roles?: {
    cluster_manager?: boolean
    /**
     * @deprecated use cluster_manager instead
     */
    master?: boolean;
    data: boolean;
    ingest: boolean;
  };
}

interface ClientOptions {
  node?: string | string[] | NodeOptions | NodeOptions[];
  nodes?: string | string[] | NodeOptions | NodeOptions[];
  Connection?: typeof Connection;
  ConnectionPool?: typeof ConnectionPool;
  Transport?: typeof Transport;
  Serializer?: typeof Serializer;
  maxRetries?: number;
  requestTimeout?: number;
  pingTimeout?: number;
  sniffInterval?: number | boolean;
  sniffOnStart?: boolean;
  sniffEndpoint?: string;
  sniffOnConnectionFault?: boolean;
  resurrectStrategy?: 'ping' | 'optimistic' | 'none';
  suggestCompression?: boolean;
  compression?: 'gzip';
  ssl?: TlsConnectionOptions;
  agent?: AgentOptions | agentFn | false;
  nodeFilter?: nodeFilterFn;
  nodeSelector?: nodeSelectorFn | string;
  headers?: Record<string, any>;
  opaqueIdPrefix?: string;
  generateRequestId?: generateRequestIdFn;
  name?: string | symbol;
  auth?: BasicAuth;
  context?: Context;
  proxy?: string | URL;
  enableMetaHeader?: boolean;
  cloud?: {
    id: string;
    // TODO: remove username and password here in 8
    username?: string;
    password?: string;
  };
  disablePrototypePoisoningProtection?: boolean | 'proto' | 'constructor';
  memoryCircuitBreaker?: {
    enabled: boolean;
    maxPercentage: number;
  };
}

declare class Client {
  constructor(opts: ClientOptions);
  connectionPool: ConnectionPool;
  transport: Transport;
  serializer: Serializer;
  extend(method: string, fn: extendsCallback): void;
  extend(method: string, opts: { force: boolean }, fn: extendsCallback): void;
  helpers: Helpers;
  child(opts?: ClientOptions): Client;
  close(callback: Function): void;
  close(): Promise<void>;
  emit(event: string | symbol, ...args: any[]): boolean;
  on(event: 'request', listener: (err: ApiError, meta: RequestEvent) => void): this;
  on(event: 'response', listener: (err: ApiError, meta: RequestEvent) => void): this;
  on(event: 'sniff', listener: (err: ApiError, meta: RequestEvent) => void): this;
  on(event: 'resurrect', listener: (err: null, meta: ResurrectEvent) => void): this;
  once(event: 'request', listener: (err: ApiError, meta: RequestEvent) => void): this;
  once(event: 'response', listener: (err: ApiError, meta: RequestEvent) => void): this;
  once(event: 'sniff', listener: (err: ApiError, meta: RequestEvent) => void): this;
  once(event: 'resurrect', listener: (err: null, meta: ResurrectEvent) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  /* GENERATED */
  bulk<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params?: RequestParams.Bulk<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  bulk<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  bulk<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.Bulk<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  bulk<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.Bulk<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  cat: {
    aliases<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatAliases, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    aliases<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    aliases<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatAliases, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    aliases<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatAliases, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    allocation<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatAllocation, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    allocation<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    allocation<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatAllocation, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    allocation<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatAllocation, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    cluster_manager<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatClusterManager, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    cluster_manager<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    cluster_manager<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatClusterManager, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    cluster_manager<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatClusterManager, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    count<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatCount, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    count<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    count<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatCount, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    count<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatCount, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    fielddata<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatFielddata, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    fielddata<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    fielddata<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatFielddata, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    fielddata<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatFielddata, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    health<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatHealth, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    health<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    health<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatHealth, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    health<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatHealth, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    help<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatHelp, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    help<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    help<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatHelp, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    help<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatHelp, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    indices<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatIndices, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    indices<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    indices<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatIndices, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    indices<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatIndices, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatMaster, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatMaster, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatMaster, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    nodeattrs<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatNodeattrs, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    nodeattrs<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    nodeattrs<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatNodeattrs, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    nodeattrs<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatNodeattrs, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    nodes<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatNodes, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    nodes<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    nodes<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatNodes, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    nodes<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatNodes, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatPendingTasks, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatPendingTasks, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatPendingTasks, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatPendingTasks, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatPendingTasks, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatPendingTasks, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    plugins<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatPlugins, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    plugins<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    plugins<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatPlugins, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    plugins<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatPlugins, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    recovery<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatRecovery, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    recovery<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    recovery<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatRecovery, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    recovery<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatRecovery, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    repositories<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatRepositories, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    repositories<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    repositories<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatRepositories, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    repositories<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatRepositories, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    segments<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatSegments, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    segments<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    segments<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatSegments, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    segments<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatSegments, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    shards<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatShards, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    shards<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    shards<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatShards, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    shards<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatShards, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    snapshots<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatSnapshots, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    snapshots<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    snapshots<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatSnapshots, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    snapshots<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatSnapshots, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    tasks<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatTasks, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    tasks<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    tasks<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatTasks, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    tasks<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatTasks, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    templates<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatTemplates, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    templates<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    templates<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatTemplates, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    templates<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatTemplates, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    thread_pool<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatThreadPool, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    thread_pool<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    thread_pool<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatThreadPool, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    thread_pool<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatThreadPool, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    threadPool<TResponse = Record<string, any>, TContext = Context>(params?: RequestParams.CatThreadPool, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
    threadPool<TResponse = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    threadPool<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatThreadPool, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
    threadPool<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.CatThreadPool, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  }
  clear_scroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(params?: RequestParams.ClearScroll<TRequestBody>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
  clear_scroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  clear_scroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(params: RequestParams.ClearScroll<TRequestBody>, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  clear_scroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(params: RequestParams.ClearScroll<TRequestBody>, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  clearScroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(params?: RequestParams.ClearScroll<TRequestBody>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>>
  clearScroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  clearScroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(params: RequestParams.ClearScroll<TRequestBody>, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  clearScroll<TResponse = Record<string, any>, TRequestBody extends RequestBody = Record<string, any>, TContext = Context>(params: RequestParams.ClearScroll<TRequestBody>, options: TransportRequestOptions, callback: callbackFn<TResponse, TContext>): TransportRequestCallback
  cluster: {
    allocation_explain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterAllocationExplain<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    allocation_explain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    allocation_explain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterAllocationExplain<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    allocation_explain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterAllocationExplain<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    allocationExplain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterAllocationExplain<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    allocationExplain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    allocationExplain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterAllocationExplain<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    allocationExplain<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterAllocationExplain<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_component_template<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterDeleteComponentTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_component_template<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_component_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteComponentTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_component_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteComponentTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterDeleteComponentTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteComponentTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteComponentTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterDeleteVotingConfigExclusions,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteVotingConfigExclusions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteVotingConfigExclusions,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterDeleteVotingConfigExclusions,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteVotingConfigExclusions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterDeleteVotingConfigExclusions,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_component_template<TResponse = boolean, TContext = Context>(
      params?: RequestParams.ClusterExistsComponentTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    exists_component_template<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_component_template<TResponse = boolean, TContext = Context>(
      params: RequestParams.ClusterExistsComponentTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_component_template<TResponse = boolean, TContext = Context>(
      params: RequestParams.ClusterExistsComponentTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsComponentTemplate<TResponse = boolean, TContext = Context>(
      params?: RequestParams.ClusterExistsComponentTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    existsComponentTemplate<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsComponentTemplate<TResponse = boolean, TContext = Context>(
      params: RequestParams.ClusterExistsComponentTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsComponentTemplate<TResponse = boolean, TContext = Context>(
      params: RequestParams.ClusterExistsComponentTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_component_template<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterGetComponentTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_component_template<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_component_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetComponentTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_component_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetComponentTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterGetComponentTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetComponentTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getComponentTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetComponentTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterGetSettings,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetSettings,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetSettings,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterGetSettings,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetSettings,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterGetSettings,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    health<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterHealth,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    health<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    health<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterHealth,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    health<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterHealth,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterPendingTasks,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPendingTasks,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    pending_tasks<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPendingTasks,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterPendingTasks,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPendingTasks,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    pendingTasks<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPendingTasks,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    post_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterPostVotingConfigExclusions,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    post_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    post_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPostVotingConfigExclusions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    post_voting_config_exclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPostVotingConfigExclusions,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    postVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterPostVotingConfigExclusions,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    postVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    postVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPostVotingConfigExclusions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    postVotingConfigExclusions<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterPostVotingConfigExclusions,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_component_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterPutComponentTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_component_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_component_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutComponentTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_component_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutComponentTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putComponentTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterPutComponentTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putComponentTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putComponentTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutComponentTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putComponentTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutComponentTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterPutSettings<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutSettings<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutSettings<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterPutSettings<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutSettings<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterPutSettings<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    remote_info<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterRemoteInfo,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    remote_info<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    remote_info<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterRemoteInfo,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    remote_info<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterRemoteInfo,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    remoteInfo<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterRemoteInfo,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    remoteInfo<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    remoteInfo<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterRemoteInfo,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    remoteInfo<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterRemoteInfo,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reroute<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ClusterReroute<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    reroute<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reroute<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterReroute<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reroute<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ClusterReroute<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    state<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterState,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    state<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    state<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterState,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    state<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterState,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ClusterStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    stats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ClusterStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  count<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Count<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  count<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  count<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Count<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  count<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Count<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  create<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Create<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  create<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  create<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Create<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  create<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Create<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  dangling_indices: {
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesImportDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesImportDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesListDanglingIndices,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesListDanglingIndices,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  danglingIndices: {
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesDeleteDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesImportDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    import_dangling_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesImportDanglingIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesImportDanglingIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesListDanglingIndices,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list_dangling_indices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.DanglingIndicesListDanglingIndices,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.DanglingIndicesListDanglingIndices,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  delete<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.Delete,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  delete<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.Delete,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.Delete,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.DeleteByQuery<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  delete_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  delete_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.DeleteByQuery<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.DeleteByQuery<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.DeleteByQuery<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  deleteByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  deleteByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.DeleteByQuery<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.DeleteByQuery<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.DeleteByQueryRethrottle,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  delete_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteByQueryRethrottle,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteByQueryRethrottle,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.DeleteByQueryRethrottle,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  deleteByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteByQueryRethrottle,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteByQueryRethrottle,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_script<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.DeleteScript,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  delete_script<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_script<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteScript,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  delete_script<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteScript,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteScript<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.DeleteScript,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  deleteScript<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteScript<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteScript,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  deleteScript<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.DeleteScript,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  exists<TResponse = boolean, TContext = Context>(
    params?: RequestParams.Exists,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  exists<TResponse = boolean, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  exists<TResponse = boolean, TContext = Context>(
    params: RequestParams.Exists,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  exists<TResponse = boolean, TContext = Context>(
    params: RequestParams.Exists,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  exists_source<TResponse = boolean, TContext = Context>(
    params?: RequestParams.ExistsSource,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  exists_source<TResponse = boolean, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  exists_source<TResponse = boolean, TContext = Context>(
    params: RequestParams.ExistsSource,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  exists_source<TResponse = boolean, TContext = Context>(
    params: RequestParams.ExistsSource,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  existsSource<TResponse = boolean, TContext = Context>(
    params?: RequestParams.ExistsSource,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  existsSource<TResponse = boolean, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  existsSource<TResponse = boolean, TContext = Context>(
    params: RequestParams.ExistsSource,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  existsSource<TResponse = boolean, TContext = Context>(
    params: RequestParams.ExistsSource,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  explain<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Explain<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  explain<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  explain<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Explain<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  explain<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Explain<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  features: {
    get_features<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.FeaturesGetFeatures,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_features<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_features<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesGetFeatures,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_features<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesGetFeatures,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getFeatures<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.FeaturesGetFeatures,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getFeatures<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getFeatures<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesGetFeatures,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getFeatures<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesGetFeatures,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reset_features<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.FeaturesResetFeatures,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    reset_features<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reset_features<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesResetFeatures,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reset_features<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesResetFeatures,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resetFeatures<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.FeaturesResetFeatures,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    resetFeatures<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resetFeatures<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesResetFeatures,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resetFeatures<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.FeaturesResetFeatures,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  field_caps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.FieldCaps<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  field_caps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  field_caps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.FieldCaps<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  field_caps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.FieldCaps<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  fieldCaps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.FieldCaps<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  fieldCaps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  fieldCaps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.FieldCaps<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  fieldCaps<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.FieldCaps<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.Get,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  get<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.Get,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.Get,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetScript,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  get_script<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScript,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScript,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScript<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetScript,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  getScript<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScript<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScript,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScript<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScript,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script_context<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetScriptContext,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  get_script_context<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script_context<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptContext,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script_context<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptContext,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScriptContext<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetScriptContext,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  getScriptContext<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScriptContext<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptContext,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScriptContext<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptContext,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script_languages<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetScriptLanguages,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  get_script_languages<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script_languages<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptLanguages,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_script_languages<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptLanguages,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScriptLanguages<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetScriptLanguages,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  getScriptLanguages<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScriptLanguages<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptLanguages,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getScriptLanguages<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetScriptLanguages,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_source<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetSource,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  get_source<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_source<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetSource,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  get_source<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetSource,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getSource<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.GetSource,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  getSource<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getSource<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetSource,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  getSource<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.GetSource,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  index<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Index<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  index<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  index<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Index<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  index<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Index<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  indices: {
    add_block<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesAddBlock,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    add_block<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    add_block<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesAddBlock,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    add_block<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesAddBlock,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    addBlock<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesAddBlock,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    addBlock<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    addBlock<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesAddBlock,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    addBlock<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesAddBlock,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    analyze<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesAnalyze<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    analyze<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    analyze<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesAnalyze<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    analyze<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesAnalyze<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clear_cache<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesClearCache,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    clear_cache<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clear_cache<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesClearCache,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clear_cache<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesClearCache,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clearCache<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesClearCache,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    clearCache<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clearCache<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesClearCache,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clearCache<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesClearCache,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesClone<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesClone<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesClone<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    close<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesClose,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    close<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    close<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesClose,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    close<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesClose,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesCreate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesCreate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesCreate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDelete,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDelete,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDelete,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_alias<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDeleteAlias,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_alias<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_alias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteAlias,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_alias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteAlias,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteAlias<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDeleteAlias,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteAlias<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteAlias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteAlias,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteAlias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteAlias,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_index_template<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDeleteIndexTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_index_template<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_index_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteIndexTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_index_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteIndexTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDeleteIndexTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteIndexTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteIndexTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_template<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDeleteTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_template<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteTemplate<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDeleteTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteTemplate<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDeleteTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    disk_usage<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDiskUsage,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    disk_usage<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    disk_usage<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDiskUsage,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    disk_usage<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDiskUsage,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    diskUsage<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesDiskUsage,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    diskUsage<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    diskUsage<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDiskUsage,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    diskUsage<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesDiskUsage,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExists,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    exists<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExists,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExists,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_alias<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExistsAlias,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    exists_alias<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_alias<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsAlias,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_alias<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsAlias,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsAlias<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExistsAlias,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    existsAlias<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsAlias<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsAlias,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsAlias<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsAlias,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_index_template<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExistsIndexTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    exists_index_template<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_index_template<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsIndexTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_index_template<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsIndexTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsIndexTemplate<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExistsIndexTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    existsIndexTemplate<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsIndexTemplate<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsIndexTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsIndexTemplate<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsIndexTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_template<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExistsTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    exists_template<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_template<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    exists_template<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsTemplate<TResponse = boolean, TContext = Context>(
      params?: RequestParams.IndicesExistsTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    existsTemplate<TResponse = boolean, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsTemplate<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    existsTemplate<TResponse = boolean, TContext = Context>(
      params: RequestParams.IndicesExistsTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    field_usage_stats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesFieldUsageStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    field_usage_stats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    field_usage_stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesFieldUsageStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    field_usage_stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesFieldUsageStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    fieldUsageStats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesFieldUsageStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    fieldUsageStats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    fieldUsageStats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesFieldUsageStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    fieldUsageStats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesFieldUsageStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    flush<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesFlush,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    flush<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    flush<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesFlush,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    flush<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesFlush,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    forcemerge<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesForcemerge,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    forcemerge<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    forcemerge<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesForcemerge,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    forcemerge<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesForcemerge,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGet,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGet,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGet,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_alias<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetAlias,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_alias<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_alias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetAlias,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_alias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetAlias,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getAlias<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetAlias,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getAlias<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getAlias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetAlias,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getAlias<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetAlias,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_field_mapping<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetFieldMapping,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_field_mapping<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_field_mapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetFieldMapping,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_field_mapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetFieldMapping,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getFieldMapping<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetFieldMapping,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getFieldMapping<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getFieldMapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetFieldMapping,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getFieldMapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetFieldMapping,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_index_template<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetIndexTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_index_template<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_index_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetIndexTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_index_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetIndexTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetIndexTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetIndexTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getIndexTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetIndexTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_mapping<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetMapping,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_mapping<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_mapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetMapping,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_mapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetMapping,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getMapping<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetMapping,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getMapping<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getMapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetMapping,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getMapping<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetMapping,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetSettings,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetSettings,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_settings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetSettings,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetSettings,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetSettings,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetSettings,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_template<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_template<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_template<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getTemplate<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetTemplate,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getTemplate<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetTemplate,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getTemplate<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetTemplate,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_upgrade<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetUpgrade,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_upgrade<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_upgrade<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetUpgrade,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_upgrade<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetUpgrade,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getUpgrade<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesGetUpgrade,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getUpgrade<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getUpgrade<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetUpgrade,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getUpgrade<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesGetUpgrade,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    open<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesOpen,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    open<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    open<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesOpen,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    open<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesOpen,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_alias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutAlias<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_alias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_alias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutAlias<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_alias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutAlias<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putAlias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutAlias<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putAlias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putAlias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutAlias<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putAlias<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutAlias<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutIndexTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutIndexTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutIndexTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutIndexTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutIndexTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutIndexTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_mapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutMapping<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_mapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_mapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutMapping<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_mapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutMapping<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putMapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutMapping<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putMapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putMapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutMapping<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putMapping<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutMapping<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutSettings<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutSettings<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutSettings<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutSettings<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutSettings<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutSettings<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesPutTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesPutTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    recovery<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesRecovery,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    recovery<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    recovery<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesRecovery,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    recovery<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesRecovery,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    refresh<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesRefresh,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    refresh<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    refresh<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesRefresh,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    refresh<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesRefresh,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resolve_index<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesResolveIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    resolve_index<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resolve_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesResolveIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resolve_index<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesResolveIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resolveIndex<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesResolveIndex,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    resolveIndex<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resolveIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesResolveIndex,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    resolveIndex<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesResolveIndex,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    rollover<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesRollover<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    rollover<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    rollover<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesRollover<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    rollover<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesRollover<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    segments<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesSegments,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    segments<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    segments<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesSegments,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    segments<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesSegments,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shard_stores<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesShardStores,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    shard_stores<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shard_stores<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesShardStores,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shard_stores<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesShardStores,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shardStores<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesShardStores,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    shardStores<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shardStores<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesShardStores,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shardStores<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesShardStores,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shrink<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesShrink<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    shrink<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shrink<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesShrink<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    shrink<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesShrink<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesSimulateIndexTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    simulate_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateIndexTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate_index_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateIndexTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulateIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesSimulateIndexTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    simulateIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulateIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateIndexTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulateIndexTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateIndexTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesSimulateTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    simulate_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate_template<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulateTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesSimulateTemplate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    simulateTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulateTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateTemplate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulateTemplate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSimulateTemplate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    split<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesSplit<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    split<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    split<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSplit<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    split<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesSplit<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    stats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    update_aliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesUpdateAliases<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    update_aliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    update_aliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesUpdateAliases<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    update_aliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesUpdateAliases<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    updateAliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesUpdateAliases<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    updateAliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    updateAliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesUpdateAliases<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    updateAliases<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesUpdateAliases<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    upgrade<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IndicesUpgrade,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    upgrade<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    upgrade<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesUpgrade,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    upgrade<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IndicesUpgrade,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    validate_query<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesValidateQuery<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    validate_query<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    validate_query<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesValidateQuery<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    validate_query<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesValidateQuery<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    validateQuery<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IndicesValidateQuery<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    validateQuery<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    validateQuery<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesValidateQuery<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    validateQuery<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IndicesValidateQuery<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  info<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.Info,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  info<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  info<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.Info,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  info<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.Info,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  ingest: {
    delete_pipeline<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestDeletePipeline,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_pipeline<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_pipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestDeletePipeline,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_pipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestDeletePipeline,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deletePipeline<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestDeletePipeline,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deletePipeline<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deletePipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestDeletePipeline,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deletePipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestDeletePipeline,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    geo_ip_stats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestGeoIpStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    geo_ip_stats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    geo_ip_stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGeoIpStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    geo_ip_stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGeoIpStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    geoIpStats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestGeoIpStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    geoIpStats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    geoIpStats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGeoIpStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    geoIpStats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGeoIpStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_pipeline<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestGetPipeline,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_pipeline<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_pipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGetPipeline,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_pipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGetPipeline,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getPipeline<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestGetPipeline,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getPipeline<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getPipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGetPipeline,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getPipeline<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestGetPipeline,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    processor_grok<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestProcessorGrok,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    processor_grok<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    processor_grok<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestProcessorGrok,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    processor_grok<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestProcessorGrok,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    processorGrok<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.IngestProcessorGrok,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    processorGrok<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    processorGrok<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestProcessorGrok,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    processorGrok<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.IngestProcessorGrok,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_pipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IngestPutPipeline<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_pipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_pipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IngestPutPipeline<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_pipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IngestPutPipeline<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putPipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IngestPutPipeline<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putPipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putPipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IngestPutPipeline<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putPipeline<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IngestPutPipeline<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.IngestSimulate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    simulate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IngestSimulate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    simulate<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.IngestSimulate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  mget<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Mget<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  mget<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  mget<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Mget<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  mget<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Mget<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  msearch<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params?: RequestParams.Msearch<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  msearch<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  msearch<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.Msearch<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  msearch<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.Msearch<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  msearch_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params?: RequestParams.MsearchTemplate<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  msearch_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  msearch_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.MsearchTemplate<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  msearch_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.MsearchTemplate<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  msearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params?: RequestParams.MsearchTemplate<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  msearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  msearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.MsearchTemplate<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  msearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestNDBody = Record<string, any>[],
    TContext = Context
  >(
    params: RequestParams.MsearchTemplate<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  mtermvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Mtermvectors<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  mtermvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  mtermvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Mtermvectors<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  mtermvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Mtermvectors<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  nodes: {
    clear_metering_archive<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesClearMeteringArchive,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    clear_metering_archive<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clear_metering_archive<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesClearMeteringArchive,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clear_metering_archive<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesClearMeteringArchive,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clearMeteringArchive<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesClearMeteringArchive,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    clearMeteringArchive<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clearMeteringArchive<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesClearMeteringArchive,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clearMeteringArchive<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesClearMeteringArchive,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_metering_info<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesGetMeteringInfo,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_metering_info<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_metering_info<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesGetMeteringInfo,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_metering_info<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesGetMeteringInfo,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getMeteringInfo<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesGetMeteringInfo,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getMeteringInfo<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getMeteringInfo<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesGetMeteringInfo,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getMeteringInfo<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesGetMeteringInfo,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    hot_threads<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesHotThreads,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    hot_threads<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    hot_threads<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesHotThreads,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    hot_threads<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesHotThreads,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    hotThreads<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesHotThreads,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    hotThreads<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    hotThreads<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesHotThreads,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    hotThreads<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesHotThreads,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    info<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesInfo,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    info<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    info<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesInfo,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    info<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesInfo,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reload_secure_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.NodesReloadSecureSettings<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    reload_secure_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reload_secure_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.NodesReloadSecureSettings<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reload_secure_settings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.NodesReloadSecureSettings<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reloadSecureSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.NodesReloadSecureSettings<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    reloadSecureSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reloadSecureSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.NodesReloadSecureSettings<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    reloadSecureSettings<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.NodesReloadSecureSettings<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesStats,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    stats<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesStats,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    stats<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesStats,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    usage<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.NodesUsage,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    usage<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    usage<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesUsage,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    usage<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.NodesUsage,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  ping<TResponse = boolean, TContext = Context>(
    params?: RequestParams.Ping,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  ping<TResponse = boolean, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  ping<TResponse = boolean, TContext = Context>(
    params: RequestParams.Ping,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  ping<TResponse = boolean, TContext = Context>(
    params: RequestParams.Ping,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  put_script<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.PutScript<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  put_script<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  put_script<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.PutScript<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  put_script<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.PutScript<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  putScript<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.PutScript<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  putScript<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  putScript<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.PutScript<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  putScript<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.PutScript<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  rank_eval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.RankEval<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  rank_eval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  rank_eval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RankEval<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  rank_eval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RankEval<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  rankEval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.RankEval<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  rankEval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  rankEval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RankEval<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  rankEval<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RankEval<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindex<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Reindex<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  reindex<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  reindex<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Reindex<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindex<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Reindex<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindex_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.ReindexRethrottle,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  reindex_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindex_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.ReindexRethrottle,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindex_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.ReindexRethrottle,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindexRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.ReindexRethrottle,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  reindexRethrottle<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindexRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.ReindexRethrottle,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  reindexRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.ReindexRethrottle,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  render_search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.RenderSearchTemplate<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  render_search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  render_search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RenderSearchTemplate<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  render_search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RenderSearchTemplate<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  renderSearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.RenderSearchTemplate<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  renderSearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  renderSearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RenderSearchTemplate<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  renderSearchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.RenderSearchTemplate<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  scripts_painless_execute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.ScriptsPainlessExecute<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  scripts_painless_execute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  scripts_painless_execute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.ScriptsPainlessExecute<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  scripts_painless_execute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.ScriptsPainlessExecute<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  scriptsPainlessExecute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.ScriptsPainlessExecute<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  scriptsPainlessExecute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  scriptsPainlessExecute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.ScriptsPainlessExecute<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  scriptsPainlessExecute<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.ScriptsPainlessExecute<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  scroll<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Scroll<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  scroll<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  scroll<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Scroll<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  scroll<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Scroll<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Search<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  search<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  search<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Search<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Search<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search_shards<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.SearchShards,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  search_shards<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search_shards<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.SearchShards,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search_shards<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.SearchShards,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  searchShards<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.SearchShards,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  searchShards<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  searchShards<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.SearchShards,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  searchShards<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.SearchShards,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.SearchTemplate<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.SearchTemplate<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  search_template<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.SearchTemplate<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  searchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.SearchTemplate<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  searchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  searchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.SearchTemplate<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  searchTemplate<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.SearchTemplate<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  shutdown: {
    delete_node<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ShutdownDeleteNode,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_node<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_node<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownDeleteNode,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_node<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownDeleteNode,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteNode<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ShutdownDeleteNode,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteNode<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteNode<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownDeleteNode,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteNode<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownDeleteNode,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_node<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ShutdownGetNode,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_node<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_node<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownGetNode,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_node<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownGetNode,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getNode<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.ShutdownGetNode,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getNode<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getNode<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownGetNode,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getNode<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.ShutdownGetNode,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_node<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ShutdownPutNode<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    put_node<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_node<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ShutdownPutNode<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    put_node<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ShutdownPutNode<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putNode<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.ShutdownPutNode<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    putNode<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putNode<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ShutdownPutNode<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    putNode<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.ShutdownPutNode<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  snapshot: {
    // custom for now
    // list<TResponse = Record<string, any>, TContext = Context>(
    //   params?: any,
    //   options?: TransportRequestOptions
    // ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    cleanup_repository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotCleanupRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    cleanup_repository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cleanup_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotCleanupRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cleanup_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotCleanupRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cleanupRepository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotCleanupRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    cleanupRepository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cleanupRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotCleanupRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cleanupRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotCleanupRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.SnapshotClone<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotClone<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    clone<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotClone<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.SnapshotCreate<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotCreate<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotCreate<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create_repository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.SnapshotCreateRepository<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    create_repository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create_repository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotCreateRepository<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    create_repository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotCreateRepository<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    createRepository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.SnapshotCreateRepository<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    createRepository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    createRepository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotCreateRepository<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    createRepository<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotCreateRepository<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotDelete,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotDelete,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotDelete,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_repository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotDeleteRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete_repository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotDeleteRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    delete_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotDeleteRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteRepository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotDeleteRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    deleteRepository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotDeleteRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    deleteRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotDeleteRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotGet,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotGet,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotGet,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_repository_snapshots<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotGetRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_repository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotGetRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get_repository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotGetRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotGetRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getRepository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotGetRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    getRepository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotGetRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    getRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotGetRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    repository_analyze<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotRepositoryAnalyze,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    repository_analyze<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    repository_analyze<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotRepositoryAnalyze,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    repository_analyze<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotRepositoryAnalyze,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    repositoryAnalyze<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotRepositoryAnalyze,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    repositoryAnalyze<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    repositoryAnalyze<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotRepositoryAnalyze,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    repositoryAnalyze<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotRepositoryAnalyze,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    restore<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params?: RequestParams.SnapshotRestore<TRequestBody>,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    restore<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    restore<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotRestore<TRequestBody>,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    restore<
      TResponse = Record<string, any>,
      TRequestBody extends RequestBody = Record<string, any>,
      TContext = Context
    >(
      params: RequestParams.SnapshotRestore<TRequestBody>,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    status<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotStatus,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    status<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    status<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotStatus,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    status<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotStatus,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    verify_repository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotVerifyRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    verify_repository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    verify_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotVerifyRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    verify_repository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotVerifyRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    verifyRepository<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.SnapshotVerifyRepository,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    verifyRepository<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    verifyRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotVerifyRepository,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    verifyRepository<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.SnapshotVerifyRepository,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  tasks: {
    cancel<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.TasksCancel,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    cancel<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cancel<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.TasksCancel,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    cancel<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.TasksCancel,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.TasksGet,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    get<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.TasksGet,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    get<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.TasksGet,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list<TResponse = Record<string, any>, TContext = Context>(
      params?: RequestParams.TasksList,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    list<TResponse = Record<string, any>, TContext = Context>(
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.TasksList,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
    list<TResponse = Record<string, any>, TContext = Context>(
      params: RequestParams.TasksList,
      options: TransportRequestOptions,
      callback: callbackFn<TResponse, TContext>
    ): TransportRequestCallback;
  };
  terms_enum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.TermsEnum<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  terms_enum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  terms_enum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.TermsEnum<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  terms_enum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.TermsEnum<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  termsEnum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.TermsEnum<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  termsEnum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  termsEnum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.TermsEnum<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  termsEnum<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.TermsEnum<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  termvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Termvectors<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  termvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  termvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Termvectors<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  termvectors<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Termvectors<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.Update<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  update<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  update<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Update<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.Update<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.UpdateByQuery<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  update_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  update_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.UpdateByQuery<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update_by_query<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.UpdateByQuery<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  updateByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params?: RequestParams.UpdateByQuery<TRequestBody>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  updateByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(callback: callbackFn<TResponse, TContext>): TransportRequestCallback;
  updateByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.UpdateByQuery<TRequestBody>,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  updateByQuery<
    TResponse = Record<string, any>,
    TRequestBody extends RequestBody = Record<string, any>,
    TContext = Context
  >(
    params: RequestParams.UpdateByQuery<TRequestBody>,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.UpdateByQueryRethrottle,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  update_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.UpdateByQueryRethrottle,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  update_by_query_rethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.UpdateByQueryRethrottle,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  updateByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params?: RequestParams.UpdateByQueryRethrottle,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
  updateByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  updateByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.UpdateByQueryRethrottle,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  updateByQueryRethrottle<TResponse = Record<string, any>, TContext = Context>(
    params: RequestParams.UpdateByQueryRethrottle,
    options: TransportRequestOptions,
    callback: callbackFn<TResponse, TContext>
  ): TransportRequestCallback;
  /* /GENERATED */
}

declare const events: {
  SERIALIZATION: string;
  REQUEST: string;
  DESERIALIZATION: string;
  RESPONSE: string;
  SNIFF: string;
  RESURRECT: string;
};

export {
  Client,
  Transport,
  ConnectionPool,
  BaseConnectionPool,
  CloudConnectionPool,
  Connection,
  Serializer,
  events,
  errors,
  ApiError,
  ApiResponse,
  RequestEvent,
  ResurrectEvent,
  opensearchtypes,
  RequestParams,
  ClientOptions,
  NodeOptions,
  ClientExtendsCallbackOptions,
};
