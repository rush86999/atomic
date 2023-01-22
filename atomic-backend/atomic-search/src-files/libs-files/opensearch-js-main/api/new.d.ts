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

import {
  ClientOptions,
  ConnectionPool,
  BaseConnectionPool,
  CloudConnectionPool,
  Connection,
  Serializer,
  Transport,
  errors,
  RequestEvent,
  ResurrectEvent,
  ApiError,
  NodeOptions,
  events,
} from '../index';
import Helpers from '../lib/Helpers';
import {
  ApiResponse,
  TransportRequestCallback,
  TransportRequestPromise,
  TransportRequestParams,
  TransportRequestOptions,
} from '../lib/Transport';
import * as T from './types';

/**
 * We are still working on this type, it will arrive soon.
 * If it's critical for you, please open an issue.
 * https://github.com/opensearch-project/opensearch-js
 */
type TODO = Record<string, any>;

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

declare type callbackFn<TResponse, TContext> = (
  err: ApiError,
  result: ApiResponse<TResponse, TContext>
) => void;
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
  bulk<TSource = unknown, TContext = unknown>(
    params: T.BulkRequest<TSource>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.BulkResponse, TContext>>;
  bulk<TSource = unknown, TContext = unknown>(
    params: T.BulkRequest<TSource>,
    callback: callbackFn<T.BulkResponse, TContext>
  ): TransportRequestCallback;
  bulk<TSource = unknown, TContext = unknown>(
    params: T.BulkRequest<TSource>,
    options: TransportRequestOptions,
    callback: callbackFn<T.BulkResponse, TContext>
  ): TransportRequestCallback;
  cat: {
    aliases<TContext = unknown>(params?: T.CatAliasesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatAliasesResponse, TContext>>
    aliases<TContext = unknown>(callback: callbackFn<T.CatAliasesResponse, TContext>): TransportRequestCallback
    aliases<TContext = unknown>(params: T.CatAliasesRequest, callback: callbackFn<T.CatAliasesResponse, TContext>): TransportRequestCallback
    aliases<TContext = unknown>(params: T.CatAliasesRequest, options: TransportRequestOptions, callback: callbackFn<T.CatAliasesResponse, TContext>): TransportRequestCallback
    allocation<TContext = unknown>(params?: T.CatAllocationRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatAllocationResponse, TContext>>
    allocation<TContext = unknown>(callback: callbackFn<T.CatAllocationResponse, TContext>): TransportRequestCallback
    allocation<TContext = unknown>(params: T.CatAllocationRequest, callback: callbackFn<T.CatAllocationResponse, TContext>): TransportRequestCallback
    allocation<TContext = unknown>(params: T.CatAllocationRequest, options: TransportRequestOptions, callback: callbackFn<T.CatAllocationResponse, TContext>): TransportRequestCallback
    cluster_manager<TContext = unknown>(params?: T.CatClusterManagerRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatClusterManagerResponse, TContext>>
    cluster_manager<TContext = unknown>(callback: callbackFn<T.CatClusterManagerResponse, TContext>): TransportRequestCallback
    cluster_manager<TContext = unknown>(params: T.CatClusterManagerRequest, callback: callbackFn<T.CatClusterManagerResponse, TContext>): TransportRequestCallback
    cluster_manager<TContext = unknown>(params: T.CatClusterManagerRequest, options: TransportRequestOptions, callback: callbackFn<T.CatClusterManagerResponse, TContext>): TransportRequestCallback
    count<TContext = unknown>(params?: T.CatCountRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatCountResponse, TContext>>
    count<TContext = unknown>(callback: callbackFn<T.CatCountResponse, TContext>): TransportRequestCallback
    count<TContext = unknown>(params: T.CatCountRequest, callback: callbackFn<T.CatCountResponse, TContext>): TransportRequestCallback
    count<TContext = unknown>(params: T.CatCountRequest, options: TransportRequestOptions, callback: callbackFn<T.CatCountResponse, TContext>): TransportRequestCallback
    fielddata<TContext = unknown>(params?: T.CatFielddataRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatFielddataResponse, TContext>>
    fielddata<TContext = unknown>(callback: callbackFn<T.CatFielddataResponse, TContext>): TransportRequestCallback
    fielddata<TContext = unknown>(params: T.CatFielddataRequest, callback: callbackFn<T.CatFielddataResponse, TContext>): TransportRequestCallback
    fielddata<TContext = unknown>(params: T.CatFielddataRequest, options: TransportRequestOptions, callback: callbackFn<T.CatFielddataResponse, TContext>): TransportRequestCallback
    health<TContext = unknown>(params?: T.CatHealthRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatHealthResponse, TContext>>
    health<TContext = unknown>(callback: callbackFn<T.CatHealthResponse, TContext>): TransportRequestCallback
    health<TContext = unknown>(params: T.CatHealthRequest, callback: callbackFn<T.CatHealthResponse, TContext>): TransportRequestCallback
    health<TContext = unknown>(params: T.CatHealthRequest, options: TransportRequestOptions, callback: callbackFn<T.CatHealthResponse, TContext>): TransportRequestCallback
    help<TContext = unknown>(params?: T.CatHelpRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatHelpResponse, TContext>>
    help<TContext = unknown>(callback: callbackFn<T.CatHelpResponse, TContext>): TransportRequestCallback
    help<TContext = unknown>(params: T.CatHelpRequest, callback: callbackFn<T.CatHelpResponse, TContext>): TransportRequestCallback
    help<TContext = unknown>(params: T.CatHelpRequest, options: TransportRequestOptions, callback: callbackFn<T.CatHelpResponse, TContext>): TransportRequestCallback
    indices<TContext = unknown>(params?: T.CatIndicesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatIndicesResponse, TContext>>
    indices<TContext = unknown>(callback: callbackFn<T.CatIndicesResponse, TContext>): TransportRequestCallback
    indices<TContext = unknown>(params: T.CatIndicesRequest, callback: callbackFn<T.CatIndicesResponse, TContext>): TransportRequestCallback
    indices<TContext = unknown>(params: T.CatIndicesRequest, options: TransportRequestOptions, callback: callbackFn<T.CatIndicesResponse, TContext>): TransportRequestCallback
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TContext = unknown>(params?: T.CatMasterRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatMasterResponse, TContext>>
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TContext = unknown>(callback: callbackFn<T.CatMasterResponse, TContext>): TransportRequestCallback
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TContext = unknown>(params: T.CatMasterRequest, callback: callbackFn<T.CatMasterResponse, TContext>): TransportRequestCallback
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TContext = unknown>(params: T.CatMasterRequest, options: TransportRequestOptions, callback: callbackFn<T.CatMasterResponse, TContext>): TransportRequestCallback
    nodeattrs<TContext = unknown>(params?: T.CatNodeAttributesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatNodeAttributesResponse, TContext>>
    nodeattrs<TContext = unknown>(callback: callbackFn<T.CatNodeAttributesResponse, TContext>): TransportRequestCallback
    nodeattrs<TContext = unknown>(params: T.CatNodeAttributesRequest, callback: callbackFn<T.CatNodeAttributesResponse, TContext>): TransportRequestCallback
    nodeattrs<TContext = unknown>(params: T.CatNodeAttributesRequest, options: TransportRequestOptions, callback: callbackFn<T.CatNodeAttributesResponse, TContext>): TransportRequestCallback
    nodes<TContext = unknown>(params?: T.CatNodesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatNodesResponse, TContext>>
    nodes<TContext = unknown>(callback: callbackFn<T.CatNodesResponse, TContext>): TransportRequestCallback
    nodes<TContext = unknown>(params: T.CatNodesRequest, callback: callbackFn<T.CatNodesResponse, TContext>): TransportRequestCallback
    nodes<TContext = unknown>(params: T.CatNodesRequest, options: TransportRequestOptions, callback: callbackFn<T.CatNodesResponse, TContext>): TransportRequestCallback
    pendingTasks<TContext = unknown>(params?: T.CatPendingTasksRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatPendingTasksResponse, TContext>>
    pendingTasks<TContext = unknown>(callback: callbackFn<T.CatPendingTasksResponse, TContext>): TransportRequestCallback
    pendingTasks<TContext = unknown>(params: T.CatPendingTasksRequest, callback: callbackFn<T.CatPendingTasksResponse, TContext>): TransportRequestCallback
    pendingTasks<TContext = unknown>(params: T.CatPendingTasksRequest, options: TransportRequestOptions, callback: callbackFn<T.CatPendingTasksResponse, TContext>): TransportRequestCallback
    plugins<TContext = unknown>(params?: T.CatPluginsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatPluginsResponse, TContext>>
    plugins<TContext = unknown>(callback: callbackFn<T.CatPluginsResponse, TContext>): TransportRequestCallback
    plugins<TContext = unknown>(params: T.CatPluginsRequest, callback: callbackFn<T.CatPluginsResponse, TContext>): TransportRequestCallback
    plugins<TContext = unknown>(params: T.CatPluginsRequest, options: TransportRequestOptions, callback: callbackFn<T.CatPluginsResponse, TContext>): TransportRequestCallback
    recovery<TContext = unknown>(params?: T.CatRecoveryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatRecoveryResponse, TContext>>
    recovery<TContext = unknown>(callback: callbackFn<T.CatRecoveryResponse, TContext>): TransportRequestCallback
    recovery<TContext = unknown>(params: T.CatRecoveryRequest, callback: callbackFn<T.CatRecoveryResponse, TContext>): TransportRequestCallback
    recovery<TContext = unknown>(params: T.CatRecoveryRequest, options: TransportRequestOptions, callback: callbackFn<T.CatRecoveryResponse, TContext>): TransportRequestCallback
    repositories<TContext = unknown>(params?: T.CatRepositoriesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatRepositoriesResponse, TContext>>
    repositories<TContext = unknown>(callback: callbackFn<T.CatRepositoriesResponse, TContext>): TransportRequestCallback
    repositories<TContext = unknown>(params: T.CatRepositoriesRequest, callback: callbackFn<T.CatRepositoriesResponse, TContext>): TransportRequestCallback
    repositories<TContext = unknown>(params: T.CatRepositoriesRequest, options: TransportRequestOptions, callback: callbackFn<T.CatRepositoriesResponse, TContext>): TransportRequestCallback
    segments<TContext = unknown>(params?: T.CatSegmentsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatSegmentsResponse, TContext>>
    segments<TContext = unknown>(callback: callbackFn<T.CatSegmentsResponse, TContext>): TransportRequestCallback
    segments<TContext = unknown>(params: T.CatSegmentsRequest, callback: callbackFn<T.CatSegmentsResponse, TContext>): TransportRequestCallback
    segments<TContext = unknown>(params: T.CatSegmentsRequest, options: TransportRequestOptions, callback: callbackFn<T.CatSegmentsResponse, TContext>): TransportRequestCallback
    shards<TContext = unknown>(params?: T.CatShardsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatShardsResponse, TContext>>
    shards<TContext = unknown>(callback: callbackFn<T.CatShardsResponse, TContext>): TransportRequestCallback
    shards<TContext = unknown>(params: T.CatShardsRequest, callback: callbackFn<T.CatShardsResponse, TContext>): TransportRequestCallback
    shards<TContext = unknown>(params: T.CatShardsRequest, options: TransportRequestOptions, callback: callbackFn<T.CatShardsResponse, TContext>): TransportRequestCallback
    snapshots<TContext = unknown>(params?: T.CatSnapshotsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatSnapshotsResponse, TContext>>
    snapshots<TContext = unknown>(callback: callbackFn<T.CatSnapshotsResponse, TContext>): TransportRequestCallback
    snapshots<TContext = unknown>(params: T.CatSnapshotsRequest, callback: callbackFn<T.CatSnapshotsResponse, TContext>): TransportRequestCallback
    snapshots<TContext = unknown>(params: T.CatSnapshotsRequest, options: TransportRequestOptions, callback: callbackFn<T.CatSnapshotsResponse, TContext>): TransportRequestCallback
    tasks<TContext = unknown>(params?: T.CatTasksRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatTasksResponse, TContext>>
    tasks<TContext = unknown>(callback: callbackFn<T.CatTasksResponse, TContext>): TransportRequestCallback
    tasks<TContext = unknown>(params: T.CatTasksRequest, callback: callbackFn<T.CatTasksResponse, TContext>): TransportRequestCallback
    tasks<TContext = unknown>(params: T.CatTasksRequest, options: TransportRequestOptions, callback: callbackFn<T.CatTasksResponse, TContext>): TransportRequestCallback
    templates<TContext = unknown>(params?: T.CatTemplatesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatTemplatesResponse, TContext>>
    templates<TContext = unknown>(callback: callbackFn<T.CatTemplatesResponse, TContext>): TransportRequestCallback
    templates<TContext = unknown>(params: T.CatTemplatesRequest, callback: callbackFn<T.CatTemplatesResponse, TContext>): TransportRequestCallback
    templates<TContext = unknown>(params: T.CatTemplatesRequest, options: TransportRequestOptions, callback: callbackFn<T.CatTemplatesResponse, TContext>): TransportRequestCallback
    threadPool<TContext = unknown>(params?: T.CatThreadPoolRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatThreadPoolResponse, TContext>>
    threadPool<TContext = unknown>(callback: callbackFn<T.CatThreadPoolResponse, TContext>): TransportRequestCallback
    threadPool<TContext = unknown>(params: T.CatThreadPoolRequest, callback: callbackFn<T.CatThreadPoolResponse, TContext>): TransportRequestCallback
    threadPool<TContext = unknown>(params: T.CatThreadPoolRequest, options: TransportRequestOptions, callback: callbackFn<T.CatThreadPoolResponse, TContext>): TransportRequestCallback
  }
  clearScroll<TContext = unknown>(params?: T.ClearScrollRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClearScrollResponse, TContext>>
  clearScroll<TContext = unknown>(callback: callbackFn<T.ClearScrollResponse, TContext>): TransportRequestCallback
  clearScroll<TContext = unknown>(params: T.ClearScrollRequest, callback: callbackFn<T.ClearScrollResponse, TContext>): TransportRequestCallback
  clearScroll<TContext = unknown>(params: T.ClearScrollRequest, options: TransportRequestOptions, callback: callbackFn<T.ClearScrollResponse, TContext>): TransportRequestCallback
  cluster: {
    allocationExplain<TContext = unknown>(
      params?: T.ClusterAllocationExplainRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterAllocationExplainResponse, TContext>>;
    allocationExplain<TContext = unknown>(
      callback: callbackFn<T.ClusterAllocationExplainResponse, TContext>
    ): TransportRequestCallback;
    allocationExplain<TContext = unknown>(
      params: T.ClusterAllocationExplainRequest,
      callback: callbackFn<T.ClusterAllocationExplainResponse, TContext>
    ): TransportRequestCallback;
    allocationExplain<TContext = unknown>(
      params: T.ClusterAllocationExplainRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterAllocationExplainResponse, TContext>
    ): TransportRequestCallback;
    deleteComponentTemplate<TContext = unknown>(
      params: T.ClusterDeleteComponentTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterDeleteComponentTemplateResponse, TContext>>;
    deleteComponentTemplate<TContext = unknown>(
      params: T.ClusterDeleteComponentTemplateRequest,
      callback: callbackFn<T.ClusterDeleteComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    deleteComponentTemplate<TContext = unknown>(
      params: T.ClusterDeleteComponentTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterDeleteComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    deleteVotingConfigExclusions<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    deleteVotingConfigExclusions<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    deleteVotingConfigExclusions<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    deleteVotingConfigExclusions<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    existsComponentTemplate<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    existsComponentTemplate<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    existsComponentTemplate<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    existsComponentTemplate<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getComponentTemplate<TContext = unknown>(
      params?: T.ClusterGetComponentTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterGetComponentTemplateResponse, TContext>>;
    getComponentTemplate<TContext = unknown>(
      callback: callbackFn<T.ClusterGetComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    getComponentTemplate<TContext = unknown>(
      params: T.ClusterGetComponentTemplateRequest,
      callback: callbackFn<T.ClusterGetComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    getComponentTemplate<TContext = unknown>(
      params: T.ClusterGetComponentTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterGetComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TContext = unknown>(
      params?: T.ClusterGetSettingsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterGetSettingsResponse, TContext>>;
    getSettings<TContext = unknown>(
      callback: callbackFn<T.ClusterGetSettingsResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TContext = unknown>(
      params: T.ClusterGetSettingsRequest,
      callback: callbackFn<T.ClusterGetSettingsResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TContext = unknown>(
      params: T.ClusterGetSettingsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterGetSettingsResponse, TContext>
    ): TransportRequestCallback;
    health<TContext = unknown>(
      params?: T.ClusterHealthRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterHealthResponse, TContext>>;
    health<TContext = unknown>(
      callback: callbackFn<T.ClusterHealthResponse, TContext>
    ): TransportRequestCallback;
    health<TContext = unknown>(
      params: T.ClusterHealthRequest,
      callback: callbackFn<T.ClusterHealthResponse, TContext>
    ): TransportRequestCallback;
    health<TContext = unknown>(
      params: T.ClusterHealthRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterHealthResponse, TContext>
    ): TransportRequestCallback;
    pendingTasks<TContext = unknown>(
      params?: T.ClusterPendingTasksRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterPendingTasksResponse, TContext>>;
    pendingTasks<TContext = unknown>(
      callback: callbackFn<T.ClusterPendingTasksResponse, TContext>
    ): TransportRequestCallback;
    pendingTasks<TContext = unknown>(
      params: T.ClusterPendingTasksRequest,
      callback: callbackFn<T.ClusterPendingTasksResponse, TContext>
    ): TransportRequestCallback;
    pendingTasks<TContext = unknown>(
      params: T.ClusterPendingTasksRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterPendingTasksResponse, TContext>
    ): TransportRequestCallback;
    postVotingConfigExclusions<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    postVotingConfigExclusions<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    postVotingConfigExclusions<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    postVotingConfigExclusions<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    putComponentTemplate<TContext = unknown>(
      params: T.ClusterPutComponentTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterPutComponentTemplateResponse, TContext>>;
    putComponentTemplate<TContext = unknown>(
      params: T.ClusterPutComponentTemplateRequest,
      callback: callbackFn<T.ClusterPutComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    putComponentTemplate<TContext = unknown>(
      params: T.ClusterPutComponentTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterPutComponentTemplateResponse, TContext>
    ): TransportRequestCallback;
    putSettings<TContext = unknown>(
      params?: T.ClusterPutSettingsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterPutSettingsResponse, TContext>>;
    putSettings<TContext = unknown>(
      callback: callbackFn<T.ClusterPutSettingsResponse, TContext>
    ): TransportRequestCallback;
    putSettings<TContext = unknown>(
      params: T.ClusterPutSettingsRequest,
      callback: callbackFn<T.ClusterPutSettingsResponse, TContext>
    ): TransportRequestCallback;
    putSettings<TContext = unknown>(
      params: T.ClusterPutSettingsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterPutSettingsResponse, TContext>
    ): TransportRequestCallback;
    remoteInfo<TContext = unknown>(
      params?: T.ClusterRemoteInfoRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterRemoteInfoResponse, TContext>>;
    remoteInfo<TContext = unknown>(
      callback: callbackFn<T.ClusterRemoteInfoResponse, TContext>
    ): TransportRequestCallback;
    remoteInfo<TContext = unknown>(
      params: T.ClusterRemoteInfoRequest,
      callback: callbackFn<T.ClusterRemoteInfoResponse, TContext>
    ): TransportRequestCallback;
    remoteInfo<TContext = unknown>(
      params: T.ClusterRemoteInfoRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterRemoteInfoResponse, TContext>
    ): TransportRequestCallback;
    reroute<TContext = unknown>(
      params?: T.ClusterRerouteRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterRerouteResponse, TContext>>;
    reroute<TContext = unknown>(
      callback: callbackFn<T.ClusterRerouteResponse, TContext>
    ): TransportRequestCallback;
    reroute<TContext = unknown>(
      params: T.ClusterRerouteRequest,
      callback: callbackFn<T.ClusterRerouteResponse, TContext>
    ): TransportRequestCallback;
    reroute<TContext = unknown>(
      params: T.ClusterRerouteRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterRerouteResponse, TContext>
    ): TransportRequestCallback;
    state<TContext = unknown>(
      params?: T.ClusterStateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterStateResponse, TContext>>;
    state<TContext = unknown>(
      callback: callbackFn<T.ClusterStateResponse, TContext>
    ): TransportRequestCallback;
    state<TContext = unknown>(
      params: T.ClusterStateRequest,
      callback: callbackFn<T.ClusterStateResponse, TContext>
    ): TransportRequestCallback;
    state<TContext = unknown>(
      params: T.ClusterStateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterStateResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params?: T.ClusterStatsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.ClusterStatsResponse, TContext>>;
    stats<TContext = unknown>(
      callback: callbackFn<T.ClusterStatsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params: T.ClusterStatsRequest,
      callback: callbackFn<T.ClusterStatsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params: T.ClusterStatsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.ClusterStatsResponse, TContext>
    ): TransportRequestCallback;
  };
  count<TContext = unknown>(
    params?: T.CountRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.CountResponse, TContext>>;
  count<TContext = unknown>(
    callback: callbackFn<T.CountResponse, TContext>
  ): TransportRequestCallback;
  count<TContext = unknown>(
    params: T.CountRequest,
    callback: callbackFn<T.CountResponse, TContext>
  ): TransportRequestCallback;
  count<TContext = unknown>(
    params: T.CountRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.CountResponse, TContext>
  ): TransportRequestCallback;
  create<TDocument = unknown, TContext = unknown>(
    params: T.CreateRequest<TDocument>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.CreateResponse, TContext>>;
  create<TDocument = unknown, TContext = unknown>(
    params: T.CreateRequest<TDocument>,
    callback: callbackFn<T.CreateResponse, TContext>
  ): TransportRequestCallback;
  create<TDocument = unknown, TContext = unknown>(
    params: T.CreateRequest<TDocument>,
    options: TransportRequestOptions,
    callback: callbackFn<T.CreateResponse, TContext>
  ): TransportRequestCallback;
  danglingIndices: {
    deleteDanglingIndex<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    deleteDanglingIndex<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    deleteDanglingIndex<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    importDanglingIndex<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    importDanglingIndex<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    listDanglingIndices<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    listDanglingIndices<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
  };
  delete<TContext = unknown>(
    params: T.DeleteRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.DeleteResponse, TContext>>;
  delete<TContext = unknown>(
    params: T.DeleteRequest,
    callback: callbackFn<T.DeleteResponse, TContext>
  ): TransportRequestCallback;
  delete<TContext = unknown>(
    params: T.DeleteRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.DeleteResponse, TContext>
  ): TransportRequestCallback;
  deleteByQuery<TContext = unknown>(
    params: T.DeleteByQueryRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.DeleteByQueryResponse, TContext>>;
  deleteByQuery<TContext = unknown>(
    params: T.DeleteByQueryRequest,
    callback: callbackFn<T.DeleteByQueryResponse, TContext>
  ): TransportRequestCallback;
  deleteByQuery<TContext = unknown>(
    params: T.DeleteByQueryRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.DeleteByQueryResponse, TContext>
  ): TransportRequestCallback;
  deleteByQueryRethrottle<TContext = unknown>(
    params: T.DeleteByQueryRethrottleRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.DeleteByQueryRethrottleResponse, TContext>>;
  deleteByQueryRethrottle<TContext = unknown>(
    params: T.DeleteByQueryRethrottleRequest,
    callback: callbackFn<T.DeleteByQueryRethrottleResponse, TContext>
  ): TransportRequestCallback;
  deleteByQueryRethrottle<TContext = unknown>(
    params: T.DeleteByQueryRethrottleRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.DeleteByQueryRethrottleResponse, TContext>
  ): TransportRequestCallback;
  deleteScript<TContext = unknown>(
    params: T.DeleteScriptRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.DeleteScriptResponse, TContext>>;
  deleteScript<TContext = unknown>(
    params: T.DeleteScriptRequest,
    callback: callbackFn<T.DeleteScriptResponse, TContext>
  ): TransportRequestCallback;
  deleteScript<TContext = unknown>(
    params: T.DeleteScriptRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.DeleteScriptResponse, TContext>
  ): TransportRequestCallback;
  exists<TContext = unknown>(
    params: T.ExistsRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ExistsResponse, TContext>>;
  exists<TContext = unknown>(
    params: T.ExistsRequest,
    callback: callbackFn<T.ExistsResponse, TContext>
  ): TransportRequestCallback;
  exists<TContext = unknown>(
    params: T.ExistsRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ExistsResponse, TContext>
  ): TransportRequestCallback;
  existsSource<TContext = unknown>(
    params: T.ExistsSourceRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ExistsSourceResponse, TContext>>;
  existsSource<TContext = unknown>(
    params: T.ExistsSourceRequest,
    callback: callbackFn<T.ExistsSourceResponse, TContext>
  ): TransportRequestCallback;
  existsSource<TContext = unknown>(
    params: T.ExistsSourceRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ExistsSourceResponse, TContext>
  ): TransportRequestCallback;
  explain<TDocument = unknown, TContext = unknown>(
    params: T.ExplainRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ExplainResponse<TDocument>, TContext>>;
  explain<TDocument = unknown, TContext = unknown>(
    params: T.ExplainRequest,
    callback: callbackFn<T.ExplainResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  explain<TDocument = unknown, TContext = unknown>(
    params: T.ExplainRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ExplainResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  features: {
    getFeatures<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    getFeatures<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    getFeatures<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getFeatures<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    resetFeatures<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    resetFeatures<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    resetFeatures<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    resetFeatures<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
  };
  fieldCaps<TContext = unknown>(
    params?: T.FieldCapsRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.FieldCapsResponse, TContext>>;
  fieldCaps<TContext = unknown>(
    callback: callbackFn<T.FieldCapsResponse, TContext>
  ): TransportRequestCallback;
  fieldCaps<TContext = unknown>(
    params: T.FieldCapsRequest,
    callback: callbackFn<T.FieldCapsResponse, TContext>
  ): TransportRequestCallback;
  fieldCaps<TContext = unknown>(
    params: T.FieldCapsRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.FieldCapsResponse, TContext>
  ): TransportRequestCallback;
  get<TDocument = unknown, TContext = unknown>(
    params: T.GetRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.GetResponse<TDocument>, TContext>>;
  get<TDocument = unknown, TContext = unknown>(
    params: T.GetRequest,
    callback: callbackFn<T.GetResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  get<TDocument = unknown, TContext = unknown>(
    params: T.GetRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.GetResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  getScript<TContext = unknown>(
    params: T.GetScriptRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.GetScriptResponse, TContext>>;
  getScript<TContext = unknown>(
    params: T.GetScriptRequest,
    callback: callbackFn<T.GetScriptResponse, TContext>
  ): TransportRequestCallback;
  getScript<TContext = unknown>(
    params: T.GetScriptRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.GetScriptResponse, TContext>
  ): TransportRequestCallback;
  getScriptContext<TContext = unknown>(
    params?: T.GetScriptContextRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.GetScriptContextResponse, TContext>>;
  getScriptContext<TContext = unknown>(
    callback: callbackFn<T.GetScriptContextResponse, TContext>
  ): TransportRequestCallback;
  getScriptContext<TContext = unknown>(
    params: T.GetScriptContextRequest,
    callback: callbackFn<T.GetScriptContextResponse, TContext>
  ): TransportRequestCallback;
  getScriptContext<TContext = unknown>(
    params: T.GetScriptContextRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.GetScriptContextResponse, TContext>
  ): TransportRequestCallback;
  getScriptLanguages<TContext = unknown>(
    params?: T.GetScriptLanguagesRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.GetScriptLanguagesResponse, TContext>>;
  getScriptLanguages<TContext = unknown>(
    callback: callbackFn<T.GetScriptLanguagesResponse, TContext>
  ): TransportRequestCallback;
  getScriptLanguages<TContext = unknown>(
    params: T.GetScriptLanguagesRequest,
    callback: callbackFn<T.GetScriptLanguagesResponse, TContext>
  ): TransportRequestCallback;
  getScriptLanguages<TContext = unknown>(
    params: T.GetScriptLanguagesRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.GetScriptLanguagesResponse, TContext>
  ): TransportRequestCallback;
  getSource<TDocument = unknown, TContext = unknown>(
    params?: T.GetSourceRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.GetSourceResponse<TDocument>, TContext>>;
  getSource<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.GetSourceResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  getSource<TDocument = unknown, TContext = unknown>(
    params: T.GetSourceRequest,
    callback: callbackFn<T.GetSourceResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  getSource<TDocument = unknown, TContext = unknown>(
    params: T.GetSourceRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.GetSourceResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  index<TDocument = unknown, TContext = unknown>(
    params: T.IndexRequest<TDocument>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.IndexResponse, TContext>>;
  index<TDocument = unknown, TContext = unknown>(
    params: T.IndexRequest<TDocument>,
    callback: callbackFn<T.IndexResponse, TContext>
  ): TransportRequestCallback;
  index<TDocument = unknown, TContext = unknown>(
    params: T.IndexRequest<TDocument>,
    options: TransportRequestOptions,
    callback: callbackFn<T.IndexResponse, TContext>
  ): TransportRequestCallback;
  indices: {
    addBlock<TContext = unknown>(
      params: T.IndicesAddBlockRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesAddBlockResponse, TContext>>;
    addBlock<TContext = unknown>(
      params: T.IndicesAddBlockRequest,
      callback: callbackFn<T.IndicesAddBlockResponse, TContext>
    ): TransportRequestCallback;
    addBlock<TContext = unknown>(
      params: T.IndicesAddBlockRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesAddBlockResponse, TContext>
    ): TransportRequestCallback;
    analyze<TContext = unknown>(
      params?: T.IndicesAnalyzeRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesAnalyzeResponse, TContext>>;
    analyze<TContext = unknown>(
      callback: callbackFn<T.IndicesAnalyzeResponse, TContext>
    ): TransportRequestCallback;
    analyze<TContext = unknown>(
      params: T.IndicesAnalyzeRequest,
      callback: callbackFn<T.IndicesAnalyzeResponse, TContext>
    ): TransportRequestCallback;
    analyze<TContext = unknown>(
      params: T.IndicesAnalyzeRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesAnalyzeResponse, TContext>
    ): TransportRequestCallback;
    clearCache<TContext = unknown>(
      params?: T.IndicesClearCacheRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesClearCacheResponse, TContext>>;
    clearCache<TContext = unknown>(
      callback: callbackFn<T.IndicesClearCacheResponse, TContext>
    ): TransportRequestCallback;
    clearCache<TContext = unknown>(
      params: T.IndicesClearCacheRequest,
      callback: callbackFn<T.IndicesClearCacheResponse, TContext>
    ): TransportRequestCallback;
    clearCache<TContext = unknown>(
      params: T.IndicesClearCacheRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesClearCacheResponse, TContext>
    ): TransportRequestCallback;
    clone<TContext = unknown>(
      params: T.IndicesCloneRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesCloneResponse, TContext>>;
    clone<TContext = unknown>(
      params: T.IndicesCloneRequest,
      callback: callbackFn<T.IndicesCloneResponse, TContext>
    ): TransportRequestCallback;
    clone<TContext = unknown>(
      params: T.IndicesCloneRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesCloneResponse, TContext>
    ): TransportRequestCallback;
    close<TContext = unknown>(
      params: T.IndicesCloseRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesCloseResponse, TContext>>;
    close<TContext = unknown>(
      params: T.IndicesCloseRequest,
      callback: callbackFn<T.IndicesCloseResponse, TContext>
    ): TransportRequestCallback;
    close<TContext = unknown>(
      params: T.IndicesCloseRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesCloseResponse, TContext>
    ): TransportRequestCallback;
    create<TContext = unknown>(
      params: T.IndicesCreateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesCreateResponse, TContext>>;
    create<TContext = unknown>(
      params: T.IndicesCreateRequest,
      callback: callbackFn<T.IndicesCreateResponse, TContext>
    ): TransportRequestCallback;
    create<TContext = unknown>(
      params: T.IndicesCreateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesCreateResponse, TContext>
    ): TransportRequestCallback;
    delete<TContext = unknown>(
      params: T.IndicesDeleteRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesDeleteResponse, TContext>>;
    delete<TContext = unknown>(
      params: T.IndicesDeleteRequest,
      callback: callbackFn<T.IndicesDeleteResponse, TContext>
    ): TransportRequestCallback;
    delete<TContext = unknown>(
      params: T.IndicesDeleteRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesDeleteResponse, TContext>
    ): TransportRequestCallback;
    deleteAlias<TContext = unknown>(
      params: T.IndicesDeleteAliasRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesDeleteAliasResponse, TContext>>;
    deleteAlias<TContext = unknown>(
      params: T.IndicesDeleteAliasRequest,
      callback: callbackFn<T.IndicesDeleteAliasResponse, TContext>
    ): TransportRequestCallback;
    deleteAlias<TContext = unknown>(
      params: T.IndicesDeleteAliasRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesDeleteAliasResponse, TContext>
    ): TransportRequestCallback;
    deleteIndexTemplate<TContext = unknown>(
      params: T.IndicesDeleteIndexTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesDeleteIndexTemplateResponse, TContext>>;
    deleteIndexTemplate<TContext = unknown>(
      params: T.IndicesDeleteIndexTemplateRequest,
      callback: callbackFn<T.IndicesDeleteIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    deleteIndexTemplate<TContext = unknown>(
      params: T.IndicesDeleteIndexTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesDeleteIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    deleteTemplate<TContext = unknown>(
      params: T.IndicesDeleteTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesDeleteTemplateResponse, TContext>>;
    deleteTemplate<TContext = unknown>(
      params: T.IndicesDeleteTemplateRequest,
      callback: callbackFn<T.IndicesDeleteTemplateResponse, TContext>
    ): TransportRequestCallback;
    deleteTemplate<TContext = unknown>(
      params: T.IndicesDeleteTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesDeleteTemplateResponse, TContext>
    ): TransportRequestCallback;
    diskUsage<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    diskUsage<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    diskUsage<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    diskUsage<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    exists<TContext = unknown>(
      params: T.IndicesExistsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesExistsResponse, TContext>>;
    exists<TContext = unknown>(
      params: T.IndicesExistsRequest,
      callback: callbackFn<T.IndicesExistsResponse, TContext>
    ): TransportRequestCallback;
    exists<TContext = unknown>(
      params: T.IndicesExistsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesExistsResponse, TContext>
    ): TransportRequestCallback;
    existsAlias<TContext = unknown>(
      params: T.IndicesExistsAliasRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesExistsAliasResponse, TContext>>;
    existsAlias<TContext = unknown>(
      params: T.IndicesExistsAliasRequest,
      callback: callbackFn<T.IndicesExistsAliasResponse, TContext>
    ): TransportRequestCallback;
    existsAlias<TContext = unknown>(
      params: T.IndicesExistsAliasRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesExistsAliasResponse, TContext>
    ): TransportRequestCallback;
    existsIndexTemplate<TContext = unknown>(
      params: T.IndicesExistsIndexTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesExistsIndexTemplateResponse, TContext>>;
    existsIndexTemplate<TContext = unknown>(
      params: T.IndicesExistsIndexTemplateRequest,
      callback: callbackFn<T.IndicesExistsIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    existsIndexTemplate<TContext = unknown>(
      params: T.IndicesExistsIndexTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesExistsIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    existsTemplate<TContext = unknown>(
      params: T.IndicesExistsTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesExistsTemplateResponse, TContext>>;
    existsTemplate<TContext = unknown>(
      params: T.IndicesExistsTemplateRequest,
      callback: callbackFn<T.IndicesExistsTemplateResponse, TContext>
    ): TransportRequestCallback;
    existsTemplate<TContext = unknown>(
      params: T.IndicesExistsTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesExistsTemplateResponse, TContext>
    ): TransportRequestCallback;
    fieldUsageStats<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    fieldUsageStats<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    fieldUsageStats<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    fieldUsageStats<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    flush<TContext = unknown>(
      params?: T.IndicesFlushRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesFlushResponse, TContext>>;
    flush<TContext = unknown>(
      callback: callbackFn<T.IndicesFlushResponse, TContext>
    ): TransportRequestCallback;
    flush<TContext = unknown>(
      params: T.IndicesFlushRequest,
      callback: callbackFn<T.IndicesFlushResponse, TContext>
    ): TransportRequestCallback;
    flush<TContext = unknown>(
      params: T.IndicesFlushRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesFlushResponse, TContext>
    ): TransportRequestCallback;
    forcemerge<TContext = unknown>(
      params?: T.IndicesForcemergeRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesForcemergeResponse, TContext>>;
    forcemerge<TContext = unknown>(
      callback: callbackFn<T.IndicesForcemergeResponse, TContext>
    ): TransportRequestCallback;
    forcemerge<TContext = unknown>(
      params: T.IndicesForcemergeRequest,
      callback: callbackFn<T.IndicesForcemergeResponse, TContext>
    ): TransportRequestCallback;
    forcemerge<TContext = unknown>(
      params: T.IndicesForcemergeRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesForcemergeResponse, TContext>
    ): TransportRequestCallback;
    get<TContext = unknown>(
      params: T.IndicesGetRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetResponse, TContext>>;
    get<TContext = unknown>(
      params: T.IndicesGetRequest,
      callback: callbackFn<T.IndicesGetResponse, TContext>
    ): TransportRequestCallback;
    get<TContext = unknown>(
      params: T.IndicesGetRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetResponse, TContext>
    ): TransportRequestCallback;
    getAlias<TContext = unknown>(
      params?: T.IndicesGetAliasRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetAliasResponse, TContext>>;
    getAlias<TContext = unknown>(
      callback: callbackFn<T.IndicesGetAliasResponse, TContext>
    ): TransportRequestCallback;
    getAlias<TContext = unknown>(
      params: T.IndicesGetAliasRequest,
      callback: callbackFn<T.IndicesGetAliasResponse, TContext>
    ): TransportRequestCallback;
    getAlias<TContext = unknown>(
      params: T.IndicesGetAliasRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetAliasResponse, TContext>
    ): TransportRequestCallback;
    getFieldMapping<TContext = unknown>(
      params: T.IndicesGetFieldMappingRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetFieldMappingResponse, TContext>>;
    getFieldMapping<TContext = unknown>(
      params: T.IndicesGetFieldMappingRequest,
      callback: callbackFn<T.IndicesGetFieldMappingResponse, TContext>
    ): TransportRequestCallback;
    getFieldMapping<TContext = unknown>(
      params: T.IndicesGetFieldMappingRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetFieldMappingResponse, TContext>
    ): TransportRequestCallback;
    getIndexTemplate<TContext = unknown>(
      params?: T.IndicesGetIndexTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetIndexTemplateResponse, TContext>>;
    getIndexTemplate<TContext = unknown>(
      callback: callbackFn<T.IndicesGetIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    getIndexTemplate<TContext = unknown>(
      params: T.IndicesGetIndexTemplateRequest,
      callback: callbackFn<T.IndicesGetIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    getIndexTemplate<TContext = unknown>(
      params: T.IndicesGetIndexTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    getMapping<TContext = unknown>(
      params?: T.IndicesGetMappingRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetMappingResponse, TContext>>;
    getMapping<TContext = unknown>(
      callback: callbackFn<T.IndicesGetMappingResponse, TContext>
    ): TransportRequestCallback;
    getMapping<TContext = unknown>(
      params: T.IndicesGetMappingRequest,
      callback: callbackFn<T.IndicesGetMappingResponse, TContext>
    ): TransportRequestCallback;
    getMapping<TContext = unknown>(
      params: T.IndicesGetMappingRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetMappingResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TContext = unknown>(
      params?: T.IndicesGetSettingsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetSettingsResponse, TContext>>;
    getSettings<TContext = unknown>(
      callback: callbackFn<T.IndicesGetSettingsResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TContext = unknown>(
      params: T.IndicesGetSettingsRequest,
      callback: callbackFn<T.IndicesGetSettingsResponse, TContext>
    ): TransportRequestCallback;
    getSettings<TContext = unknown>(
      params: T.IndicesGetSettingsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetSettingsResponse, TContext>
    ): TransportRequestCallback;
    getTemplate<TContext = unknown>(
      params?: T.IndicesGetTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesGetTemplateResponse, TContext>>;
    getTemplate<TContext = unknown>(
      callback: callbackFn<T.IndicesGetTemplateResponse, TContext>
    ): TransportRequestCallback;
    getTemplate<TContext = unknown>(
      params: T.IndicesGetTemplateRequest,
      callback: callbackFn<T.IndicesGetTemplateResponse, TContext>
    ): TransportRequestCallback;
    getTemplate<TContext = unknown>(
      params: T.IndicesGetTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesGetTemplateResponse, TContext>
    ): TransportRequestCallback;
    getUpgrade<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    getUpgrade<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    getUpgrade<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getUpgrade<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    open<TContext = unknown>(
      params: T.IndicesOpenRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesOpenResponse, TContext>>;
    open<TContext = unknown>(
      params: T.IndicesOpenRequest,
      callback: callbackFn<T.IndicesOpenResponse, TContext>
    ): TransportRequestCallback;
    open<TContext = unknown>(
      params: T.IndicesOpenRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesOpenResponse, TContext>
    ): TransportRequestCallback;
    putAlias<TContext = unknown>(
      params: T.IndicesPutAliasRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesPutAliasResponse, TContext>>;
    putAlias<TContext = unknown>(
      params: T.IndicesPutAliasRequest,
      callback: callbackFn<T.IndicesPutAliasResponse, TContext>
    ): TransportRequestCallback;
    putAlias<TContext = unknown>(
      params: T.IndicesPutAliasRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesPutAliasResponse, TContext>
    ): TransportRequestCallback;
    putIndexTemplate<TContext = unknown>(
      params: T.IndicesPutIndexTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesPutIndexTemplateResponse, TContext>>;
    putIndexTemplate<TContext = unknown>(
      params: T.IndicesPutIndexTemplateRequest,
      callback: callbackFn<T.IndicesPutIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    putIndexTemplate<TContext = unknown>(
      params: T.IndicesPutIndexTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesPutIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    putMapping<TContext = unknown>(
      params?: T.IndicesPutMappingRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesPutMappingResponse, TContext>>;
    putMapping<TContext = unknown>(
      callback: callbackFn<T.IndicesPutMappingResponse, TContext>
    ): TransportRequestCallback;
    putMapping<TContext = unknown>(
      params: T.IndicesPutMappingRequest,
      callback: callbackFn<T.IndicesPutMappingResponse, TContext>
    ): TransportRequestCallback;
    putMapping<TContext = unknown>(
      params: T.IndicesPutMappingRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesPutMappingResponse, TContext>
    ): TransportRequestCallback;
    putSettings<TContext = unknown>(
      params?: T.IndicesPutSettingsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesPutSettingsResponse, TContext>>;
    putSettings<TContext = unknown>(
      callback: callbackFn<T.IndicesPutSettingsResponse, TContext>
    ): TransportRequestCallback;
    putSettings<TContext = unknown>(
      params: T.IndicesPutSettingsRequest,
      callback: callbackFn<T.IndicesPutSettingsResponse, TContext>
    ): TransportRequestCallback;
    putSettings<TContext = unknown>(
      params: T.IndicesPutSettingsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesPutSettingsResponse, TContext>
    ): TransportRequestCallback;
    putTemplate<TContext = unknown>(
      params: T.IndicesPutTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesPutTemplateResponse, TContext>>;
    putTemplate<TContext = unknown>(
      params: T.IndicesPutTemplateRequest,
      callback: callbackFn<T.IndicesPutTemplateResponse, TContext>
    ): TransportRequestCallback;
    putTemplate<TContext = unknown>(
      params: T.IndicesPutTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesPutTemplateResponse, TContext>
    ): TransportRequestCallback;
    recovery<TContext = unknown>(
      params?: T.IndicesRecoveryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesRecoveryResponse, TContext>>;
    recovery<TContext = unknown>(
      callback: callbackFn<T.IndicesRecoveryResponse, TContext>
    ): TransportRequestCallback;
    recovery<TContext = unknown>(
      params: T.IndicesRecoveryRequest,
      callback: callbackFn<T.IndicesRecoveryResponse, TContext>
    ): TransportRequestCallback;
    recovery<TContext = unknown>(
      params: T.IndicesRecoveryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesRecoveryResponse, TContext>
    ): TransportRequestCallback;
    refresh<TContext = unknown>(
      params?: T.IndicesRefreshRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesRefreshResponse, TContext>>;
    refresh<TContext = unknown>(
      callback: callbackFn<T.IndicesRefreshResponse, TContext>
    ): TransportRequestCallback;
    refresh<TContext = unknown>(
      params: T.IndicesRefreshRequest,
      callback: callbackFn<T.IndicesRefreshResponse, TContext>
    ): TransportRequestCallback;
    refresh<TContext = unknown>(
      params: T.IndicesRefreshRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesRefreshResponse, TContext>
    ): TransportRequestCallback;
    resolveIndex<TContext = unknown>(
      params: T.IndicesResolveIndexRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesResolveIndexResponse, TContext>>;
    resolveIndex<TContext = unknown>(
      params: T.IndicesResolveIndexRequest,
      callback: callbackFn<T.IndicesResolveIndexResponse, TContext>
    ): TransportRequestCallback;
    resolveIndex<TContext = unknown>(
      params: T.IndicesResolveIndexRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesResolveIndexResponse, TContext>
    ): TransportRequestCallback;
    rollover<TContext = unknown>(
      params: T.IndicesRolloverRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesRolloverResponse, TContext>>;
    rollover<TContext = unknown>(
      params: T.IndicesRolloverRequest,
      callback: callbackFn<T.IndicesRolloverResponse, TContext>
    ): TransportRequestCallback;
    rollover<TContext = unknown>(
      params: T.IndicesRolloverRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesRolloverResponse, TContext>
    ): TransportRequestCallback;
    segments<TContext = unknown>(
      params?: T.IndicesSegmentsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesSegmentsResponse, TContext>>;
    segments<TContext = unknown>(
      callback: callbackFn<T.IndicesSegmentsResponse, TContext>
    ): TransportRequestCallback;
    segments<TContext = unknown>(
      params: T.IndicesSegmentsRequest,
      callback: callbackFn<T.IndicesSegmentsResponse, TContext>
    ): TransportRequestCallback;
    segments<TContext = unknown>(
      params: T.IndicesSegmentsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesSegmentsResponse, TContext>
    ): TransportRequestCallback;
    shardStores<TContext = unknown>(
      params?: T.IndicesShardStoresRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesShardStoresResponse, TContext>>;
    shardStores<TContext = unknown>(
      callback: callbackFn<T.IndicesShardStoresResponse, TContext>
    ): TransportRequestCallback;
    shardStores<TContext = unknown>(
      params: T.IndicesShardStoresRequest,
      callback: callbackFn<T.IndicesShardStoresResponse, TContext>
    ): TransportRequestCallback;
    shardStores<TContext = unknown>(
      params: T.IndicesShardStoresRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesShardStoresResponse, TContext>
    ): TransportRequestCallback;
    shrink<TContext = unknown>(
      params: T.IndicesShrinkRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesShrinkResponse, TContext>>;
    shrink<TContext = unknown>(
      params: T.IndicesShrinkRequest,
      callback: callbackFn<T.IndicesShrinkResponse, TContext>
    ): TransportRequestCallback;
    shrink<TContext = unknown>(
      params: T.IndicesShrinkRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesShrinkResponse, TContext>
    ): TransportRequestCallback;
    simulateIndexTemplate<TContext = unknown>(
      params?: T.IndicesSimulateIndexTemplateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesSimulateIndexTemplateResponse, TContext>>;
    simulateIndexTemplate<TContext = unknown>(
      callback: callbackFn<T.IndicesSimulateIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    simulateIndexTemplate<TContext = unknown>(
      params: T.IndicesSimulateIndexTemplateRequest,
      callback: callbackFn<T.IndicesSimulateIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    simulateIndexTemplate<TContext = unknown>(
      params: T.IndicesSimulateIndexTemplateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesSimulateIndexTemplateResponse, TContext>
    ): TransportRequestCallback;
    simulateTemplate<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    simulateTemplate<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    simulateTemplate<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    simulateTemplate<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    split<TContext = unknown>(
      params: T.IndicesSplitRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesSplitResponse, TContext>>;
    split<TContext = unknown>(
      params: T.IndicesSplitRequest,
      callback: callbackFn<T.IndicesSplitResponse, TContext>
    ): TransportRequestCallback;
    split<TContext = unknown>(
      params: T.IndicesSplitRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesSplitResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params?: T.IndicesStatsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesStatsResponse, TContext>>;
    stats<TContext = unknown>(
      callback: callbackFn<T.IndicesStatsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params: T.IndicesStatsRequest,
      callback: callbackFn<T.IndicesStatsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params: T.IndicesStatsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesStatsResponse, TContext>
    ): TransportRequestCallback;
    updateAliases<TContext = unknown>(
      params?: T.IndicesUpdateAliasesRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesUpdateAliasesResponse, TContext>>;
    updateAliases<TContext = unknown>(
      callback: callbackFn<T.IndicesUpdateAliasesResponse, TContext>
    ): TransportRequestCallback;
    updateAliases<TContext = unknown>(
      params: T.IndicesUpdateAliasesRequest,
      callback: callbackFn<T.IndicesUpdateAliasesResponse, TContext>
    ): TransportRequestCallback;
    updateAliases<TContext = unknown>(
      params: T.IndicesUpdateAliasesRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesUpdateAliasesResponse, TContext>
    ): TransportRequestCallback;
    upgrade<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    upgrade<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    upgrade<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    upgrade<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    validateQuery<TContext = unknown>(
      params?: T.IndicesValidateQueryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IndicesValidateQueryResponse, TContext>>;
    validateQuery<TContext = unknown>(
      callback: callbackFn<T.IndicesValidateQueryResponse, TContext>
    ): TransportRequestCallback;
    validateQuery<TContext = unknown>(
      params: T.IndicesValidateQueryRequest,
      callback: callbackFn<T.IndicesValidateQueryResponse, TContext>
    ): TransportRequestCallback;
    validateQuery<TContext = unknown>(
      params: T.IndicesValidateQueryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IndicesValidateQueryResponse, TContext>
    ): TransportRequestCallback;
  };
  info<TContext = unknown>(
    params?: T.InfoRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.InfoResponse, TContext>>;
  info<TContext = unknown>(
    callback: callbackFn<T.InfoResponse, TContext>
  ): TransportRequestCallback;
  info<TContext = unknown>(
    params: T.InfoRequest,
    callback: callbackFn<T.InfoResponse, TContext>
  ): TransportRequestCallback;
  info<TContext = unknown>(
    params: T.InfoRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.InfoResponse, TContext>
  ): TransportRequestCallback;
  ingest: {
    deletePipeline<TContext = unknown>(
      params: T.IngestDeletePipelineRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IngestDeletePipelineResponse, TContext>>;
    deletePipeline<TContext = unknown>(
      params: T.IngestDeletePipelineRequest,
      callback: callbackFn<T.IngestDeletePipelineResponse, TContext>
    ): TransportRequestCallback;
    deletePipeline<TContext = unknown>(
      params: T.IngestDeletePipelineRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IngestDeletePipelineResponse, TContext>
    ): TransportRequestCallback;
    geoIpStats<TContext = unknown>(
      params?: T.IngestGeoIpStatsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IngestGeoIpStatsResponse, TContext>>;
    geoIpStats<TContext = unknown>(
      callback: callbackFn<T.IngestGeoIpStatsResponse, TContext>
    ): TransportRequestCallback;
    geoIpStats<TContext = unknown>(
      params: T.IngestGeoIpStatsRequest,
      callback: callbackFn<T.IngestGeoIpStatsResponse, TContext>
    ): TransportRequestCallback;
    geoIpStats<TContext = unknown>(
      params: T.IngestGeoIpStatsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IngestGeoIpStatsResponse, TContext>
    ): TransportRequestCallback;
    getPipeline<TContext = unknown>(
      params?: T.IngestGetPipelineRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IngestGetPipelineResponse, TContext>>;
    getPipeline<TContext = unknown>(
      callback: callbackFn<T.IngestGetPipelineResponse, TContext>
    ): TransportRequestCallback;
    getPipeline<TContext = unknown>(
      params: T.IngestGetPipelineRequest,
      callback: callbackFn<T.IngestGetPipelineResponse, TContext>
    ): TransportRequestCallback;
    getPipeline<TContext = unknown>(
      params: T.IngestGetPipelineRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IngestGetPipelineResponse, TContext>
    ): TransportRequestCallback;
    processorGrok<TContext = unknown>(
      params?: T.IngestProcessorGrokRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IngestProcessorGrokResponse, TContext>>;
    processorGrok<TContext = unknown>(
      callback: callbackFn<T.IngestProcessorGrokResponse, TContext>
    ): TransportRequestCallback;
    processorGrok<TContext = unknown>(
      params: T.IngestProcessorGrokRequest,
      callback: callbackFn<T.IngestProcessorGrokResponse, TContext>
    ): TransportRequestCallback;
    processorGrok<TContext = unknown>(
      params: T.IngestProcessorGrokRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IngestProcessorGrokResponse, TContext>
    ): TransportRequestCallback;
    putPipeline<TContext = unknown>(
      params: T.IngestPutPipelineRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IngestPutPipelineResponse, TContext>>;
    putPipeline<TContext = unknown>(
      params: T.IngestPutPipelineRequest,
      callback: callbackFn<T.IngestPutPipelineResponse, TContext>
    ): TransportRequestCallback;
    putPipeline<TContext = unknown>(
      params: T.IngestPutPipelineRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IngestPutPipelineResponse, TContext>
    ): TransportRequestCallback;
    simulate<TContext = unknown>(
      params?: T.IngestSimulatePipelineRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.IngestSimulatePipelineResponse, TContext>>;
    simulate<TContext = unknown>(
      callback: callbackFn<T.IngestSimulatePipelineResponse, TContext>
    ): TransportRequestCallback;
    simulate<TContext = unknown>(
      params: T.IngestSimulatePipelineRequest,
      callback: callbackFn<T.IngestSimulatePipelineResponse, TContext>
    ): TransportRequestCallback;
    simulate<TContext = unknown>(
      params: T.IngestSimulatePipelineRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.IngestSimulatePipelineResponse, TContext>
    ): TransportRequestCallback;
  };
  mget<TDocument = unknown, TContext = unknown>(
    params?: T.MgetRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.MgetResponse<TDocument>, TContext>>;
  mget<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.MgetResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  mget<TDocument = unknown, TContext = unknown>(
    params: T.MgetRequest,
    callback: callbackFn<T.MgetResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  mget<TDocument = unknown, TContext = unknown>(
    params: T.MgetRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.MgetResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  msearch<TDocument = unknown, TContext = unknown>(
    params?: T.MsearchRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.MsearchResponse<TDocument>, TContext>>;
  msearch<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.MsearchResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  msearch<TDocument = unknown, TContext = unknown>(
    params: T.MsearchRequest,
    callback: callbackFn<T.MsearchResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  msearch<TDocument = unknown, TContext = unknown>(
    params: T.MsearchRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.MsearchResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  msearchTemplate<TDocument = unknown, TContext = unknown>(
    params?: T.MsearchTemplateRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.MsearchTemplateResponse<TDocument>, TContext>>;
  msearchTemplate<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.MsearchTemplateResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  msearchTemplate<TDocument = unknown, TContext = unknown>(
    params: T.MsearchTemplateRequest,
    callback: callbackFn<T.MsearchTemplateResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  msearchTemplate<TDocument = unknown, TContext = unknown>(
    params: T.MsearchTemplateRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.MsearchTemplateResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  mtermvectors<TContext = unknown>(
    params?: T.MtermvectorsRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.MtermvectorsResponse, TContext>>;
  mtermvectors<TContext = unknown>(
    callback: callbackFn<T.MtermvectorsResponse, TContext>
  ): TransportRequestCallback;
  mtermvectors<TContext = unknown>(
    params: T.MtermvectorsRequest,
    callback: callbackFn<T.MtermvectorsResponse, TContext>
  ): TransportRequestCallback;
  mtermvectors<TContext = unknown>(
    params: T.MtermvectorsRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.MtermvectorsResponse, TContext>
  ): TransportRequestCallback;
  nodes: {
    clearMeteringArchive<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    clearMeteringArchive<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    clearMeteringArchive<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    clearMeteringArchive<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getMeteringInfo<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    getMeteringInfo<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getMeteringInfo<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getMeteringInfo<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    hotThreads<TContext = unknown>(
      params?: T.NodesHotThreadsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.NodesHotThreadsResponse, TContext>>;
    hotThreads<TContext = unknown>(
      callback: callbackFn<T.NodesHotThreadsResponse, TContext>
    ): TransportRequestCallback;
    hotThreads<TContext = unknown>(
      params: T.NodesHotThreadsRequest,
      callback: callbackFn<T.NodesHotThreadsResponse, TContext>
    ): TransportRequestCallback;
    hotThreads<TContext = unknown>(
      params: T.NodesHotThreadsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.NodesHotThreadsResponse, TContext>
    ): TransportRequestCallback;
    info<TContext = unknown>(
      params?: T.NodesInfoRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.NodesInfoResponse, TContext>>;
    info<TContext = unknown>(
      callback: callbackFn<T.NodesInfoResponse, TContext>
    ): TransportRequestCallback;
    info<TContext = unknown>(
      params: T.NodesInfoRequest,
      callback: callbackFn<T.NodesInfoResponse, TContext>
    ): TransportRequestCallback;
    info<TContext = unknown>(
      params: T.NodesInfoRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.NodesInfoResponse, TContext>
    ): TransportRequestCallback;
    reloadSecureSettings<TContext = unknown>(
      params?: T.NodesReloadSecureSettingsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.NodesReloadSecureSettingsResponse, TContext>>;
    reloadSecureSettings<TContext = unknown>(
      callback: callbackFn<T.NodesReloadSecureSettingsResponse, TContext>
    ): TransportRequestCallback;
    reloadSecureSettings<TContext = unknown>(
      params: T.NodesReloadSecureSettingsRequest,
      callback: callbackFn<T.NodesReloadSecureSettingsResponse, TContext>
    ): TransportRequestCallback;
    reloadSecureSettings<TContext = unknown>(
      params: T.NodesReloadSecureSettingsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.NodesReloadSecureSettingsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params?: T.NodesStatsRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.NodesStatsResponse, TContext>>;
    stats<TContext = unknown>(
      callback: callbackFn<T.NodesStatsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params: T.NodesStatsRequest,
      callback: callbackFn<T.NodesStatsResponse, TContext>
    ): TransportRequestCallback;
    stats<TContext = unknown>(
      params: T.NodesStatsRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.NodesStatsResponse, TContext>
    ): TransportRequestCallback;
    usage<TContext = unknown>(
      params?: T.NodesUsageRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.NodesUsageResponse, TContext>>;
    usage<TContext = unknown>(
      callback: callbackFn<T.NodesUsageResponse, TContext>
    ): TransportRequestCallback;
    usage<TContext = unknown>(
      params: T.NodesUsageRequest,
      callback: callbackFn<T.NodesUsageResponse, TContext>
    ): TransportRequestCallback;
    usage<TContext = unknown>(
      params: T.NodesUsageRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.NodesUsageResponse, TContext>
    ): TransportRequestCallback;
  };
  ping<TContext = unknown>(
    params?: T.PingRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.PingResponse, TContext>>;
  ping<TContext = unknown>(
    callback: callbackFn<T.PingResponse, TContext>
  ): TransportRequestCallback;
  ping<TContext = unknown>(
    params: T.PingRequest,
    callback: callbackFn<T.PingResponse, TContext>
  ): TransportRequestCallback;
  ping<TContext = unknown>(
    params: T.PingRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.PingResponse, TContext>
  ): TransportRequestCallback;
  putScript<TContext = unknown>(
    params: T.PutScriptRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.PutScriptResponse, TContext>>;
  putScript<TContext = unknown>(
    params: T.PutScriptRequest,
    callback: callbackFn<T.PutScriptResponse, TContext>
  ): TransportRequestCallback;
  putScript<TContext = unknown>(
    params: T.PutScriptRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.PutScriptResponse, TContext>
  ): TransportRequestCallback;
  rankEval<TContext = unknown>(
    params: T.RankEvalRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.RankEvalResponse, TContext>>;
  rankEval<TContext = unknown>(
    params: T.RankEvalRequest,
    callback: callbackFn<T.RankEvalResponse, TContext>
  ): TransportRequestCallback;
  rankEval<TContext = unknown>(
    params: T.RankEvalRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.RankEvalResponse, TContext>
  ): TransportRequestCallback;
  reindex<TContext = unknown>(
    params?: T.ReindexRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ReindexResponse, TContext>>;
  reindex<TContext = unknown>(
    callback: callbackFn<T.ReindexResponse, TContext>
  ): TransportRequestCallback;
  reindex<TContext = unknown>(
    params: T.ReindexRequest,
    callback: callbackFn<T.ReindexResponse, TContext>
  ): TransportRequestCallback;
  reindex<TContext = unknown>(
    params: T.ReindexRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ReindexResponse, TContext>
  ): TransportRequestCallback;
  reindexRethrottle<TContext = unknown>(
    params: T.ReindexRethrottleRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ReindexRethrottleResponse, TContext>>;
  reindexRethrottle<TContext = unknown>(
    params: T.ReindexRethrottleRequest,
    callback: callbackFn<T.ReindexRethrottleResponse, TContext>
  ): TransportRequestCallback;
  reindexRethrottle<TContext = unknown>(
    params: T.ReindexRethrottleRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ReindexRethrottleResponse, TContext>
  ): TransportRequestCallback;
  renderSearchTemplate<TContext = unknown>(
    params?: T.RenderSearchTemplateRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.RenderSearchTemplateResponse, TContext>>;
  renderSearchTemplate<TContext = unknown>(
    callback: callbackFn<T.RenderSearchTemplateResponse, TContext>
  ): TransportRequestCallback;
  renderSearchTemplate<TContext = unknown>(
    params: T.RenderSearchTemplateRequest,
    callback: callbackFn<T.RenderSearchTemplateResponse, TContext>
  ): TransportRequestCallback;
  renderSearchTemplate<TContext = unknown>(
    params: T.RenderSearchTemplateRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.RenderSearchTemplateResponse, TContext>
  ): TransportRequestCallback;
  scriptsPainlessExecute<TResult = unknown, TContext = unknown>(
    params?: T.ScriptsPainlessExecuteRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ScriptsPainlessExecuteResponse<TResult>, TContext>>;
  scriptsPainlessExecute<TResult = unknown, TContext = unknown>(
    callback: callbackFn<T.ScriptsPainlessExecuteResponse<TResult>, TContext>
  ): TransportRequestCallback;
  scriptsPainlessExecute<TResult = unknown, TContext = unknown>(
    params: T.ScriptsPainlessExecuteRequest,
    callback: callbackFn<T.ScriptsPainlessExecuteResponse<TResult>, TContext>
  ): TransportRequestCallback;
  scriptsPainlessExecute<TResult = unknown, TContext = unknown>(
    params: T.ScriptsPainlessExecuteRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ScriptsPainlessExecuteResponse<TResult>, TContext>
  ): TransportRequestCallback;
  scroll<TDocument = unknown, TContext = unknown>(
    params?: T.ScrollRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.ScrollResponse<TDocument>, TContext>>;
  scroll<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.ScrollResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  scroll<TDocument = unknown, TContext = unknown>(
    params: T.ScrollRequest,
    callback: callbackFn<T.ScrollResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  scroll<TDocument = unknown, TContext = unknown>(
    params: T.ScrollRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.ScrollResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  search<TDocument = unknown, TContext = unknown>(
    params?: T.SearchRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.SearchResponse<TDocument>, TContext>>;
  search<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.SearchResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  search<TDocument = unknown, TContext = unknown>(
    params: T.SearchRequest,
    callback: callbackFn<T.SearchResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  search<TDocument = unknown, TContext = unknown>(
    params: T.SearchRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.SearchResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  searchShards<TContext = unknown>(
    params?: T.SearchShardsRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.SearchShardsResponse, TContext>>;
  searchShards<TContext = unknown>(
    callback: callbackFn<T.SearchShardsResponse, TContext>
  ): TransportRequestCallback;
  searchShards<TContext = unknown>(
    params: T.SearchShardsRequest,
    callback: callbackFn<T.SearchShardsResponse, TContext>
  ): TransportRequestCallback;
  searchShards<TContext = unknown>(
    params: T.SearchShardsRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.SearchShardsResponse, TContext>
  ): TransportRequestCallback;
  searchTemplate<TDocument = unknown, TContext = unknown>(
    params?: T.SearchTemplateRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.SearchTemplateResponse<TDocument>, TContext>>;
  searchTemplate<TDocument = unknown, TContext = unknown>(
    callback: callbackFn<T.SearchTemplateResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  searchTemplate<TDocument = unknown, TContext = unknown>(
    params: T.SearchTemplateRequest,
    callback: callbackFn<T.SearchTemplateResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  searchTemplate<TDocument = unknown, TContext = unknown>(
    params: T.SearchTemplateRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.SearchTemplateResponse<TDocument>, TContext>
  ): TransportRequestCallback;
  shutdown: {
    deleteNode<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    deleteNode<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    deleteNode<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    deleteNode<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getNode<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    getNode<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    getNode<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    getNode<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    putNode<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    putNode<TContext = unknown>(callback: callbackFn<TODO, TContext>): TransportRequestCallback;
    putNode<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    putNode<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
  };
  snapshot: {
    cleanupRepository<TContext = unknown>(
      params: T.SnapshotCleanupRepositoryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotCleanupRepositoryResponse, TContext>>;
    cleanupRepository<TContext = unknown>(
      params: T.SnapshotCleanupRepositoryRequest,
      callback: callbackFn<T.SnapshotCleanupRepositoryResponse, TContext>
    ): TransportRequestCallback;
    cleanupRepository<TContext = unknown>(
      params: T.SnapshotCleanupRepositoryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotCleanupRepositoryResponse, TContext>
    ): TransportRequestCallback;
    clone<TContext = unknown>(
      params: T.SnapshotCloneRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotCloneResponse, TContext>>;
    clone<TContext = unknown>(
      params: T.SnapshotCloneRequest,
      callback: callbackFn<T.SnapshotCloneResponse, TContext>
    ): TransportRequestCallback;
    clone<TContext = unknown>(
      params: T.SnapshotCloneRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotCloneResponse, TContext>
    ): TransportRequestCallback;
    create<TContext = unknown>(
      params: T.SnapshotCreateRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotCreateResponse, TContext>>;
    create<TContext = unknown>(
      params: T.SnapshotCreateRequest,
      callback: callbackFn<T.SnapshotCreateResponse, TContext>
    ): TransportRequestCallback;
    create<TContext = unknown>(
      params: T.SnapshotCreateRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotCreateResponse, TContext>
    ): TransportRequestCallback;
    createRepository<TContext = unknown>(
      params: T.SnapshotCreateRepositoryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotCreateRepositoryResponse, TContext>>;
    createRepository<TContext = unknown>(
      params: T.SnapshotCreateRepositoryRequest,
      callback: callbackFn<T.SnapshotCreateRepositoryResponse, TContext>
    ): TransportRequestCallback;
    createRepository<TContext = unknown>(
      params: T.SnapshotCreateRepositoryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotCreateRepositoryResponse, TContext>
    ): TransportRequestCallback;
    delete<TContext = unknown>(
      params: T.SnapshotDeleteRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotDeleteResponse, TContext>>;
    delete<TContext = unknown>(
      params: T.SnapshotDeleteRequest,
      callback: callbackFn<T.SnapshotDeleteResponse, TContext>
    ): TransportRequestCallback;
    delete<TContext = unknown>(
      params: T.SnapshotDeleteRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotDeleteResponse, TContext>
    ): TransportRequestCallback;
    deleteRepository<TContext = unknown>(
      params: T.SnapshotDeleteRepositoryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotDeleteRepositoryResponse, TContext>>;
    deleteRepository<TContext = unknown>(
      params: T.SnapshotDeleteRepositoryRequest,
      callback: callbackFn<T.SnapshotDeleteRepositoryResponse, TContext>
    ): TransportRequestCallback;
    deleteRepository<TContext = unknown>(
      params: T.SnapshotDeleteRepositoryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotDeleteRepositoryResponse, TContext>
    ): TransportRequestCallback;
    get<TContext = unknown>(
      params: T.SnapshotGetRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotGetResponse, TContext>>;
    get<TContext = unknown>(
      params: T.SnapshotGetRequest,
      callback: callbackFn<T.SnapshotGetResponse, TContext>
    ): TransportRequestCallback;
    get<TContext = unknown>(
      params: T.SnapshotGetRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotGetResponse, TContext>
    ): TransportRequestCallback;
    getRepository<TContext = unknown>(
      params?: T.SnapshotGetRepositoryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotGetRepositoryResponse, TContext>>;
    getRepository<TContext = unknown>(
      callback: callbackFn<T.SnapshotGetRepositoryResponse, TContext>
    ): TransportRequestCallback;
    getRepository<TContext = unknown>(
      params: T.SnapshotGetRepositoryRequest,
      callback: callbackFn<T.SnapshotGetRepositoryResponse, TContext>
    ): TransportRequestCallback;
    getRepository<TContext = unknown>(
      params: T.SnapshotGetRepositoryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotGetRepositoryResponse, TContext>
    ): TransportRequestCallback;
    repositoryAnalyze<TContext = unknown>(
      params?: TODO,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<TODO, TContext>>;
    repositoryAnalyze<TContext = unknown>(
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    repositoryAnalyze<TContext = unknown>(
      params: TODO,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    repositoryAnalyze<TContext = unknown>(
      params: TODO,
      options: TransportRequestOptions,
      callback: callbackFn<TODO, TContext>
    ): TransportRequestCallback;
    restore<TContext = unknown>(
      params: T.SnapshotRestoreRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotRestoreResponse, TContext>>;
    restore<TContext = unknown>(
      params: T.SnapshotRestoreRequest,
      callback: callbackFn<T.SnapshotRestoreResponse, TContext>
    ): TransportRequestCallback;
    restore<TContext = unknown>(
      params: T.SnapshotRestoreRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotRestoreResponse, TContext>
    ): TransportRequestCallback;
    status<TContext = unknown>(
      params?: T.SnapshotStatusRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotStatusResponse, TContext>>;
    status<TContext = unknown>(
      callback: callbackFn<T.SnapshotStatusResponse, TContext>
    ): TransportRequestCallback;
    status<TContext = unknown>(
      params: T.SnapshotStatusRequest,
      callback: callbackFn<T.SnapshotStatusResponse, TContext>
    ): TransportRequestCallback;
    status<TContext = unknown>(
      params: T.SnapshotStatusRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotStatusResponse, TContext>
    ): TransportRequestCallback;
    verifyRepository<TContext = unknown>(
      params: T.SnapshotVerifyRepositoryRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.SnapshotVerifyRepositoryResponse, TContext>>;
    verifyRepository<TContext = unknown>(
      params: T.SnapshotVerifyRepositoryRequest,
      callback: callbackFn<T.SnapshotVerifyRepositoryResponse, TContext>
    ): TransportRequestCallback;
    verifyRepository<TContext = unknown>(
      params: T.SnapshotVerifyRepositoryRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.SnapshotVerifyRepositoryResponse, TContext>
    ): TransportRequestCallback;
  };
  tasks: {
    cancel<TContext = unknown>(
      params?: T.TaskCancelRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.TaskCancelResponse, TContext>>;
    cancel<TContext = unknown>(
      callback: callbackFn<T.TaskCancelResponse, TContext>
    ): TransportRequestCallback;
    cancel<TContext = unknown>(
      params: T.TaskCancelRequest,
      callback: callbackFn<T.TaskCancelResponse, TContext>
    ): TransportRequestCallback;
    cancel<TContext = unknown>(
      params: T.TaskCancelRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.TaskCancelResponse, TContext>
    ): TransportRequestCallback;
    get<TContext = unknown>(
      params: T.TaskGetRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.TaskGetResponse, TContext>>;
    get<TContext = unknown>(
      params: T.TaskGetRequest,
      callback: callbackFn<T.TaskGetResponse, TContext>
    ): TransportRequestCallback;
    get<TContext = unknown>(
      params: T.TaskGetRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.TaskGetResponse, TContext>
    ): TransportRequestCallback;
    list<TContext = unknown>(
      params?: T.TaskListRequest,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse<T.TaskListResponse, TContext>>;
    list<TContext = unknown>(
      callback: callbackFn<T.TaskListResponse, TContext>
    ): TransportRequestCallback;
    list<TContext = unknown>(
      params: T.TaskListRequest,
      callback: callbackFn<T.TaskListResponse, TContext>
    ): TransportRequestCallback;
    list<TContext = unknown>(
      params: T.TaskListRequest,
      options: TransportRequestOptions,
      callback: callbackFn<T.TaskListResponse, TContext>
    ): TransportRequestCallback;
  };
  termsEnum<TContext = unknown>(
    params: T.TermsEnumRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.TermsEnumResponse, TContext>>;
  termsEnum<TContext = unknown>(
    params: T.TermsEnumRequest,
    callback: callbackFn<T.TermsEnumResponse, TContext>
  ): TransportRequestCallback;
  termsEnum<TContext = unknown>(
    params: T.TermsEnumRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.TermsEnumResponse, TContext>
  ): TransportRequestCallback;
  termvectors<TDocument = unknown, TContext = unknown>(
    params: T.TermvectorsRequest<TDocument>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.TermvectorsResponse, TContext>>;
  termvectors<TDocument = unknown, TContext = unknown>(
    params: T.TermvectorsRequest<TDocument>,
    callback: callbackFn<T.TermvectorsResponse, TContext>
  ): TransportRequestCallback;
  termvectors<TDocument = unknown, TContext = unknown>(
    params: T.TermvectorsRequest<TDocument>,
    options: TransportRequestOptions,
    callback: callbackFn<T.TermvectorsResponse, TContext>
  ): TransportRequestCallback;
  update<TDocumentR = unknown, TDocument = unknown, TPartialDocument = unknown, TContext = unknown>(
    params: T.UpdateRequest<TDocument, TPartialDocument>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.UpdateResponse<TDocumentR>, TContext>>;
  update<TDocumentR = unknown, TDocument = unknown, TPartialDocument = unknown, TContext = unknown>(
    params: T.UpdateRequest<TDocument, TPartialDocument>,
    callback: callbackFn<T.UpdateResponse<TDocumentR>, TContext>
  ): TransportRequestCallback;
  update<TDocumentR = unknown, TDocument = unknown, TPartialDocument = unknown, TContext = unknown>(
    params: T.UpdateRequest<TDocument, TPartialDocument>,
    options: TransportRequestOptions,
    callback: callbackFn<T.UpdateResponse<TDocumentR>, TContext>
  ): TransportRequestCallback;
  updateByQuery<TContext = unknown>(
    params: T.UpdateByQueryRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.UpdateByQueryResponse, TContext>>;
  updateByQuery<TContext = unknown>(
    params: T.UpdateByQueryRequest,
    callback: callbackFn<T.UpdateByQueryResponse, TContext>
  ): TransportRequestCallback;
  updateByQuery<TContext = unknown>(
    params: T.UpdateByQueryRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.UpdateByQueryResponse, TContext>
  ): TransportRequestCallback;
  updateByQueryRethrottle<TContext = unknown>(
    params: T.UpdateByQueryRethrottleRequest,
    options?: TransportRequestOptions
  ): TransportRequestPromise<ApiResponse<T.UpdateByQueryRethrottleResponse, TContext>>;
  updateByQueryRethrottle<TContext = unknown>(
    params: T.UpdateByQueryRethrottleRequest,
    callback: callbackFn<T.UpdateByQueryRethrottleResponse, TContext>
  ): TransportRequestCallback;
  updateByQueryRethrottle<TContext = unknown>(
    params: T.UpdateByQueryRethrottleRequest,
    options: TransportRequestOptions,
    callback: callbackFn<T.UpdateByQueryRethrottleResponse, TContext>
  ): TransportRequestCallback;
}

export * as opensearchtypes from './types';
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
  ClientOptions,
  NodeOptions,
  ClientExtendsCallbackOptions,
};
