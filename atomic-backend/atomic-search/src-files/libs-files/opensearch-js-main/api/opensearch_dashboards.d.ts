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
  Serializer,
  Transport,
  errors,
  RequestEvent,
  ResurrectEvent,
  ApiError
} from '../index'
import Helpers from '../lib/Helpers'
import {
  ApiResponse,
  TransportRequestPromise,
  TransportRequestParams,
  TransportRequestOptions
} from '../lib/Transport'
import * as T from './types'

/**
  * We are still working on this type, it will arrive soon.
  * If it's critical for you, please open an issue.
  * https://github.com/opensearch-project/opensearch-js/issues
  */
type TODO = Record<string, any>

// Extend API
interface ClientExtendsCallbackOptions {
  ConfigurationError: errors.ConfigurationError,
  makeRequest(params: TransportRequestParams, options?: TransportRequestOptions): Promise<void> | void;
  result: {
    body: null,
    statusCode: null,
    headers: null,
    warnings: null
  }
}
declare type extendsCallback = (options: ClientExtendsCallbackOptions) => any;
// /Extend API

interface OpenSearchDashboardsClient {
  connectionPool: ConnectionPool
  transport: Transport
  serializer: Serializer
  extend(method: string, fn: extendsCallback): void
  extend(method: string, opts: { force: boolean }, fn: extendsCallback): void;
  helpers: Helpers
  child(opts?: ClientOptions): OpenSearchDashboardsClient
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
  bulk<TSource = unknown, TContext = unknown>(params: T.BulkRequest<TSource>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.BulkResponse, TContext>>
  cat: {
    aliases<TContext = unknown>(params?: T.CatAliasesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatAliasesResponse, TContext>>
    allocation<TContext = unknown>(params?: T.CatAllocationRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatAllocationResponse, TContext>>
    cluster_manager<TContext = unknown>(params?: T.CatClusterManagerRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatClusterManagerResponse, TContext>>
    count<TContext = unknown>(params?: T.CatCountRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatCountResponse, TContext>>
    fielddata<TContext = unknown>(params?: T.CatFielddataRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatFielddataResponse, TContext>>
    health<TContext = unknown>(params?: T.CatHealthRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatHealthResponse, TContext>>
    help<TContext = unknown>(params?: T.CatHelpRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatHelpResponse, TContext>>
    indices<TContext = unknown>(params?: T.CatIndicesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatIndicesResponse, TContext>>
    /**
    * // TODO: delete cat.master when it is removed from OpenSearch
    * @deprecated use cat.cluster_manager instead
    */
    master<TContext = unknown>(params?: T.CatMasterRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatMasterResponse, TContext>>
    nodeattrs<TContext = unknown>(params?: T.CatNodeAttributesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatNodeAttributesResponse, TContext>>
    nodes<TContext = unknown>(params?: T.CatNodesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatNodesResponse, TContext>>
    pendingTasks<TContext = unknown>(params?: T.CatPendingTasksRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatPendingTasksResponse, TContext>>
    plugins<TContext = unknown>(params?: T.CatPluginsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatPluginsResponse, TContext>>
    recovery<TContext = unknown>(params?: T.CatRecoveryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatRecoveryResponse, TContext>>
    repositories<TContext = unknown>(params?: T.CatRepositoriesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatRepositoriesResponse, TContext>>
    segments<TContext = unknown>(params?: T.CatSegmentsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatSegmentsResponse, TContext>>
    shards<TContext = unknown>(params?: T.CatShardsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatShardsResponse, TContext>>
    snapshots<TContext = unknown>(params?: T.CatSnapshotsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatSnapshotsResponse, TContext>>
    tasks<TContext = unknown>(params?: T.CatTasksRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatTasksResponse, TContext>>
    templates<TContext = unknown>(params?: T.CatTemplatesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatTemplatesResponse, TContext>>
    threadPool<TContext = unknown>(params?: T.CatThreadPoolRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CatThreadPoolResponse, TContext>>
  }
  clearScroll<TContext = unknown>(params?: T.ClearScrollRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClearScrollResponse, TContext>>
  cluster: {
    allocationExplain<TContext = unknown>(params?: T.ClusterAllocationExplainRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterAllocationExplainResponse, TContext>>
    deleteComponentTemplate<TContext = unknown>(params: T.ClusterDeleteComponentTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterDeleteComponentTemplateResponse, TContext>>
    deleteVotingConfigExclusions<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    existsComponentTemplate<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    getComponentTemplate<TContext = unknown>(params?: T.ClusterGetComponentTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterGetComponentTemplateResponse, TContext>>
    getSettings<TContext = unknown>(params?: T.ClusterGetSettingsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterGetSettingsResponse, TContext>>
    health<TContext = unknown>(params?: T.ClusterHealthRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterHealthResponse, TContext>>
    pendingTasks<TContext = unknown>(params?: T.ClusterPendingTasksRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterPendingTasksResponse, TContext>>
    postVotingConfigExclusions<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    putComponentTemplate<TContext = unknown>(params: T.ClusterPutComponentTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterPutComponentTemplateResponse, TContext>>
    putSettings<TContext = unknown>(params?: T.ClusterPutSettingsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterPutSettingsResponse, TContext>>
    remoteInfo<TContext = unknown>(params?: T.ClusterRemoteInfoRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterRemoteInfoResponse, TContext>>
    reroute<TContext = unknown>(params?: T.ClusterRerouteRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterRerouteResponse, TContext>>
    state<TContext = unknown>(params?: T.ClusterStateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterStateResponse, TContext>>
    stats<TContext = unknown>(params?: T.ClusterStatsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ClusterStatsResponse, TContext>>
  }
  count<TContext = unknown>(params?: T.CountRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CountResponse, TContext>>
  create<TDocument = unknown, TContext = unknown>(params: T.CreateRequest<TDocument>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.CreateResponse, TContext>>
  danglingIndices: {
    deleteDanglingIndex<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    importDanglingIndex<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    listDanglingIndices<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
  }
  delete<TContext = unknown>(params: T.DeleteRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.DeleteResponse, TContext>>
  deleteByQuery<TContext = unknown>(params: T.DeleteByQueryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.DeleteByQueryResponse, TContext>>
  deleteByQueryRethrottle<TContext = unknown>(params: T.DeleteByQueryRethrottleRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.DeleteByQueryRethrottleResponse, TContext>>
  deleteScript<TContext = unknown>(params: T.DeleteScriptRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.DeleteScriptResponse, TContext>>
  exists<TContext = unknown>(params: T.ExistsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ExistsResponse, TContext>>
  existsSource<TContext = unknown>(params: T.ExistsSourceRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ExistsSourceResponse, TContext>>
  explain<TDocument = unknown, TContext = unknown>(params: T.ExplainRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ExplainResponse<TDocument>, TContext>>
  features: {
    getFeatures<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    resetFeatures<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
  }
  fieldCaps<TContext = unknown>(params?: T.FieldCapsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.FieldCapsResponse, TContext>>
  get<TDocument = unknown, TContext = unknown>(params: T.GetRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.GetResponse<TDocument>, TContext>>
  getScript<TContext = unknown>(params: T.GetScriptRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.GetScriptResponse, TContext>>
  getScriptContext<TContext = unknown>(params?: T.GetScriptContextRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.GetScriptContextResponse, TContext>>
  getScriptLanguages<TContext = unknown>(params?: T.GetScriptLanguagesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.GetScriptLanguagesResponse, TContext>>
  getSource<TDocument = unknown, TContext = unknown>(params?: T.GetSourceRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.GetSourceResponse<TDocument>, TContext>>
  index<TDocument = unknown, TContext = unknown>(params: T.IndexRequest<TDocument>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndexResponse, TContext>>
  indices: {
    addBlock<TContext = unknown>(params: T.IndicesAddBlockRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesAddBlockResponse, TContext>>
    analyze<TContext = unknown>(params?: T.IndicesAnalyzeRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesAnalyzeResponse, TContext>>
    clearCache<TContext = unknown>(params?: T.IndicesClearCacheRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesClearCacheResponse, TContext>>
    clone<TContext = unknown>(params: T.IndicesCloneRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesCloneResponse, TContext>>
    close<TContext = unknown>(params: T.IndicesCloseRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesCloseResponse, TContext>>
    create<TContext = unknown>(params: T.IndicesCreateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesCreateResponse, TContext>>
    delete<TContext = unknown>(params: T.IndicesDeleteRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesDeleteResponse, TContext>>
    deleteAlias<TContext = unknown>(params: T.IndicesDeleteAliasRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesDeleteAliasResponse, TContext>>
    deleteIndexTemplate<TContext = unknown>(params: T.IndicesDeleteIndexTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesDeleteIndexTemplateResponse, TContext>>
    deleteTemplate<TContext = unknown>(params: T.IndicesDeleteTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesDeleteTemplateResponse, TContext>>
    diskUsage<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    exists<TContext = unknown>(params: T.IndicesExistsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesExistsResponse, TContext>>
    existsAlias<TContext = unknown>(params: T.IndicesExistsAliasRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesExistsAliasResponse, TContext>>
    existsIndexTemplate<TContext = unknown>(params: T.IndicesExistsIndexTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesExistsIndexTemplateResponse, TContext>>
    existsTemplate<TContext = unknown>(params: T.IndicesExistsTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesExistsTemplateResponse, TContext>>
    fieldUsageStats<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    flush<TContext = unknown>(params?: T.IndicesFlushRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesFlushResponse, TContext>>
    forcemerge<TContext = unknown>(params?: T.IndicesForcemergeRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesForcemergeResponse, TContext>>
    get<TContext = unknown>(params: T.IndicesGetRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetResponse, TContext>>
    getAlias<TContext = unknown>(params?: T.IndicesGetAliasRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetAliasResponse, TContext>>
    getFieldMapping<TContext = unknown>(params: T.IndicesGetFieldMappingRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetFieldMappingResponse, TContext>>
    getIndexTemplate<TContext = unknown>(params?: T.IndicesGetIndexTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetIndexTemplateResponse, TContext>>
    getMapping<TContext = unknown>(params?: T.IndicesGetMappingRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetMappingResponse, TContext>>
    getSettings<TContext = unknown>(params?: T.IndicesGetSettingsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetSettingsResponse, TContext>>
    getTemplate<TContext = unknown>(params?: T.IndicesGetTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesGetTemplateResponse, TContext>>
    getUpgrade<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    open<TContext = unknown>(params: T.IndicesOpenRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesOpenResponse, TContext>>
    putAlias<TContext = unknown>(params: T.IndicesPutAliasRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesPutAliasResponse, TContext>>
    putIndexTemplate<TContext = unknown>(params: T.IndicesPutIndexTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesPutIndexTemplateResponse, TContext>>
    putMapping<TContext = unknown>(params?: T.IndicesPutMappingRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesPutMappingResponse, TContext>>
    putSettings<TContext = unknown>(params?: T.IndicesPutSettingsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesPutSettingsResponse, TContext>>
    putTemplate<TContext = unknown>(params: T.IndicesPutTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesPutTemplateResponse, TContext>>
    recovery<TContext = unknown>(params?: T.IndicesRecoveryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesRecoveryResponse, TContext>>
    refresh<TContext = unknown>(params?: T.IndicesRefreshRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesRefreshResponse, TContext>>
    resolveIndex<TContext = unknown>(params: T.IndicesResolveIndexRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesResolveIndexResponse, TContext>>
    rollover<TContext = unknown>(params: T.IndicesRolloverRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesRolloverResponse, TContext>>
    segments<TContext = unknown>(params?: T.IndicesSegmentsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesSegmentsResponse, TContext>>
    shardStores<TContext = unknown>(params?: T.IndicesShardStoresRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesShardStoresResponse, TContext>>
    shrink<TContext = unknown>(params: T.IndicesShrinkRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesShrinkResponse, TContext>>
    simulateIndexTemplate<TContext = unknown>(params?: T.IndicesSimulateIndexTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesSimulateIndexTemplateResponse, TContext>>
    simulateTemplate<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    split<TContext = unknown>(params: T.IndicesSplitRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesSplitResponse, TContext>>
    stats<TContext = unknown>(params?: T.IndicesStatsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesStatsResponse, TContext>>
    updateAliases<TContext = unknown>(params?: T.IndicesUpdateAliasesRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesUpdateAliasesResponse, TContext>>
    upgrade<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    validateQuery<TContext = unknown>(params?: T.IndicesValidateQueryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IndicesValidateQueryResponse, TContext>>
  }
  info<TContext = unknown>(params?: T.InfoRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.InfoResponse, TContext>>
  ingest: {
    deletePipeline<TContext = unknown>(params: T.IngestDeletePipelineRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IngestDeletePipelineResponse, TContext>>
    geoIpStats<TContext = unknown>(params?: T.IngestGeoIpStatsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IngestGeoIpStatsResponse, TContext>>
    getPipeline<TContext = unknown>(params?: T.IngestGetPipelineRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IngestGetPipelineResponse, TContext>>
    processorGrok<TContext = unknown>(params?: T.IngestProcessorGrokRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IngestProcessorGrokResponse, TContext>>
    putPipeline<TContext = unknown>(params: T.IngestPutPipelineRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IngestPutPipelineResponse, TContext>>
    simulate<TContext = unknown>(params?: T.IngestSimulatePipelineRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.IngestSimulatePipelineResponse, TContext>>
  }
  mget<TDocument = unknown, TContext = unknown>(params?: T.MgetRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.MgetResponse<TDocument>, TContext>>
  msearch<TDocument = unknown, TContext = unknown>(params?: T.MsearchRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.MsearchResponse<TDocument>, TContext>>
  msearchTemplate<TDocument = unknown, TContext = unknown>(params?: T.MsearchTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.MsearchTemplateResponse<TDocument>, TContext>>
  mtermvectors<TContext = unknown>(params?: T.MtermvectorsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.MtermvectorsResponse, TContext>>
  nodes: {
    clearMeteringArchive<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    getMeteringInfo<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    hotThreads<TContext = unknown>(params?: T.NodesHotThreadsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.NodesHotThreadsResponse, TContext>>
    info<TContext = unknown>(params?: T.NodesInfoRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.NodesInfoResponse, TContext>>
    reloadSecureSettings<TContext = unknown>(params?: T.NodesReloadSecureSettingsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.NodesReloadSecureSettingsResponse, TContext>>
    stats<TContext = unknown>(params?: T.NodesStatsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.NodesStatsResponse, TContext>>
    usage<TContext = unknown>(params?: T.NodesUsageRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.NodesUsageResponse, TContext>>
  }
  ping<TContext = unknown>(params?: T.PingRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.PingResponse, TContext>>
  putScript<TContext = unknown>(params: T.PutScriptRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.PutScriptResponse, TContext>>
  rankEval<TContext = unknown>(params: T.RankEvalRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.RankEvalResponse, TContext>>
  reindex<TContext = unknown>(params?: T.ReindexRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ReindexResponse, TContext>>
  reindexRethrottle<TContext = unknown>(params: T.ReindexRethrottleRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ReindexRethrottleResponse, TContext>>
  renderSearchTemplate<TContext = unknown>(params?: T.RenderSearchTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.RenderSearchTemplateResponse, TContext>>
  scriptsPainlessExecute<TResult = unknown, TContext = unknown>(params?: T.ScriptsPainlessExecuteRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ScriptsPainlessExecuteResponse<TResult>, TContext>>
  scroll<TDocument = unknown, TContext = unknown>(params?: T.ScrollRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.ScrollResponse<TDocument>, TContext>>
  search<TDocument = unknown, TContext = unknown>(params?: T.SearchRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SearchResponse<TDocument>, TContext>>
  searchShards<TContext = unknown>(params?: T.SearchShardsRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SearchShardsResponse, TContext>>
  searchTemplate<TDocument = unknown, TContext = unknown>(params?: T.SearchTemplateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SearchTemplateResponse<TDocument>, TContext>>
  shutdown: {
    deleteNode<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    getNode<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    putNode<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
  }
  snapshot: {
    cleanupRepository<TContext = unknown>(params: T.SnapshotCleanupRepositoryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotCleanupRepositoryResponse, TContext>>
    clone<TContext = unknown>(params: T.SnapshotCloneRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotCloneResponse, TContext>>
    create<TContext = unknown>(params: T.SnapshotCreateRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotCreateResponse, TContext>>
    createRepository<TContext = unknown>(params: T.SnapshotCreateRepositoryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotCreateRepositoryResponse, TContext>>
    delete<TContext = unknown>(params: T.SnapshotDeleteRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotDeleteResponse, TContext>>
    deleteRepository<TContext = unknown>(params: T.SnapshotDeleteRepositoryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotDeleteRepositoryResponse, TContext>>
    get<TContext = unknown>(params: T.SnapshotGetRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotGetResponse, TContext>>
    getRepository<TContext = unknown>(params?: T.SnapshotGetRepositoryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotGetRepositoryResponse, TContext>>
    repositoryAnalyze<TContext = unknown>(params?: TODO, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<TODO, TContext>>
    restore<TContext = unknown>(params: T.SnapshotRestoreRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotRestoreResponse, TContext>>
    status<TContext = unknown>(params?: T.SnapshotStatusRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotStatusResponse, TContext>>
    verifyRepository<TContext = unknown>(params: T.SnapshotVerifyRepositoryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.SnapshotVerifyRepositoryResponse, TContext>>
  }
  tasks: {
    cancel<TContext = unknown>(params?: T.TaskCancelRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.TaskCancelResponse, TContext>>
    get<TContext = unknown>(params: T.TaskGetRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.TaskGetResponse, TContext>>
    list<TContext = unknown>(params?: T.TaskListRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.TaskListResponse, TContext>>
  }
  termsEnum<TContext = unknown>(params: T.TermsEnumRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.TermsEnumResponse, TContext>>
  termvectors<TDocument = unknown, TContext = unknown>(params: T.TermvectorsRequest<TDocument>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.TermvectorsResponse, TContext>>
  update<TDocumentR = unknown, TDocument = unknown, TPartialDocument = unknown, TContext = unknown>(params: T.UpdateRequest<TDocument, TPartialDocument>, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.UpdateResponse<TDocumentR>, TContext>>
  updateByQuery<TContext = unknown>(params: T.UpdateByQueryRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.UpdateByQueryResponse, TContext>>
  updateByQueryRethrottle<TContext = unknown>(params: T.UpdateByQueryRethrottleRequest, options?: TransportRequestOptions): TransportRequestPromise<ApiResponse<T.UpdateByQueryRethrottleResponse, TContext>>
}

export { OpenSearchDashboardsClient }
