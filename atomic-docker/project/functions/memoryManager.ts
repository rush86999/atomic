// Manages the interaction between Short-Term Memory (STM) and Long-Term Memory (LTM) stored in LanceDB.

import * as lancedb from '@lancedb/lancedb'; // For LanceDB connection type
import {
  getConversationStateSnapshot, // Assuming this is how we might get a state if not passed directly
  updateUserGoal,
  updateIntentAndEntities,
  // Add other relevant action imports from conversationState.ts as needed
} from './conversationState'; // Adjust path as necessary
import type { ConversationState } from './conversationState'; // Import type
import { addRecord, searchTable } from './lanceDBManager'; // Import DB interaction functions
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import OpenAI from 'openai'; // Added OpenAI import

// NOTE: DEFAULT_VECTOR_DIMENSION is 768 here, but was changed to 1536 in lanceDBManager.ts
// This needs to be consistent. Assuming 1536 is the target.
const DEFAULT_VECTOR_DIMENSION = 1536;

// Initialize OpenAI Client
const openaiApiKey = process.env.OPENAI_API_KEY;
let openaiClient: OpenAI | null = null;
if (openaiApiKey) {
    openaiClient = new OpenAI({ apiKey: openaiApiKey });
    console.log('[MemoryManager] OpenAI client initialized.');
} else {
    console.error('[MemoryManager] OPENAI_API_KEY not found in environment variables. Real embeddings will not be generated by TS side MemoryManager.');
}

function log(message: string, level: 'info' | 'error' = 'info', data?: any) {
  const prefix = `[MemoryManager] ${new Date().toISOString()}`;
  if (level === 'error') {
    console.error(`${prefix} [ERROR]: ${message}`, data || '');
  } else {
    console.log(`${prefix}: ${message}`, data || '');
  }
}

/**
 * Placeholder for generating embeddings.
 * In a real implementation, this would call an actual embedding model.
 * @param text The text to embed.
 * @returns A promise that resolves to a vector (array of numbers) or null if an error occurs.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openaiClient) {
    log('[MemoryManager] OpenAI client not initialized. Cannot generate real embedding. Returning null.', 'error');
    return null;
  }
  if (!text || text.trim() === "") {
    log('[MemoryManager] generateEmbedding called with empty or whitespace-only text. Returning null.', 'warn');
    return null;
  }

  const trimmedText = text.trim();
  log(`Generating OpenAI embedding for text (first 50 chars): "${trimmedText.substring(0, 50)}..."`);

  try {
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002", // This model outputs 1536 dimensions
      input: trimmedText,
    });
    if (response.data && response.data.length > 0 && response.data[0].embedding) {
      log(`Successfully generated OpenAI embedding. Dimension: ${response.data[0].embedding.length}`);
      if (response.data[0].embedding.length !== DEFAULT_VECTOR_DIMENSION) {
        log(`[MemoryManager] WARNING: OpenAI embedding dimension (${response.data[0].embedding.length}) does not match DEFAULT_VECTOR_DIMENSION (${DEFAULT_VECTOR_DIMENSION}). Check model and config.`, 'warn');
      }
      return response.data[0].embedding;
    } else {
      log('[MemoryManager] OpenAI embedding response is missing expected data.', 'error', response);
      return null;
    }
  } catch (error) {
    log('[MemoryManager] Error generating OpenAI embedding:', 'error', error);
    return null;
  }
}

export interface LtmQueryResult {
  id: string;
  text: string; // Could be summary, fact, etc.
  score: number; // Relevance score from vector search
  metadata?: Record<string, any>;
  table: string; // Source table
}

/**
 * Processes Short-Term Memory (STM) and decides what to store in Long-Term Memory (LTM).
 * If successful, resolves the promise. If a critical error occurs during LTM storage (e.g., DB error),
 * the promise is rejected. Failure to generate an embedding logs an error but does not cause a rejection.
 * @param userId The ID of the user.
 * @param conversation The current conversation state.
 * @param db The LanceDB connection object.
 * @returns A promise that resolves if processing is successful or if embedding fails (with logged error),
 *          and rejects if there's a critical error during LTM storage.
 */
export async function processSTMToLTM(userId: string, conversation: ConversationState, db: lancedb.Connection): Promise<void> {
  log(`Processing STM to LTM for user: ${userId}`);
  // log('Current conversation state received:', conversation); // Can be too verbose

  if (!db) {
    log('LanceDB connection not provided to processSTMToLTM.', 'error');
    return Promise.reject(new Error('LanceDB connection not provided.'));
  }

  let summary = "";
  if (conversation.userGoal) {
    summary += `User Goal: ${conversation.userGoal}. `;
  }

  const recentTurns = conversation.turnHistory.slice(-2); // Last 2 turns
  if (recentTurns.length > 0) {
    summary += recentTurns.map(turn => `User: ${turn.userInput} | Agent: ${JSON.stringify(turn.agentResponse).substring(0, 150)}...`).join('; ');
  }

  if (!summary.trim()) {
    log('No significant information found in STM to process for LTM.');
    return;
  }

  log(`Generated summary for LTM: "${summary.substring(0, 200)}..."`);

  try {
    const embedding = await generateEmbedding(summary);
    if (!embedding) {
      log('Failed to generate embedding for STM summary. Skipping LTM storage for this cycle.', 'error');
      // If embedding generation itself fails, we might not want to reject the whole process,
      // as it could be a transient issue with the embedding service.
      // However, if processing stops here, the caller won't know unless inspecting logs.
      // For now, returning (not rejecting) to maintain previous behavior for this specific case.
      return;
    }
    const currentTime = new Date().toISOString();

    const kbData = {
      fact_id: uuidv4(),
      text_content: summary,
      text_content_embedding: embedding,
      source: `user_interaction_${userId}`,
      metadata: JSON.stringify({
        type: 'user_interaction_summary',
        userId: userId,
        goal: conversation.userGoal || null,
        turnCount: conversation.turnHistory.length
      }),
      created_at: currentTime,
      updated_at: currentTime,
    };

    log('Adding user interaction summary to knowledge_base LTM.', kbData);
    await addRecord(db, 'knowledge_base', kbData); // This returns Promise.reject on failure
    log('Successfully processed and stored STM snapshot to LTM knowledge_base.');

  } catch (error) {
    log('Error during STM to LTM processing or LanceDB operation.', 'error', error);
    // Re-throw the error to allow the caller to handle LTM storage failures.
    return Promise.reject(error);
  }
}

/**
 * Retrieves relevant information from Long-Term Memory (LTM) based on a query.
 * Supports basic keyword filtering and optional recency boosting for results.
 * @param queryText The query text to search for.
 * @param userId The ID of the user, for context (can be null if not user-specific).
 * @param db The LanceDB connection object.
 * @param options Optional parameters to control retrieval:
 *   @param table - The LTM table to search (default: 'knowledge_base').
 *   @param topK - The number of results to return (default: 5).
 *   @param keywords - An array of keywords to filter by (uses LIKE '%keyword%'). Applied alongside vector search.
 *                     Primarily effective on 'text_content' (knowledge_base) or 'summary' (research_findings).
 *   @param boostRecency - If true, re-ranks results to balance similarity and recency (default: false).
 *   @param recencyWeight - Weight for recency score during re-ranking (0 to 1, default: 0.3). Only if boostRecency is true.
 *   @param similarityWeight - Weight for similarity score during re-ranking (0 to 1, default: 0.7). Only if boostRecency is true.
 * @returns A promise that resolves to an array of LTM query results, sorted by relevance.
 */
export async function retrieveRelevantLTM(
  queryText: string,
  userId: string | null,
  db: lancedb.Connection,
  options?: {
    table?: string;
    topK?: number;
    keywords?: string[]; // Keywords for basic filtering
    boostRecency?: boolean; // Flag to enable recency boosting
    recencyWeight?: number; // Weight for recency score (0 to 1), applies if boostRecency is true
    similarityWeight?: number; // Weight for similarity score (0 to 1), applies if boostRecency is true
  }
): Promise<LtmQueryResult[]> {
  log(`Retrieving relevant LTM for query: "${queryText}" (User: ${userId || 'N/A'})`, options);

  if (!db) {
    log('LanceDB connection not provided to retrieveRelevantLTM.', 'error');
    return Promise.reject(new Error('LanceDB connection not provided.'));
  }

  if (!queryText.trim()) {
    log('Query text is empty, skipping LTM retrieval.');
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(queryText);
    if (!queryEmbedding) {
      log('Failed to generate query embedding. Cannot retrieve from LTM.', 'error');
      return [];
    }

    const initialTopK = options?.topK || 5;
    // If boosting recency, fetch more results initially for re-ranking
    const fetchTopK = options?.boostRecency ? initialTopK * 3 : initialTopK;

    let targetTable = options?.table || 'knowledge_base';
    let vectorColumnName = 'text_content_embedding'; // Default for knowledge_base
    let baseFilter: string | undefined = undefined;

    // Determine base filter and vector column based on table
    if (targetTable === 'user_profiles') {
      vectorColumnName = 'interaction_summary_embeddings'; // Corrected based on Step 1 analysis
      if (userId) {
        baseFilter = `user_id = '${userId}'`;
      } else {
        log('Warning: Searching user_profiles without a specific userId.', 'info');
      }
    } else if (targetTable === 'knowledge_base' && userId) {
      baseFilter = `source = 'user_interaction_${userId}'`;
    } else if (targetTable === 'research_findings') {
      vectorColumnName = 'summary_embedding'; // Or 'query_embedding' or both, field needs to exist
    }
    // Add more conditions for other tables or vector columns as needed

    // Incorporate keywords into the filter (Basic Hybrid Search)
    let combinedFilter = baseFilter;
    if (options?.keywords && options.keywords.length > 0) {
      const keywordConditions = options.keywords.map(kw => {
        let textFieldToSearch = 'text_content'; // Default for knowledge_base
        if (targetTable === 'research_findings') {
          textFieldToSearch = 'summary'; // Could also search 'details_text'
        } else if (targetTable === 'user_profiles') {
          // User profiles might not have a single 'text_content' field for keyword search.
          // This part needs careful consideration. For now, let's assume keywords are less relevant for 'user_profiles'
          // or would apply to a specific text field if one exists (e.g., a bio).
          // Sticking to knowledge_base and research_findings for keyword search for now.
          if (targetTable !== 'knowledge_base' && targetTable !== 'research_findings') return null;
        }
        return `${textFieldToSearch} LIKE '%${kw.replace(/'/g, "''")}%'`;
      }).filter(Boolean).join(' AND '); // filter(Boolean) removes nulls

      if (keywordConditions) {
        if (combinedFilter) {
          combinedFilter = `(${combinedFilter}) AND (${keywordConditions})`;
        } else {
          combinedFilter = keywordConditions;
        }
      }
    }

    log(`Querying table '${targetTable}' with vector column '${vectorColumnName}', limit ${fetchTopK}, filter: '${combinedFilter || 'None'}'`);

    const rawSearchResults = await searchTable(db, targetTable, queryEmbedding, fetchTopK, vectorColumnName, combinedFilter);
    log(`Retrieved ${rawSearchResults.length} raw results from LTM table '${targetTable}'.`);

    let finalResults = rawSearchResults.map((item: any) => {
      let id = item.fact_id || item.user_id || item.finding_id || uuidv4();
      let text = item.text_content || item.summary || (item.preferences ? JSON.stringify(item.preferences) : 'N/A');
      if (targetTable === 'user_profiles') {
        text = `User Profile: ${item.user_id}, Prefs: ${item.preferences}, Summaries: ${item.interaction_summaries?.join('; ')}`;
      }
      return {
        id,
        text,
        score: item._distance, // LanceDB vector search distance (lower is better)
        metadata: item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : { original_fields: item },
        table: targetTable,
        updated_at: item.updated_at, // Ensure updated_at is selected and available
      };
    });

    // Post-retrieval Re-ranking for Recency Boost
    if (options?.boostRecency && finalResults.length > 0) {
      log('Applying recency boost re-ranking...');
      const similarityWeight = options.similarityWeight !== undefined ? options.similarityWeight : 0.7;
      const recencyWeight = options.recencyWeight !== undefined ? options.recencyWeight : 0.3;

      // Get min/max timestamps for normalization (only from the current batch)
      const timestamps = finalResults.map(r => new Date(r.updated_at).getTime()).filter(t => !isNaN(t));
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);

      finalResults.forEach(result => {
        // Normalize similarity score (1 - distance, so higher is better)
        const normalizedSimilarity = 1 - result.score;

        // Normalize recency score (0 to 1, higher is more recent)
        let normalizedRecency = 0.5; // Default if only one item or no valid date
        if (maxTimestamp > minTimestamp) {
          const itemTimestamp = new Date(result.updated_at).getTime();
          if (!isNaN(itemTimestamp)) {
            normalizedRecency = (itemTimestamp - minTimestamp) / (maxTimestamp - minTimestamp);
          }
        } else if (timestamps.length === 1) { // if all items have the exact same timestamp or only one item
            normalizedRecency = 1;
        }


        // Combined score
        result.score = (similarityWeight * normalizedSimilarity) + (recencyWeight * normalizedRecency);
        // log(`Re-ranking: ID ${result.id}, OrigDist: ${1-normalizedSimilarity}, NormSim: ${normalizedSimilarity}, NormRec: ${normalizedRecency}, NewScore: ${result.score}`);
      });

      // Sort by the new combined score in descending order (higher is better)
      finalResults.sort((a, b) => b.score - a.score);
      log(`Re-ranking complete. Top score after re-ranking: ${finalResults[0]?.score}`);
    } else {
        // If not boosting recency, ensure score is similarity (1-distance)
        finalResults.forEach(result => {
            result.score = 1 - result.score; // Higher is better
        });
        finalResults.sort((a, b) => b.score - a.score); // Sort by similarity
    }


    return finalResults.slice(0, initialTopK);

  } catch (error) {
    log('Error during LTM retrieval or LanceDB operation.', 'error', error);
    return []; // Return empty array on error, or re-throw
  }
}

// Define structure for actions that modify conversation state (STM)
export interface ConversationStateActions { // Export if used by handler.ts directly
  updateUserGoal: (goal: string | null) => void;
  updateIntentAndEntities: (intent: string | null, entities: Record<string, any> | null) => void;
  updateLtmRepoContext: (context: LtmQueryResult[] | null) => void; // New action
}

/**
 * Loads retrieved LTM results into the Short-Term Memory (STM) or conversation state.
 * @param results The LTM query results to load.
 * @param conversationStateActions An object containing functions to update the conversation state.
 */
export async function loadLTMToSTM(
  results: LtmQueryResult[],
  conversationStateActions: ConversationStateActions
): Promise<void> {
  log('Loading LTM results into STM...');
  if (!results || results.length === 0) {
    log('No LTM results to load.');
    conversationStateActions.updateLtmRepoContext(null); // Clear context if no results
    return;
  }

  // Update the main LTM context in conversation state
  conversationStateActions.updateLtmRepoContext(results);
  log(`LTM context updated in conversation state with ${results.length} items.`);

  // Example of further processing: update user goal based on the top LTM result
  // This is illustrative and can be expanded.
  const topResult = results[0];
  if (topResult && topResult.table === 'user_profiles' && topResult.metadata?.goal) {
    log(`Updating user goal from top LTM result: ${topResult.metadata.goal}`);
    conversationStateActions.updateUserGoal(topResult.metadata.goal as string);
  } else if (topResult && topResult.metadata?.summaryGoal) { // Check for a differently named field
     log(`Updating user goal from top LTM result's summaryGoal: ${topResult.metadata.summaryGoal}`);
    conversationStateActions.updateUserGoal(topResult.metadata.summaryGoal as string);
  }
  // Potentially update entities based on LTM results as well
  // Example: if entities are directly stored or inferable from LTM text/metadata
  // for (const result of results) {
  //   if (result.metadata?.entities && typeof result.metadata.entities === 'object') {
  //     log('Updating entities from LTM result:', result.metadata.entities);
  //     conversationStateActions.updateIntentAndEntities(null, result.metadata.entities as Record<string, any>);
  //     // Note: This might overwrite entities from NLU. Decide on merging strategy.
  //   }
  // }
  log('Finished loading LTM results and potentially updating parts of STM.');
}

// Example of how this manager might be initialized and used (conceptual)
/*
async function mainMemoryCycle(userId: string, currentQuery?: string) {
  log("Starting main memory cycle...");

  // It's better to initialize DB once and pass the connection around.
  // For this example, assume `dbConnection` is an already initialized lancedb.Connection object.
  // const dbConnection = await initializeDB('agent_ltm_db');
  // if (!dbConnection) {
  //   log("Failed to initialize LanceDB. Aborting memory cycle.", 'error');
  //   return;
  // }

  // 1. Potentially retrieve LTM based on current query to inform current turn
  if (currentQuery && dbConnection) { // Make sure dbConnection is valid
    const relevantLtm = await retrieveRelevantLTM(currentQuery, userId, dbConnection, { table: 'knowledge_base' });
    if (relevantLtm.length > 0) {
      await loadLTMToSTM(relevantLtm, {
        updateUserGoal: updateUserGoal,
        updateIntentAndEntities: updateIntentAndEntities,
      });
    }
  }

  // 2. After agent response and user interaction, process STM to LTM
  const currentConversationState = getConversationStateSnapshot();
  if (currentConversationState.isActive && dbConnection) { // Make sure dbConnection is valid
    await processSTMToLTM(userId, currentConversationState, dbConnection);
  }

  log("Main memory cycle finished.");
}
*/

log('MemoryManager module loaded with implemented LTM interaction functions.');
