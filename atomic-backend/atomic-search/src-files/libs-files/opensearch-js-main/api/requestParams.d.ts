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

import { RequestBody, RequestNDBody } from '../lib/Transport';

export interface Generic {
  method?: string;
  filter_path?: string | string[];
  pretty?: boolean;
  human?: boolean;
  error_trace?: boolean;
  source?: string;
}
export interface Bulk<T = RequestNDBody> extends Generic {
  index?: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  wait_for_active_shards?: string;
  refresh?: 'wait_for' | boolean;
  routing?: string;
  timeout?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  pipeline?: string;
  require_alias?: boolean;
  body: T;
}

export interface CatAliases extends Generic {
  name?: string | string[];
  format?: string;
  local?: boolean;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface CatAllocation extends Generic {
  node_id?: string | string[];
  format?: string;
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatCount extends Generic {
  index?: string | string[];
  format?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatFielddata extends Generic {
  fields?: string | string[];
  format?: string;
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatHealth extends Generic {
  format?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  ts?: boolean;
  v?: boolean;
}

export interface CatHelp extends Generic {
  help?: boolean;
  s?: string | string[];
}

export interface CatIndices extends Generic {
  index?: string | string[];
  format?: string;
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  health?: 'green' | 'yellow' | 'red';
  help?: boolean;
  pri?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
  include_unloaded_segments?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface CatClusterManager extends Generic {
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

/**
* // TODO: delete CatMaster interface when it is removed from OpenSearch
* @deprecated use CatClusterManager instead
*/
export interface CatMaster extends Generic {
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatNodeattrs extends Generic {
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatNodes extends Generic {
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  format?: string;
  full_id?: boolean;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
  include_unloaded_segments?: boolean;
}

export interface CatPendingTasks extends Generic {
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
}

export interface CatPlugins extends Generic {
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  include_bootstrap?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatRecovery extends Generic {
  index?: string | string[];
  format?: string;
  active_only?: boolean;
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  detailed?: boolean;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
}

export interface CatRepositories extends Generic {
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatSegments extends Generic {
  index?: string | string[];
  format?: string;
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatShards extends Generic {
  index?: string | string[];
  format?: string;
  bytes?: 'b' | 'k' | 'kb' | 'm' | 'mb' | 'g' | 'gb' | 't' | 'tb' | 'p' | 'pb';
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
}

export interface CatSnapshots extends Generic {
  repository?: string | string[];
  format?: string;
  ignore_unavailable?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
}

export interface CatTasks extends Generic {
  format?: string;
  nodes?: string | string[];
  actions?: string | string[];
  detailed?: boolean;
  parent_task_id?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  time?: 'd' | 'h' | 'm' | 's' | 'ms' | 'micros' | 'nanos';
  v?: boolean;
}

export interface CatTemplates extends Generic {
  name?: string;
  format?: string;
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface CatThreadPool extends Generic {
  thread_pool_patterns?: string | string[];
  format?: string;
  size?: '' | 'k' | 'm' | 'g' | 't' | 'p';
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  h?: string | string[];
  help?: boolean;
  s?: string | string[];
  v?: boolean;
}

export interface ClearScroll<T = RequestBody> extends Generic {
  scroll_id?: string | string[];
  body?: T;
}

export interface ClusterAllocationExplain<T = RequestBody> extends Generic {
  include_yes_decisions?: boolean;
  include_disk_info?: boolean;
  body?: T;
}

export interface ClusterDeleteComponentTemplate extends Generic {
  name: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface ClusterDeleteVotingConfigExclusions extends Generic {
  wait_for_removal?: boolean;
}

export interface ClusterExistsComponentTemplate extends Generic {
  name: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface ClusterGetComponentTemplate extends Generic {
  name?: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface ClusterGetSettings extends Generic {
  flat_settings?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  include_defaults?: boolean;
}

export interface ClusterHealth extends Generic {
  index?: string | string[];
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  level?: 'cluster' | 'indices' | 'shards';
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  wait_for_active_shards?: string;
  wait_for_nodes?: string;
  wait_for_events?: 'immediate' | 'urgent' | 'high' | 'normal' | 'low' | 'languid';
  wait_for_no_relocating_shards?: boolean;
  wait_for_no_initializing_shards?: boolean;
  wait_for_status?: 'green' | 'yellow' | 'red';
}

export interface ClusterPendingTasks extends Generic {
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface ClusterPostVotingConfigExclusions extends Generic {
  node_ids?: string;
  node_names?: string;
  timeout?: string;
}

export interface ClusterPutComponentTemplate<T = RequestBody> extends Generic {
  name: string;
  create?: boolean;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body: T;
}

export interface ClusterPutSettings<T = RequestBody> extends Generic {
  flat_settings?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  body: T;
}

export interface ClusterRemoteInfo extends Generic { }

export interface ClusterReroute<T = RequestBody> extends Generic {
  dry_run?: boolean;
  explain?: boolean;
  retry_failed?: boolean;
  metric?: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  body?: T;
}

export interface ClusterState extends Generic {
  index?: string | string[];
  metric?: string | string[];
  local?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  flat_settings?: boolean;
  wait_for_metadata_version?: number;
  wait_for_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface ClusterStats extends Generic {
  node_id?: string | string[];
  flat_settings?: boolean;
  timeout?: string;
}

export interface Count<T = RequestBody> extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  ignore_throttled?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  min_score?: number;
  preference?: string;
  routing?: string | string[];
  q?: string;
  analyzer?: string;
  analyze_wildcard?: boolean;
  default_operator?: 'AND' | 'OR';
  df?: string;
  lenient?: boolean;
  terminate_after?: number;
  body?: T;
}

export interface Create<T = RequestBody> extends Generic {
  id: string;
  index: string;
  wait_for_active_shards?: string;
  refresh?: 'wait_for' | boolean;
  routing?: string;
  timeout?: string;
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte';
  pipeline?: string;
  body: T;
}

export interface DanglingIndicesDeleteDanglingIndex extends Generic {
  index_uuid: string;
  accept_data_loss?: boolean;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface DanglingIndicesImportDanglingIndex extends Generic {
  index_uuid: string;
  accept_data_loss?: boolean;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface DanglingIndicesListDanglingIndices extends Generic { }

export interface Delete extends Generic {
  id: string;
  index: string;
  wait_for_active_shards?: string;
  refresh?: 'wait_for' | boolean;
  routing?: string;
  timeout?: string;
  if_seq_no?: number;
  if_primary_term?: number;
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface DeleteByQuery<T = RequestBody> extends Generic {
  index: string | string[];
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  analyzer?: string;
  analyze_wildcard?: boolean;
  default_operator?: 'AND' | 'OR';
  df?: string;
  from?: number;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  conflicts?: 'abort' | 'proceed';
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  lenient?: boolean;
  preference?: string;
  q?: string;
  routing?: string | string[];
  scroll?: string;
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  search_timeout?: string;
  size?: number;
  max_docs?: number;
  sort?: string | string[];
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  terminate_after?: number;
  stats?: string | string[];
  version?: boolean;
  request_cache?: boolean;
  refresh?: boolean;
  timeout?: string;
  wait_for_active_shards?: string;
  scroll_size?: number;
  wait_for_completion?: boolean;
  requests_per_second?: number;
  slices?: number | string;
  body: T;
}

export interface DeleteByQueryRethrottle extends Generic {
  task_id: string;
  requests_per_second: number;
}

export interface DeleteScript extends Generic {
  id: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface Exists extends Generic {
  id: string;
  index: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  stored_fields?: string | string[];
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  routing?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface ExistsSource extends Generic {
  id: string;
  index: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  routing?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface Explain<T = RequestBody> extends Generic {
  id: string;
  index: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  analyze_wildcard?: boolean;
  analyzer?: string;
  default_operator?: 'AND' | 'OR';
  df?: string;
  stored_fields?: string | string[];
  lenient?: boolean;
  preference?: string;
  q?: string;
  routing?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  body?: T;
}

export interface FeaturesGetFeatures extends Generic {
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface FeaturesResetFeatures extends Generic { }

export interface FieldCaps<T = RequestBody> extends Generic {
  index?: string | string[];
  fields?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  include_unmapped?: boolean;
  body?: T;
}

export interface Get extends Generic {
  id: string;
  index: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  stored_fields?: string | string[];
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  routing?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface GetScript extends Generic {
  id: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface GetScriptContext extends Generic { }

export interface GetScriptLanguages extends Generic { }

export interface GetSource extends Generic {
  id: string;
  index: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  routing?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
}

export interface Index<T = RequestBody> extends Generic {
  id?: string;
  index: string;
  wait_for_active_shards?: string;
  op_type?: 'index' | 'create';
  refresh?: 'wait_for' | boolean;
  routing?: string;
  timeout?: string;
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte';
  if_seq_no?: number;
  if_primary_term?: number;
  pipeline?: string;
  require_alias?: boolean;
  body: T;
}

export interface IndicesAddBlock extends Generic {
  index: string | string[];
  block: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesAnalyze<T = RequestBody> extends Generic {
  index?: string;
  body?: T;
}

export interface IndicesClearCache extends Generic {
  index?: string | string[];
  fielddata?: boolean;
  fields?: string | string[];
  query?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  request?: boolean;
}

export interface IndicesClone<T = RequestBody> extends Generic {
  index: string;
  target: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  wait_for_active_shards?: string;
  body?: T;
}

export interface IndicesClose extends Generic {
  index: string | string[];
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  wait_for_active_shards?: string;
}

export interface IndicesCreate<T = RequestBody> extends Generic {
  index: string;
  wait_for_active_shards?: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body?: T;
}

export interface IndicesDelete extends Generic {
  index: string | string[];
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesDeleteAlias extends Generic {
  index: string | string[];
  name: string | string[];
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface IndicesDeleteIndexTemplate extends Generic {
  name: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface IndicesDeleteTemplate extends Generic {
  name: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface IndicesDiskUsage extends Generic {
  index: string;
  run_expensive_tasks?: boolean;
  flush?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesExists extends Generic {
  index: string | string[];
  local?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  flat_settings?: boolean;
  include_defaults?: boolean;
}

export interface IndicesExistsAlias extends Generic {
  name: string | string[];
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  local?: boolean;
}

export interface IndicesExistsIndexTemplate extends Generic {
  name: string;
  flat_settings?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface IndicesExistsTemplate extends Generic {
  name: string | string[];
  flat_settings?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface IndicesFieldUsageStats extends Generic {
  index: string;
  fields?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesFlush extends Generic {
  index?: string | string[];
  force?: boolean;
  wait_if_ongoing?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesForcemerge extends Generic {
  index?: string | string[];
  flush?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  max_num_segments?: number;
  only_expunge_deletes?: boolean;
}

export interface IndicesGet extends Generic {
  index: string | string[];
  local?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  flat_settings?: boolean;
  include_defaults?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface IndicesGetAlias extends Generic {
  name?: string | string[];
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  local?: boolean;
}

export interface IndicesGetFieldMapping extends Generic {
  fields: string | string[];
  index?: string | string[];
  include_defaults?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  local?: boolean;
}

export interface IndicesGetIndexTemplate extends Generic {
  name?: string | string[];
  flat_settings?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface IndicesGetMapping extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface IndicesGetSettings extends Generic {
  index?: string | string[];
  name?: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  flat_settings?: boolean;
  local?: boolean;
  include_defaults?: boolean;
}

export interface IndicesGetTemplate extends Generic {
  name?: string | string[];
  flat_settings?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface IndicesGetUpgrade extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesOpen extends Generic {
  index: string | string[];
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  wait_for_active_shards?: string;
}

export interface IndicesPutAlias<T = RequestBody> extends Generic {
  index: string | string[];
  name: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body?: T;
}

export interface IndicesPutIndexTemplate<T = RequestBody> extends Generic {
  name: string;
  create?: boolean;
  cause?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body: T;
}

export interface IndicesPutMapping<T = RequestBody> extends Generic {
  index?: string | string[];
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  write_index_only?: boolean;
  body: T;
}

export interface IndicesPutSettings<T = RequestBody> extends Generic {
  index?: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  preserve_existing?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  flat_settings?: boolean;
  body: T;
}

export interface IndicesPutTemplate<T = RequestBody> extends Generic {
  name: string;
  order?: number;
  create?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body: T;
}

export interface IndicesRecovery extends Generic {
  index?: string | string[];
  detailed?: boolean;
  active_only?: boolean;
}

export interface IndicesRefresh extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesResolveIndex extends Generic {
  name: string | string[];
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesRollover<T = RequestBody> extends Generic {
  alias: string;
  new_index?: string;
  timeout?: string;
  dry_run?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  wait_for_active_shards?: string;
  body?: T;
}

export interface IndicesSegments extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  verbose?: boolean;
}

export interface IndicesShardStores extends Generic {
  index?: string | string[];
  status?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface IndicesShrink<T = RequestBody> extends Generic {
  index: string;
  target: string;
  copy_settings?: boolean;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  wait_for_active_shards?: string;
  body?: T;
}

export interface IndicesSimulateIndexTemplate<T = RequestBody> extends Generic {
  name: string;
  create?: boolean;
  cause?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body?: T;
}

export interface IndicesSimulateTemplate<T = RequestBody> extends Generic {
  name?: string;
  create?: boolean;
  cause?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body?: T;
}

export interface IndicesSplit<T = RequestBody> extends Generic {
  index: string;
  target: string;
  copy_settings?: boolean;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  wait_for_active_shards?: string;
  body?: T;
}

export interface IndicesStats extends Generic {
  metric?: string | string[];
  index?: string | string[];
  completion_fields?: string | string[];
  fielddata_fields?: string | string[];
  fields?: string | string[];
  groups?: string | string[];
  level?: 'cluster' | 'indices' | 'shards';
  types?: string | string[];
  include_segment_file_sizes?: boolean;
  include_unloaded_segments?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  forbid_closed_indices?: boolean;
}

export interface IndicesUpdateAliases<T = RequestBody> extends Generic {
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body: T;
}

export interface IndicesUpgrade extends Generic {
  index?: string | string[];
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  ignore_unavailable?: boolean;
  wait_for_completion?: boolean;
  only_ancient_segments?: boolean;
}

export interface IndicesValidateQuery<T = RequestBody> extends Generic {
  index?: string | string[];
  explain?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  q?: string;
  analyzer?: string;
  analyze_wildcard?: boolean;
  default_operator?: 'AND' | 'OR';
  df?: string;
  lenient?: boolean;
  rewrite?: boolean;
  all_shards?: boolean;
  body?: T;
}

export interface Info extends Generic { }

export interface IngestDeletePipeline extends Generic {
  id: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
}

export interface IngestGeoIpStats extends Generic { }

export interface IngestGetPipeline extends Generic {
  id?: string;
  summary?: boolean;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface IngestProcessorGrok extends Generic { }

export interface IngestPutPipeline<T = RequestBody> extends Generic {
  id: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  body: T;
}

export interface IngestSimulate<T = RequestBody> extends Generic {
  id?: string;
  verbose?: boolean;
  body: T;
}

export interface Mget<T = RequestBody> extends Generic {
  index?: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  stored_fields?: string | string[];
  preference?: string;
  realtime?: boolean;
  refresh?: boolean;
  routing?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  body: T;
}

export interface Msearch<T = RequestNDBody> extends Generic {
  index?: string | string[];
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  max_concurrent_searches?: number;
  typed_keys?: boolean;
  pre_filter_shard_size?: number;
  max_concurrent_shard_requests?: number;
  rest_total_hits_as_int?: boolean;
  ccs_minimize_roundtrips?: boolean;
  body: T;
}

export interface MsearchTemplate<T = RequestNDBody> extends Generic {
  index?: string | string[];
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  typed_keys?: boolean;
  max_concurrent_searches?: number;
  rest_total_hits_as_int?: boolean;
  ccs_minimize_roundtrips?: boolean;
  body: T;
}

export interface Mtermvectors<T = RequestBody> extends Generic {
  index?: string;
  ids?: string | string[];
  term_statistics?: boolean;
  field_statistics?: boolean;
  fields?: string | string[];
  offsets?: boolean;
  positions?: boolean;
  payloads?: boolean;
  preference?: string;
  routing?: string;
  realtime?: boolean;
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
  body?: T;
}

export interface NodesClearMeteringArchive extends Generic {
  node_id: string | string[];
  max_archive_version: number;
}

export interface NodesGetMeteringInfo extends Generic {
  node_id: string | string[];
}

export interface NodesHotThreads extends Generic {
  node_id?: string | string[];
  interval?: string;
  snapshots?: number;
  threads?: number;
  ignore_idle_threads?: boolean;
  type?: 'cpu' | 'wait' | 'block';
  timeout?: string;
}

export interface NodesInfo extends Generic {
  node_id?: string | string[];
  metric?: string | string[];
  flat_settings?: boolean;
  timeout?: string;
}

export interface NodesReloadSecureSettings<T = RequestBody> extends Generic {
  node_id?: string | string[];
  timeout?: string;
  body?: T;
}

export interface NodesStats extends Generic {
  node_id?: string | string[];
  metric?: string | string[];
  index_metric?: string | string[];
  completion_fields?: string | string[];
  fielddata_fields?: string | string[];
  fields?: string | string[];
  groups?: boolean;
  level?: 'indices' | 'node' | 'shards';
  types?: string | string[];
  timeout?: string;
  include_segment_file_sizes?: boolean;
  include_unloaded_segments?: boolean;
}

export interface NodesUsage extends Generic {
  node_id?: string | string[];
  metric?: string | string[];
  timeout?: string;
}

export interface Ping extends Generic { }

export interface PutScript<T = RequestBody> extends Generic {
  id: string;
  context?: string;
  timeout?: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body: T;
}

export interface RankEval<T = RequestBody> extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  body: T;
}

export interface Reindex<T = RequestBody> extends Generic {
  refresh?: boolean;
  timeout?: string;
  wait_for_active_shards?: string;
  wait_for_completion?: boolean;
  requests_per_second?: number;
  scroll?: string;
  slices?: number | string;
  max_docs?: number;
  body: T;
}

export interface ReindexRethrottle extends Generic {
  task_id: string;
  requests_per_second: number;
}

export interface RenderSearchTemplate<T = RequestBody> extends Generic {
  id?: string;
  body?: T;
}

export interface ScriptsPainlessExecute<T = RequestBody> extends Generic {
  body?: T;
}

export interface Scroll<T = RequestBody> extends Generic {
  scroll_id?: string;
  scroll?: string;
  rest_total_hits_as_int?: boolean;
  body?: T;
}

export interface Search<T = RequestBody> extends Generic {
  index?: string | string[];
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  analyzer?: string;
  analyze_wildcard?: boolean;
  ccs_minimize_roundtrips?: boolean;
  default_operator?: 'AND' | 'OR';
  df?: string;
  explain?: boolean;
  stored_fields?: string | string[];
  docvalue_fields?: string | string[];
  from?: number;
  ignore_unavailable?: boolean;
  ignore_throttled?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  lenient?: boolean;
  preference?: string;
  q?: string;
  routing?: string | string[];
  scroll?: string;
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  size?: number;
  sort?: string | string[];
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  terminate_after?: number;
  stats?: string | string[];
  suggest_field?: string;
  suggest_mode?: 'missing' | 'popular' | 'always';
  suggest_size?: number;
  suggest_text?: string;
  timeout?: string;
  track_scores?: boolean;
  track_total_hits?: boolean;
  allow_partial_search_results?: boolean;
  typed_keys?: boolean;
  version?: boolean;
  seq_no_primary_term?: boolean;
  request_cache?: boolean;
  batched_reduce_size?: number;
  max_concurrent_shard_requests?: number;
  pre_filter_shard_size?: number;
  rest_total_hits_as_int?: boolean;
  min_compatible_shard_node?: string;
  body?: T;
}

export interface SearchShards extends Generic {
  index?: string | string[];
  preference?: string;
  routing?: string;
  local?: boolean;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
}

export interface SearchTemplate<T = RequestBody> extends Generic {
  index?: string | string[];
  ignore_unavailable?: boolean;
  ignore_throttled?: boolean;
  allow_no_indices?: boolean;
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  preference?: string;
  routing?: string | string[];
  scroll?: string;
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  explain?: boolean;
  profile?: boolean;
  typed_keys?: boolean;
  rest_total_hits_as_int?: boolean;
  ccs_minimize_roundtrips?: boolean;
  body: T;
}

export interface ShutdownDeleteNode extends Generic {
  node_id: string;
}

export interface ShutdownGetNode extends Generic {
  node_id?: string;
}

export interface ShutdownPutNode<T = RequestBody> extends Generic {
  node_id: string;
  body: T;
}

export interface SnapshotCleanupRepository extends Generic {
  repository: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
}

export interface SnapshotClone<T = RequestBody> extends Generic {
  repository: string;
  snapshot: string;
  target_snapshot: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  body: T;
}

export interface SnapshotCreate<T = RequestBody> extends Generic {
  repository: string;
  snapshot: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  wait_for_completion?: boolean;
  body?: T;
}

export interface SnapshotCreateRepository<T = RequestBody> extends Generic {
  repository: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
  verify?: boolean;
  body: T;
}

export interface SnapshotDelete extends Generic {
  repository: string;
  snapshot: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
}

export interface SnapshotDeleteRepository extends Generic {
  repository: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
}

export interface SnapshotGet extends Generic {
  repository: string;
  snapshot: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
  index_details?: boolean;
  include_repository?: boolean;
  verbose?: boolean;
}

export interface SnapshotGetRepository extends Generic {
  repository?: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  local?: boolean;
}

export interface SnapshotRepositoryAnalyze extends Generic {
  repository: string;
  blob_count?: number;
  concurrency?: number;
  read_node_count?: number;
  early_read_node_count?: number;
  seed?: number;
  rare_action_probability?: number;
  max_blob_size?: string;
  max_total_data_size?: string;
  timeout?: string;
  detailed?: boolean;
  rarely_abort_writes?: boolean;
}

export interface SnapshotRestore<T = RequestBody> extends Generic {
  repository: string;
  snapshot: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  wait_for_completion?: boolean;
  body?: T;
}

export interface SnapshotStatus extends Generic {
  repository?: string;
  snapshot?: string | string[];
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  ignore_unavailable?: boolean;
}

export interface SnapshotVerifyRepository extends Generic {
  repository: string;
  cluster_manager_timeout?: string;
  /**
  * @deprecated use cluster_manager_timeout instead
  */
  master_timeout?: string;
  timeout?: string;
}

export interface TasksCancel extends Generic {
  task_id?: string;
  nodes?: string | string[];
  actions?: string | string[];
  parent_task_id?: string;
  wait_for_completion?: boolean;
}

export interface TasksGet extends Generic {
  task_id: string;
  wait_for_completion?: boolean;
  timeout?: string;
}

export interface TasksList extends Generic {
  nodes?: string | string[];
  actions?: string | string[];
  detailed?: boolean;
  parent_task_id?: string;
  wait_for_completion?: boolean;
  group_by?: 'nodes' | 'parents' | 'none';
  timeout?: string;
}

export interface TermsEnum<T = RequestBody> extends Generic {
  index: string | string[];
  body?: T;
}

export interface Termvectors<T = RequestBody> extends Generic {
  index: string;
  id?: string;
  term_statistics?: boolean;
  field_statistics?: boolean;
  fields?: string | string[];
  offsets?: boolean;
  positions?: boolean;
  payloads?: boolean;
  preference?: string;
  routing?: string;
  realtime?: boolean;
  version?: number;
  version_type?: 'internal' | 'external' | 'external_gte' | 'force';
  body?: T;
}

export interface Update<T = RequestBody> extends Generic {
  id: string;
  index: string;
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  wait_for_active_shards?: string;
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  lang?: string;
  refresh?: 'wait_for' | boolean;
  retry_on_conflict?: number;
  routing?: string;
  timeout?: string;
  if_seq_no?: number;
  if_primary_term?: number;
  require_alias?: boolean;
  body: T;
}

export interface UpdateByQuery<T = RequestBody> extends Generic {
  index: string | string[];
  _source_exclude?: string | string[];
  _source_include?: string | string[];
  analyzer?: string;
  analyze_wildcard?: boolean;
  default_operator?: 'AND' | 'OR';
  df?: string;
  from?: number;
  ignore_unavailable?: boolean;
  allow_no_indices?: boolean;
  conflicts?: 'abort' | 'proceed';
  expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
  lenient?: boolean;
  pipeline?: string;
  preference?: string;
  q?: string;
  routing?: string | string[];
  scroll?: string;
  search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
  search_timeout?: string;
  size?: number;
  max_docs?: number;
  sort?: string | string[];
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string | string[];
  terminate_after?: number;
  stats?: string | string[];
  version?: boolean;
  version_type?: boolean;
  request_cache?: boolean;
  refresh?: boolean;
  timeout?: string;
  wait_for_active_shards?: string;
  scroll_size?: number;
  wait_for_completion?: boolean;
  requests_per_second?: number;
  slices?: number | string;
  body?: T;
}

export interface UpdateByQueryRethrottle extends Generic {
  task_id: string;
  requests_per_second: number;
}
