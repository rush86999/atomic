import os
import requests
import json
import tempfile # For downloading audio from URL
from notion_client import Client, APIResponseError
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions, # For configuring client per-stream
    PrerecordedOptions,
    FileSource,
    LiveTranscriptionEvents,
    LiveOptions
)
import openai # For OpenAI
import asyncio # For live streaming
from typing import Optional, List # Ensure List is imported if not already
from datetime import datetime # For handling meeting_date
import logging # Import standard logging

from ._utils.lancedb_service import add_transcript_embedding

# Initialize logger for this module
logger = logging.getLogger(__name__)

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, RetryError

# --- Global Clients (to be initialized by functions or handlers) ---
notion: Client | None = None
# deepgram_client_global is removed as live streaming needs per-instance client or careful management
# For pre-recorded, we'll also instantiate client per call for simplicity or use a passed-in one.

# --- Global Configuration Variables (can be overridden by parameters) ---
NOTION_API_TOKEN_GLOBAL = os.environ.get("NOTION_API_TOKEN")
NOTION_NOTES_DATABASE_ID_GLOBAL = os.environ.get("NOTION_NOTES_DATABASE_ID")

DEEPGRAM_API_KEY_GLOBAL = os.environ.get("DEEPGRAM_API_KEY")
OPENAI_API_KEY_GLOBAL = os.environ.get("OPENAI_API_KEY")
GPT_MODEL_NAME_GLOBAL = os.environ.get("GPT_MODEL_NAME", "gpt-3.5-turbo-1106")
OPENAI_API_ENDPOINT_GLOBAL = os.environ.get("OPENAI_API_ENDPOINT", "https://api.openai.com/v1/chat/completions")


def init_notion(api_token: str, database_id: str = None) -> dict:
    global notion, NOTION_API_TOKEN_GLOBAL, NOTION_NOTES_DATABASE_ID_GLOBAL
    if not api_token: return {"status": "error", "message": "Notion API token required.", "code": "CONFIG_ERROR"}
    NOTION_API_TOKEN_GLOBAL = api_token
    if database_id: NOTION_NOTES_DATABASE_ID_GLOBAL = database_id
    try:
        notion = Client(auth=NOTION_API_TOKEN_GLOBAL)
        return {"status": "success", "message": "Notion client initialized."}
    except Exception as e:
        notion = None
        return {"status": "error", "message": f"Failed to initialize Notion client: {str(e)}", "code": "NOTION_CLIENT_INIT_ERROR"}

# init_deepgram is removed as we'll pass key to functions needing Deepgram client

# --- Notion Functions (create_notion_note, get_notion_note, update_notion_note, search_notion_notes) ---
# ... (These functions remain as they were in the last successful 'overwrite_file_with_block' for note_utils.py - Subtask 25)
# ... For brevity, their full code is not repeated here, but they are assumed to be present and correct.

# Define a common retry decorator for Notion API calls
# Retry on specific Notion API errors (like 500, 502, 503, 504, rate_limited)
# and generic network errors (requests.exceptions.RequestException)
# The notion-client uses 'requests' under the hood.
def is_retryable_notion_api_error(e: BaseException) -> bool:
    if isinstance(e, APIResponseError):
        # Check for common retryable HTTP status codes from Notion
        # Notion error codes: https://developers.notion.com/reference/errors
        # Retry on: service_unavailable (503), gateway_timeout (504), internal_server_error (500), conflict_error (409 - sometimes for concurrent edits)
        # For rate limits, Notion might return 429.
        retryable_codes = ["service_unavailable", "internal_server_error", "gateway_timeout", "rate_limited"] # Notion specific error codes
        http_retryable_statuses = [408, 429, 500, 502, 503, 504] # HTTP status codes

        if hasattr(e, 'code') and e.code in retryable_codes:
            logger.warning(f"Notion API Error (code: {e.code}) - Will retry: {e.body.get('message', str(e))}")
            return True
        # The notion-client's APIResponseError might not directly expose HTTP status code easily,
        # but it wraps httpx.HTTPStatusError. We might need to inspect e.body or underlying error.
        # For now, we rely on Notion's specific error codes if available.
        # If we want to retry on generic HTTP status codes, we'd need to ensure they are accessible from e.
        # Let's assume for now that specific Notion error codes are sufficient or that `requests.exceptions.RequestException`
        # will catch underlying network/HTTP issues that `tenacity` can retry.

    # Check for general network issues if using 'requests' directly (Notion client uses httpx)
    # For httpx (used by notion-client), common exceptions are httpx.RequestError subclasses
    # like httpx.ConnectTimeout, httpx.ReadTimeout, httpx.NetworkError
    # For simplicity, we'll catch a broad set of potential network errors.
    # Tenacity by default retries on any Exception if not specified otherwise.
    # Let's be more specific for network-like issues.
    if isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.ChunkedEncodingError)):
        logger.warning(f"Network-related error during Notion API call - Will retry: {str(e)}")
        return True

    # If the exception is an APIResponseError but not one of our retryable codes, don't retry.
    if isinstance(e, APIResponseError):
        logger.warning(f"Notion API Error (code: {getattr(e, 'code', 'UNKNOWN')}) - Not retrying: {e.body.get('message', str(e))}")
        return False

    logger.warning(f"Encountered Exception for Notion API call - Defaulting to retry (if generic Exception is retryable by tenacity default): {str(e)}")
    return True # Default to retry for other Exceptions unless specified not to.

notion_api_retry_decorator = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((APIResponseError, requests.exceptions.RequestException)), # Broadly retry APIResponseError and network issues
    # For more fine-grained control with APIResponseError, use the function above:
    # retry=retry_if_exception(is_retryable_notion_api_error),
    before_sleep=lambda retry_state: logger.info(f"Notion API call: Retrying attempt {retry_state.attempt_number} due to: {retry_state.outcome.exception()}")
)


@notion_api_retry_decorator
def create_notion_note(
    title: str, content: str, notion_db_id: str = None, source: str = None,
    linked_task_id: str = None, linked_event_id: str = None, transcription: str = None,
    audio_file_link: str = None, summary: str = None, key_points: str = None,
    decisions: list = None, action_items: list = None
) -> dict:
    if not notion: return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}
    db_id_to_use = notion_db_id or NOTION_NOTES_DATABASE_ID_GLOBAL
    if not db_id_to_use: return {"status": "error", "message": "Notion database ID not configured.", "code": "NOTION_CONFIG_ERROR"}
    if not title: return {"status": "error", "message": "Title is required.", "code": "VALIDATION_ERROR"}

    properties = {"Title": {"title": [{"text": {"content": title}}]}}

    if content and len(content.strip()) > 0 : properties["ContentText"] = {"rich_text": [{"text": {"content": content[:1999]}}]}
    if source: properties["Source"] = {"rich_text": [{"text": {"content": source}}]}
    if linked_task_id: properties["Linked Task ID"] = {"rich_text": [{"text": {"content": linked_task_id}}]}
    if linked_event_id: properties["Linked Event ID"] = {"rich_text": [{"text": {"content": linked_event_id}}]}
    if transcription and len(transcription.strip()) > 0: properties["TranscriptionText"] = {"rich_text": [{"text": {"content": transcription[:1999]}}]}
    if audio_file_link: properties["Audio File Link"] = {"url": audio_file_link}
    if summary and len(summary.strip()) > 0 : properties["Summary"] = {"rich_text": [{"text": {"content": summary[:1999]}}]}
    if key_points and len(key_points.strip()) > 0: properties["Key Points"] = {"rich_text": [{"text": {"content": key_points[:1999]}}]}

    formatted_decisions = ""
    if decisions and isinstance(decisions, list) and len(decisions) > 0:
        formatted_decisions = "\n".join([f"- {str(item)}" for item in decisions])

    formatted_action_items = ""
    if action_items and isinstance(action_items, list) and len(action_items) > 0:
        formatted_action_items = "\n".join([f"- {str(item)}" for item in action_items])

    if formatted_decisions:
        properties["Decisions Logged"] = {"rich_text": [{"text": {"content": formatted_decisions[:1999]}}]}

    if formatted_action_items:
        properties["Action Items Logged"] = {"rich_text": [{"text": {"content": formatted_action_items[:1999]}}]}
    page_content_blocks = []
    if content:
        for i in range(0, len(content), 2000): page_content_blocks.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": content[i:i+2000]}}]}})
    try:
        response = notion.pages.create(parent={"database_id": db_id_to_use}, properties=properties, children=page_content_blocks if page_content_blocks else None)
        return {"status": "success", "data": {"page_id": response["id"], "url": response.get("url")}}
    except APIResponseError as e: return {"status": "error", "message": f"Notion API error: {e.body.get('message', str(e))}", "code": f"NOTION_API_{e.code.upper()}", "details": e.body}
    except Exception as e:
        logger.error(f"Error creating Notion page '{title}': {e}", exc_info=True)
        return {"status": "error", "message": f"Error creating Notion page: {str(e)}", "code": "NOTION_CREATE_ERROR"}

@notion_api_retry_decorator
def get_notion_note(page_id: str) -> dict:
    if not notion:
        logger.error("Notion client not initialized for get_notion_note.")
        return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}
    try:
        page_data = notion.pages.retrieve(page_id=page_id); properties = page_data.get("properties", {})
        data = {"id": page_data["id"], "url": page_data.get("url"), "created_time": page_data.get("created_time"), "last_edited_time": page_data.get("last_edited_time")}
        for key, prop_data in properties.items():
            if prop_data["type"] == "title": data[key] = "".join(t["plain_text"] for t in prop_data["title"])
            elif prop_data["type"] == "rich_text": data[key] = "".join(t["plain_text"] for t in prop_data["rich_text"])
            elif prop_data["type"] == "url": data[key] = prop_data["url"]
        blocks_response = notion.blocks.children.list(block_id=page_id); content_blocks = []
        for block in blocks_response.get("results", []):
            if block["type"] == "paragraph": content_blocks.append("".join(rt["plain_text"] for rt in block["paragraph"]["rich_text"]))
        data["full_content_blocks"] = content_blocks; data["content"] = data.get("ContentText", content_blocks[0] if content_blocks else "")
        logger.info(f"Successfully retrieved Notion page: {page_id}")
        return {"status": "success", "data": data}
    except APIResponseError as e:
        logger.error(f"Notion API error retrieving page {page_id}: {e.body.get('message', str(e))}", extra={"code": e.code, "details": e.body})
        return {"status": "error", "message": f"Notion API error retrieving page: {e.body.get('message', str(e))}", "code": f"NOTION_API_{e.code.upper()}", "details": e.body}
    except Exception as e:
        logger.error(f"Error retrieving Notion page {page_id}: {str(e)}", exc_info=True)
        return {"status": "error", "message": f"Error retrieving Notion page: {str(e)}", "code": "NOTION_GET_ERROR"}

@notion_api_retry_decorator
def update_notion_note(page_id: str, content: str = None, title: str = None, **kwargs) -> dict:
    if not notion:
        logger.error("Notion client not initialized for update_notion_note.")
        return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}
    properties_to_update = {}
    if title: properties_to_update["Title"] = {"title": [{"text": {"content": title}}]}
    if content: properties_to_update["ContentText"] = {"rich_text": [{"text": {"content": content[:1999]}}]} # Ensure content is string for slicing
    for key, value in kwargs.items():
        if key in ["Source", "Linked Task ID", "Linked Event ID", "TranscriptionText", "Summary", "Key Points"]: properties_to_update[key] = {"rich_text": [{"text": {"content": str(value)[:1999]}}]}
        elif key == "Audio File Link" and value: properties_to_update[key] = {"url": str(value)}

    if not properties_to_update and not content: # Check if only content block update is intended
         # If only content blocks are to be updated (passed via kwargs perhaps, or different logic)
         # This function currently only updates properties. For block updates, separate logic or function is needed.
         # For now, if no properties changed, it's a no-op for properties.
        logger.info(f"No properties to update for Notion page {page_id}. If block content update was intended, use specific block methods.")
        # Return success as no properties needed updating. Modify if this isn't desired.
        return {"status": "success", "data": {"page_id": page_id, "updated_properties": []}}

    try:
        args = {"page_id": page_id}
        if properties_to_update: args["properties"] = properties_to_update

        # Only call update if there are properties to update
        if properties_to_update:
            response = notion.pages.update(**args)
            logger.info(f"Successfully updated Notion page {page_id} with properties: {list(properties_to_update.keys())}")
        else: # Should have been caught by the no-op check above, but as a safeguard
            logger.info(f"No property updates for Notion page {page_id}, no API call made.")

        return {"status": "success", "data": {"page_id": page_id, "updated_properties": list(properties_to_update.keys())}}
    except APIResponseError as e:
        logger.error(f"Notion API error updating page {page_id}: {e.body.get('message', str(e))}", extra={"code": e.code, "details": e.body})
        return {"status": "error", "message": f"Notion API error updating page: {e.body.get('message', str(e))}", "code": f"NOTION_API_{e.code.upper()}", "details": e.body}
    except Exception as e:
        logger.error(f"Error updating Notion page {page_id}: {str(e)}", exc_info=True)
        return {"status": "error", "message": f"Error updating Notion page: {str(e)}", "code": "NOTION_UPDATE_ERROR"}

@notion_api_retry_decorator
def search_notion_notes(query: str, notion_db_id: str = None, source: str = None) -> dict:
    if not notion:
        logger.error("Notion client not initialized for search_notion_notes.")
        return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}
    db_id_to_use = notion_db_id or NOTION_NOTES_DATABASE_ID_GLOBAL
    if not db_id_to_use:
        logger.error("Notion database ID not configured for search_notion_notes.")
        return {"status": "error", "message": "Notion database ID not configured.", "code": "NOTION_CONFIG_ERROR"}

    filter_conditions = []
    if query: filter_conditions.append({"property": "Title", "title": {"contains": query}})
    if source: filter_conditions.append({"property": "Source", "rich_text": {"contains": source}})

    filter_payload = None
    if len(filter_conditions) == 1: filter_payload = filter_conditions[0]
    elif len(filter_conditions) > 1: filter_payload = {"and": filter_conditions}

    try:
        logger.debug(f"Searching Notion DB {db_id_to_use} with filter: {filter_payload}")
        response = notion.databases.query(database_id=db_id_to_use, filter=filter_payload if filter_payload else None); results = []
        for page in response.get("results", []):
            properties = page.get("properties", {}); page_info = {"id": page["id"], "url": page.get("url")}
            for key, prop_data in properties.items():
                if prop_data["type"] == "title": page_info[key] = "".join(t["plain_text"] for t in prop_data["title"])
                elif prop_data["type"] == "rich_text": page_info[key] = "".join(t["plain_text"] for t in prop_data["rich_text"])
            page_info["content"] = page_info.get("ContentText", ""); page_info["linked_task_id"] = page_info.get("Linked Task ID", None); page_info["linked_event_id"] = page_info.get("Linked Event ID", None)
            results.append(page_info)
        logger.info(f"Notion search completed. Found {len(results)} notes in DB {db_id_to_use}.")
        return {"status": "success", "data": results}
    except APIResponseError as e:
        logger.error(f"Notion API error searching DB {db_id_to_use}: {e.body.get('message', str(e))}", extra={"code": e.code, "details": e.body})
        return {"status": "error", "message": f"Notion API error searching: {e.body.get('message', str(e))}", "code": f"NOTION_API_{e.code.upper()}", "details": e.body}
    except Exception as e:
        logger.error(f"Error searching Notion notes in DB {db_id_to_use}: {str(e)}", exc_info=True)
        return {"status": "error", "message": f"Error searching Notion notes: {str(e)}", "code": "NOTION_SEARCH_ERROR"}

# --- Audio Processing & Summarization ---

async def transcribe_audio_deepgram_stream(
    audio_chunk_iterator, # Must be an async iterator
    deepgram_api_key_param: str = None,
    options: dict = None
) -> dict:
    """Transcribes live audio stream using Deepgram SDK."""
    dg_key_to_use = deepgram_api_key_param or DEEPGRAM_API_KEY_GLOBAL
    if not dg_key_to_use:
        logger.error("Deepgram API key not configured or provided for live stream.")
        return {"status": "error", "message": "Deepgram API key not configured or provided.", "code": "DEEPGRAM_CONFIG_ERROR"}

    dg_config = DeepgramClientOptions(verbose=0)
    deepgram = DeepgramClient(dg_key_to_use, dg_config)

    if options is None:
        options = LiveOptions(
            model="nova-2", language="en-US", punctuate=True, smart_format=True,
            interim_results=False, endpointing="200",
            utterance_end_ms="1000"
        )

    dg_connection = deepgram.listen.live.v("1")
    full_transcript_parts = []
    stream_error = None
    connection_opened = asyncio.Event()
    connection_closed = asyncio.Event()

    def on_open(self_unused, open_event, **kwargs): # self is passed by dg, renamed to avoid confusion
        logger.info(f"Deepgram live connection opened: {open_event}")
        connection_opened.set()

    def on_message(self_unused, result, **kwargs):
        sentence = result.channel.alternatives[0].transcript
        if len(sentence) == 0: return
        if result.is_final and result.speech_final:
            full_transcript_parts.append(sentence)
            logger.debug(f"DS_LIVE: Appended final transcript part (len: {len(sentence)}): {sentence[:100]}...")

    def on_metadata(self_unused, metadata, **kwargs): logger.debug(f"Deepgram live Metadata: {metadata}")
    def on_speech_started(self_unused, speech_started, **kwargs): logger.debug(f"Deepgram live Speech Started: {speech_started}")
    def on_utterance_end(self_unused, utterance_end, **kwargs): logger.debug(f"Deepgram live Utterance Ended: {utterance_end}")

    def on_error(self_unused, error, **kwargs):
        nonlocal stream_error
        err_msg = f"Deepgram live stream error: {error}"
        logger.error(err_msg, extra={"details": kwargs})
        stream_error = {"message": err_msg, "details": kwargs}
        connection_opened.set()
        connection_closed.set()

    def on_close(self_unused, close_event, **kwargs):
        logger.info(f"Deepgram live connection closed: {close_event}")
        connection_closed.set()

    dg_connection.on(LiveTranscriptionEvents.Open, on_open)
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
    dg_connection.on(LiveTranscriptionEvents.Metadata, on_metadata)
    dg_connection.on(LiveTranscriptionEvents.SpeechStarted, on_speech_started)
    dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)
    dg_connection.on(LiveTranscriptionEvents.Error, on_error)
    dg_connection.on(LiveTranscriptionEvents.Close, on_close)

    @retry( # Apply tenacity to the connection start
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=5), # Shorter waits for connection attempts
        retry=retry_if_exception_type(Exception), # Retry on generic exception for connection start
        before_sleep=lambda retry_state: logger.warning(f"DS_LIVE: Retrying Deepgram connection (attempt {retry_state.attempt_number}) due to: {retry_state.outcome.exception()}")
    )
    async def start_dg_connection():
        if not await dg_connection.start(options): # Returns bool success
            logger.error("DS_LIVE: dg_connection.start() returned False, indicating connection failure.")
            # Raise an exception to trigger retry or be caught by the outer try/except
            raise RuntimeError("Failed to start Deepgram connection (start returned False).")
        logger.info("DS_LIVE: Deepgram connection successfully initiated by start().")

    try:
        await start_dg_connection() # Call the retry-wrapped connection starter

        await connection_opened.wait() # Wait for on_open callback
        if stream_error: # Check if on_error callback set an error during/before open
             logger.error(f"DS_LIVE: Stream error occurred during or immediately after connection open: {stream_error['message']}")
             return {"status": "error", "message": stream_error["message"], "code": "DEEPGRAM_STREAM_ERROR_ON_OPEN", "details": stream_error["details"]}


        # Sender coroutine
        async def sender(dg_conn, audio_iterator):
            try:
                async for chunk in audio_iterator:
                    if chunk: dg_conn.send(chunk)
            except Exception as e:
                nonlocal stream_error
                err_msg = f"Error reading/sending audio chunk from iterator: {str(e)}"
                logger.error(f"DS_LIVE: {err_msg}", exc_info=True)
                stream_error = {"message": err_msg, "details": str(e)} # This error will be caught by the outer try/except after sender_task is awaited
            finally:
                logger.info("DS_LIVE: Audio iterator exhausted or error in sender. Finishing Deepgram connection.")
                await dg_conn.finish() # Signal end of audio stream

        sender_task = asyncio.create_task(sender(dg_connection, audio_chunk_iterator))

        # Wait for sender to complete and connection to close, with timeout
        try:
            await asyncio.wait_for(connection_closed.wait(), timeout=3600.0) # e.g., 1 hour timeout
        except asyncio.TimeoutError:
            nonlocal stream_error
            stream_error_msg = "Deepgram stream processing timed out after 1 hour."
            logger.error(f"DS_LIVE: {stream_error_msg}")
            stream_error = {"message": stream_error_msg, "details": "Timeout after 1 hour"}
            await dg_connection.finish() # Attempt to close if timed out

        await sender_task # Ensure sender task is complete / exceptions propagated from it

        if stream_error: # This could have been set by on_error, timeout, or sender error
            logger.error(f"DS_LIVE: Stream error condition detected: {stream_error['message']}")
            return {"status": "error", "message": stream_error["message"], "code": "DEEPGRAM_STREAM_ERROR", "details": stream_error.get("details")}

        final_transcript = " ".join(full_transcript_parts).strip()
        logger.info(f"DS_LIVE: Final transcript assembled (length: {len(final_transcript)}).")
        return {"status": "success", "data": {"full_transcript": final_transcript}}

    except Exception as e:
        logger.error(f"DS_LIVE: Outer exception in transcribe_audio_deepgram_stream: {e}", exc_info=True)
        return {"status": "error", "message": f"Deepgram stream general error: {str(e)}", "code": "DEEPGRAM_STREAM_GENERAL_ERROR", "details": str(e)}
    finally:
        if dg_connection and dg_connection.is_connected():
             logger.info("DS_LIVE: Ensuring Deepgram connection is finished in finally block.")
             await dg_connection.finish()


async def process_live_audio_for_notion(
    platform_module,
    meeting_id: str,
    notion_note_title: str,
    deepgram_api_key: str,
    openai_api_key: str,
    notion_db_id: str = None,
    notion_source: str = "Live Meeting Transcription",
    linked_task_id: str = None,
    linked_event_id: str = None
) -> dict:
    operation_name = "process_live_audio_for_notion"
    logger.info(f"[{operation_name}] Starting for meeting {meeting_id}, title: '{notion_note_title}'.")

    if not notion:
        logger.error(f"[{operation_name}] Notion client not initialized.")
        return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}
    if not deepgram_api_key:
        logger.error(f"[{operation_name}] Deepgram API Key not provided.")
        return {"status": "error", "message": "Deepgram API Key not provided.", "code": "DEEPGRAM_CONFIG_ERROR"}
    if not openai_api_key:
        logger.error(f"[{operation_name}] OpenAI API Key not provided.")
        return {"status": "error", "message": "OpenAI API Key not provided.", "code": "OPENAI_CONFIG_ERROR"}

    if not hasattr(platform_module, 'start_audio_capture') or not hasattr(platform_module, 'stop_audio_capture'):
        logger.error(f"[{operationName}] Platform module lacks required audio capture methods.")
        return {"status": "error", "message": "Platform module lacks required audio capture methods.", "code": "PLATFORM_MODULE_INVALID"}

    audio_chunk_iterator = None
    try:
        logger.info(f"[{operation_name}] Attempting to start audio capture for meeting {meeting_id}.")
        audio_chunk_iterator = platform_module.start_audio_capture(meeting_id)
        if audio_chunk_iterator is None:
            logger.error(f"[{operation_name}] Failed to start audio capture for meeting {meeting_id} (iterator is None).")
            return {"status": "error", "message": f"Failed to start audio capture for meeting {meeting_id}.", "code": "AUDIO_CAPTURE_FAILED"}

        logger.info(f"[{operation_name}] Starting live transcription for meeting {meeting_id}...")
        transcription_options = LiveOptions(model="nova-2", language="en-US", punctuate=True, smart_format=True, interim_results=False, endpointing="300", utterance_end_ms="1000")

        transcript_resp = await transcribe_audio_deepgram_stream(
            audio_chunk_iterator,
            deepgram_api_key_param=deepgram_api_key,
            options=transcription_options
        )

    except Exception as e:
        logger.error(f"[{operation_name}] Audio capture setup error for meeting {meeting_id}: {e}", exc_info=True)
        return {"status": "error", "message": f"Audio capture setup error: {str(e)}", "code": "AUDIO_CAPTURE_SETUP_ERROR"}
    finally:
        if hasattr(platform_module, 'stop_audio_capture'):
            try:
                logger.info(f"[{operation_name}] Stopping audio capture for meeting {meeting_id}.")
                # Assuming stop_audio_capture could be async or sync
                if asyncio.iscoroutinefunction(platform_module.stop_audio_capture):
                    await platform_module.stop_audio_capture()
                else:
                    platform_module.stop_audio_capture()
            except Exception as e:
                logger.error(f"[{operation_name}] Error stopping audio capture for meeting {meeting_id}: {e}", exc_info=True)

    if transcript_resp["status"] == "error":
        logger.error(f"[{operation_name}] Live transcription failed for meeting {meeting_id}.", extra={"details": transcript_resp.get("message")})
        return {"status": "error", "message": "Live transcription failed.", "code": "TRANSCRIPTION_ERROR", "details": transcript_resp.get("message")}

    final_transcript = transcript_resp.get("data", {}).get("full_transcript", "").strip()
    if not final_transcript:
        logger.warning(f"[{operation_name}] Live transcript for meeting {meeting_id} was empty.")
        return {"status": "error", "message": "No transcript generated from live audio.", "code": "TRANSCRIPTION_EMPTY"}

    logger.info(f"[{operation_name}] Transcription successful for meeting {meeting_id} (length: {len(final_transcript)}). Summarizing...")
    summarize_resp = summarize_transcript_gpt(final_transcript, openai_api_key_param=openai_api_key)
    summary, key_points = None, None
    decisions_list = []
    action_items_list = []
    if summarize_resp["status"] == "success":
        summary = summarize_resp["data"].get("summary")
        key_points = summarize_resp["data"].get("key_points")
        decisions_list = summarize_resp["data"].get("decisions", [])
        action_items_list = summarize_resp["data"].get("action_items", [])
        logger.info(f"[{operation_name}] Summarization successful for meeting {meeting_id}.")
    else:
        logger.warning(f"[{operation_name}] Summarization failed for live transcript of {meeting_id}: {summarize_resp['message']}")

    logger.info(f"[{operation_name}] Creating Notion note for meeting {meeting_id}.")
    create_note_resp = create_notion_note(
        title=notion_note_title,
        content=f"Live meeting notes for: {notion_note_title}",
        notion_db_id=notion_db_id,
        source=notion_source,
        linked_task_id=linked_task_id, linked_event_id=linked_event_id,
        transcription=final_transcript, summary=summary, key_points=key_points,
        decisions=decisions_list, action_items=action_items_list
    )

    if create_note_resp["status"] == "error":
        logger.error(f"[{operation_name}] Failed to create Notion note for live transcript of meeting {meeting_id}.", extra={"details": create_note_resp.get("message")})
        return {"status": "error", "message": "Failed to create Notion note for live transcript.", "code": "NOTION_SAVE_ERROR", "details": create_note_resp.get("message")}

    logger.info(f"[{operation_name}] Successfully processed live audio and created Notion note for meeting {meeting_id}.", extra={"notion_page_id": create_note_resp['data']['page_id']})
    return {"status": "success", "data": {
        "notion_page_id": create_note_resp["data"]["page_id"],
        "url": create_note_resp["data"]["url"],
        "summary": summary,
        "key_points": key_points,
        "full_transcript": final_transcript,
        "full_transcript_preview": final_transcript[:200]
    }}


# --- Other pre-existing functions (transcribe_audio_deepgram - for pre-recorded, summarize_transcript_gpt, process_audio_url_for_notion, get_text_embedding_openai) ---
# ... (These functions remain as they were in the last successful 'overwrite_file_with_block' for note_utils.py - Subtask 25 & 27)
# ... For brevity, their full code is not repeated here, but they are assumed to be present and correct.

# Define a retry decorator for Deepgram pre-recorded and potentially other DG calls
# Deepgram errors can be varied. Retry on network issues and typical server-side issues (5xx).
# Specific Deepgram error types might need to be added if they are known to be transient.
# The Deepgram Python SDK might raise specific exceptions.
# For now, focusing on generic requests.exceptions for underlying HTTP issues if not caught by SDK.
# And potentially specific Deepgram SDK exceptions if they are distinct from generic HTTP ones.
# Let's assume Deepgram SDK might raise a generic Exception for some API errors or wrap HTTP errors.

def is_retryable_deepgram_error(e: BaseException) -> bool:
    # Check for requests.exceptions if Deepgram SDK uses requests and doesn't wrap them well
    if isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.ChunkedEncodingError)):
        logger.warning(f"Deepgram API Call: Network-related error - Will retry: {str(e)}")
        return True
    # Check for specific Deepgram SDK exceptions if they exist and are known to be retryable
    # Example (pseudo-code, replace with actual Deepgram SDK exceptions if available):
    # if isinstance(e, DeepgramApiTemporaryError) or isinstance(e, DeepgramRateLimitError):
    #     logger.warning(f"Deepgram API Call: Specific retryable SDK error - Will retry: {str(e)}")
    #     return True
    # If Deepgram SDK wraps HTTP errors in a way that status_code is accessible:
    if hasattr(e, 'status_code') and isinstance(getattr(e, 'status_code'), int) and getattr(e, 'status_code') >= 500:
        logger.warning(f"Deepgram API Call: HTTP Server Error ({getattr(e, 'status_code')}) - Will retry: {str(e)}")
        return True
    # Default for generic Exception, could be made more restrictive
    logger.warning(f"Deepgram API Call: Encountered Exception - Defaulting to retry: {str(e)}")
    return True # Be cautious with retrying all generic Exceptions

deepgram_api_retry_decorator = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception(is_retryable_deepgram_error),
    before_sleep=lambda retry_state: logger.info(f"Deepgram API call: Retrying attempt {retry_state.attempt_number} due to: {retry_state.outcome.exception()}")
)

@deepgram_api_retry_decorator
def transcribe_audio_deepgram(audio_file_path: str, deepgram_api_key_param: str = None) -> dict:
    operation_name = "transcribe_audio_deepgram_prerecorded"
    dg_key_to_use = deepgram_api_key_param or DEEPGRAM_API_KEY_GLOBAL
    if not dg_key_to_use:
        logger.error(f"[{operation_name}] Deepgram API key not configured.")
        return {"status": "error", "message": "Deepgram API key not configured or provided.", "code": "DEEPGRAM_CONFIG_ERROR"}

    logger.info(f"[{operation_name}] Attempting to transcribe file: {audio_file_path}")
    try:
        deepgram = DeepgramClient(dg_key_to_use) # Client instantiation per call (or per retry by tenacity)
        if not audio_file_path or not os.path.exists(audio_file_path):
            logger.error(f"[{operation_name}] Audio file not found: {audio_file_path}")
            return {"status": "error", "message": f"Audio file not found: {audio_file_path}", "code": "FILE_NOT_FOUND"}

        with open(audio_file_path, "rb") as audio:
            buffer_data = audio.read()
        payload: FileSource = {"buffer": buffer_data}
        options = PrerecordedOptions(model="nova-2", smart_format=True, utterances=False, punctuate=True)

        # The actual API call that will be retried by tenacity
        response = deepgram.listen.prerecorded.v("1").transcribe_file(payload, options, timeout=120) # Added timeout

        transcript = response.results.channels[0].alternatives[0].transcript if response.results and response.results.channels else ""
        logger.info(f"[{operation_name}] Transcription successful for file: {audio_file_path}. Transcript length: {len(transcript)}")
        return {"status": "success", "data": {"transcript": transcript}}
    except Exception as e: # This will catch errors after tenacity retries are exhausted, or non-retryable errors
        logger.error(f"[{operation_name}] Deepgram API error for pre-recorded audio {audio_file_path}: {e}", exc_info=True)
        # Construct a more detailed error message if possible from 'e'
        error_details = str(e)
        if hasattr(e, 'message'): error_details = getattr(e, 'message')
        if hasattr(e, 'body') and getattr(e, 'body'): error_details += f" | Body: {getattr(e, 'body')}"

        return {"status": "error", "message": f"Deepgram API error for pre-recorded: {error_details}", "code": "DEEPGRAM_API_ERROR"}

def create_processed_audio_note_in_notion(
    title: str,
    transcript: str,
    summary_data: dict, # Expects {"summary": str, "decisions": list, "action_items": list}
    notion_db_id: Optional[str] = None,
    source: Optional[str] = "In-Person Agent Audio Note",
    linked_event_id: Optional[str] = None,
    notion_client_param: Optional[Client] = None
) -> dict:
    client = notion_client_param or notion # Use global or passed client
    if not client: return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}

    # Initialize logger for this function
    logger_func = logging.getLogger(__name__ + ".create_processed_audio_note_in_notion")


    db_id_to_use = notion_db_id or NOTION_NOTES_DATABASE_ID_GLOBAL
    if not db_id_to_use: return {"status": "error", "message": "Notion database ID not configured for notes.", "code": "NOTION_CONFIG_ERROR"}

    properties = {"Title": {"title": [{"text": {"content": title}}]}}
    if source:
        properties["Source"] = {"rich_text": [{"text": {"content": source}}]}
    if linked_event_id:
        properties["Linked Event ID"] = {"rich_text": [{"text": {"content": linked_event_id}}]}

    page_content_blocks = []

    # Summary
    summary = summary_data.get("summary")
    if summary and summary.strip():
        page_content_blocks.append({"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "Summary"}}]}})
        for para in summary.split('\n\n'): # Handle multi-paragraph summaries
            if para.strip():
                 page_content_blocks.append({"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": para.strip()[:1999]}}]}})
        page_content_blocks.append({"type": "divider", "divider": {}})

    # Decisions
    decisions = summary_data.get("decisions", [])
    if decisions and isinstance(decisions, list) and any(str(d).strip() for d in decisions):
        page_content_blocks.append({"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "Key Decisions"}}]}})
        for decision_item in decisions:
            item_text = str(decision_item).strip()
            if item_text:
                page_content_blocks.append({"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": item_text[:1999]}}]}})
        page_content_blocks.append({"type": "divider", "divider": {}})

    # Action Items
    action_items = summary_data.get("action_items", [])
    if action_items and isinstance(action_items, list) and any(str(ai).strip() for ai in action_items):
        page_content_blocks.append({"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "Action Items"}}]}})
        for action_text in action_items:
            item_text = str(action_text).strip()
            if item_text:
                page_content_blocks.append({"type": "to_do", "to_do": {"rich_text": [{"type": "text", "text": {"content": item_text[:1999]}}], "checked": False }})
        page_content_blocks.append({"type": "divider", "divider": {}})

    # Full Transcript
    transcript_header_text = "Full Transcript"
    transcript_paragraph_blocks = []
    if transcript and transcript.strip():
        for para in transcript.split('\n\n'):
            para_content = para.strip()
            if para_content:
                for i in range(0, len(para_content), 1999): # Max length for paragraph content part
                    transcript_paragraph_blocks.append({"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": para_content[i:i+1999]}}]}})
    else:
        transcript_paragraph_blocks.append({"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": "(No transcript available or transcript was empty)"}}]}})

    if len(transcript_paragraph_blocks) > 7 or len(transcript) > 2500 : # Heuristic for toggle
        page_content_blocks.append({
            "type": "toggle",
            "toggle": {
                "rich_text": [{"type": "text", "text": {"content": f"View {transcript_header_text}"}}],
                "children": [ # Children of toggle
                    {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": transcript_header_text}}]}},
                    *transcript_paragraph_blocks[:98] # Max children in toggle append for create
                ]
            }
        })
    else:
        page_content_blocks.append({"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": transcript_header_text}}]}})
        page_content_blocks.extend(transcript_paragraph_blocks)

    try:
        response = client.pages.create(
            parent={"database_id": db_id_to_use},
            properties=properties,
            children=page_content_blocks[:100] # Send the first batch of blocks (up to 100)
        )

        page_id = response["id"]
        page_url = response.get("url")

        # If there are more than 100 blocks, append the rest in batches
        if len(page_content_blocks) > 100:
            logger_func.info(f"Notion note '{title}' has {len(page_content_blocks)} blocks. Appending remaining blocks in batches...")
            for i in range(100, len(page_content_blocks), 100):
                batch_to_append = page_content_blocks[i:i+100]
                try:
                    client.blocks.children.append(
                        block_id=page_id,
                        children=batch_to_append
                    )
                    logger_func.info(f"Successfully appended batch of {len(batch_to_append)} blocks to Notion page '{title}' (ID: {page_id}).")
                except APIResponseError as e_append:
                    logger_func.error(f"Notion API error appending blocks to page {page_id} for '{title}': {e_append.body.get('message', str(e_append))}")
                    # Decide if this should be a fatal error for the whole function
                    # For now, we'll return success for the page creation but log the append error.
                    # The main page is created, but content might be incomplete.
                    # Or, return an error indicating partial success.
                    # Let's add a warning to the success message.
                    return {
                        "status": "warning",
                        "message": f"Page created, but failed to append all content blocks due to API error: {e_append.body.get('message', str(e_append))}",
                        "data": {"page_id": page_id, "url": page_url, "append_error": True},
                        "code": f"NOTION_API_APPEND_{e_append.code.upper()}",
                        "details": e_append.body
                    }
                except Exception as e_append_general:
                    logger_func.error(f"General error appending blocks to page {page_id} for '{title}': {str(e_append_general)}")
                    return {
                        "status": "warning",
                        "message": f"Page created, but failed to append all content blocks due to a general error: {str(e_append_general)}",
                        "data": {"page_id": page_id, "url": page_url, "append_error": True},
                        "code": "NOTION_APPEND_ERROR"
                    }
            logger_func.info(f"All blocks successfully appended for Notion page '{title}' (ID: {page_id}).")

        return {"status": "success", "data": {"page_id": page_id, "url": page_url}}
    except APIResponseError as e:
        logger_func.error(f"Notion API error creating page '{title}': {e.body.get('message', str(e))}")
        return {"status": "error", "message": f"Notion API error: {e.body.get('message', str(e))}", "code": f"NOTION_API_{e.code.upper()}", "details": e.body}
    except Exception as e:
        logger_func.error(f"Error creating Notion processed audio note '{title}': {str(e)}")
        return {"status": "error", "message": f"Error creating Notion processed audio note: {str(e)}", "code": "NOTION_CREATE_ERROR"}


def summarize_transcript_gpt(transcript: str, openai_api_key_param: str = None, gpt_model_param: str = None) -> dict:
    oai_key_to_use = openai_api_key_param or OPENAI_API_KEY_GLOBAL
    model_to_use = gpt_model_param or GPT_MODEL_NAME_GLOBAL
    operation_name = "summarize_transcript_gpt" # For logging context

    if not oai_key_to_use or not oai_key_to_use.startswith('sk-'):
        logger.error(f"[{operation_name}] OpenAI API key not set or invalid.")
        return {"status": "error", "message": "OpenAI API key not set or invalid.", "code": "OPENAI_CONFIG_ERROR"}
    if not transcript or not transcript.strip():
        logger.info(f"[{operation_name}] Transcript was empty or whitespace only.")
        return {"status": "success", "data": {"summary": "Transcript was empty.", "decisions": [], "action_items": [], "key_points": ""}}

    system_prompt = (
        "You are an expert meeting summarizer. Given the meeting transcript, "
        "provide a concise summary, a list of decisions made, and a list of action items. "
        "Respond ONLY with a valid JSON object with three keys: "
        "\"summary\" (string), \"decisions\" (list of strings), and \"action_items\" (list of strings). "
        "Each action item should include potential assignees and deadlines if mentioned. "
        "Example: {\"summary\": \"The meeting was about X...\", \"decisions\": [\"Decision 1 about Y was made.\", \"It was agreed to proceed with Z.\"], \"action_items\": [\"Action: John to complete report by Friday.\", \"Action: Sarah to investigate new tool.\"]}"
    )
    user_prompt = f"Transcript:\n\n{transcript}\n\nPlease provide summary, decisions, and action items in the specified JSON format."
    headers = {"Authorization": f"Bearer {oai_key_to_use}", "Content-Type": "application/json"}
    payload = {"model": model_to_use, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}], "response_format": {"type": "json_object"}, "temperature": 0.3}

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        # Retry on common network errors and 5xx server errors from OpenAI
        # Also retry on 429 (RateLimitError for requests)
        retry=retry_if_exception_type((requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.ChunkedEncodingError)) | \
              (lambda e: isinstance(e, requests.exceptions.HTTPError) and (e.response.status_code >= 500 or e.response.status_code == 429)),
        before_sleep=lambda retry_state: logger.warning(f"[{operation_name}] Retrying OpenAI API call (attempt {retry_state.attempt_number}) for model {model_to_use} due to: {retry_state.outcome.exception()}")
    )
    def _make_openai_request():
        logger.info(f"[{operation_name}] Attempting OpenAI API call (model: {model_to_use}, transcript length: {len(transcript)})")
        response = requests.post(OPENAI_API_ENDPOINT_GLOBAL, headers=headers, json=payload, timeout=120) # 120s timeout
        response.raise_for_status() # Will raise HTTPError for 4xx/5xx
        return response.json()

    try:
        gpt_response_json = _make_openai_request()
        message_content_str = gpt_response_json.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not message_content_str:
            logger.error(f"[{operation_name}] OpenAI response content was empty for model {model_to_use}.", extra={"response_data": gpt_response_json})
            return {"status": "error", "message": "OpenAI response content empty.", "code": "OPENAI_EMPTY_RESPONSE", "details": gpt_response_json}

        parsed_content = json.loads(message_content_str)
        summary = parsed_content.get("summary", "")
        decisions = parsed_content.get("decisions", [])
        action_items = parsed_content.get("action_items", [])

        if not isinstance(summary, str): summary = "" # Ensure summary is a string
        if not isinstance(decisions, list): decisions = [] # Ensure decisions is a list
        if not isinstance(action_items, list): action_items = [] # Ensure action_items is a list

        decisions = [str(item) for item in decisions]
        action_items = [str(item) for item in action_items]
        key_points_str = "\n".join([f"- {item}" for item in action_items]) # Key points derived from action items

        logger.info(f"[{operation_name}] Successfully summarized transcript with model {model_to_use}.")
        return {
            "status": "success",
            "data": { "summary": summary, "decisions": decisions, "action_items": action_items, "key_points": key_points_str }
        }
    except requests.exceptions.HTTPError as e: # Specifically for 4xx/5xx from raise_for_status after retries
        logger.error(f"[{operation_name}] OpenAI API HTTP error after retries: {e.response.status_code} - {e.response.text}", exc_info=True)
        return {"status": "error", "message": f"OpenAI API HTTP error: {e.response.status_code}", "code": f"OPENAI_HTTP_ERROR_{e.response.status_code}", "details": e.response.text}
    except requests.exceptions.RequestException as e: # For network errors, timeouts not resulting in HTTPError after retries
        logger.error(f"[{operation_name}] OpenAI API request error (e.g., network, timeout) after retries: {e}", exc_info=True)
        return {"status": "error", "message": f"OpenAI API request error: {e}", "code": "OPENAI_REQUEST_ERROR"}
    except (json.JSONDecodeError, KeyError, ValueError) as e: # Errors parsing OpenAI response
        response_text_for_log = message_content_str if 'message_content_str' in locals() else str(gpt_response_json if 'gpt_response_json' in locals() else "N/A")
        logger.error(f"[{operation_name}] Error processing OpenAI response: {e}", exc_info=True, extra={"response_text": response_text_for_log})
        return {"status": "error", "message": f"Error processing OpenAI response: {e}", "code": "OPENAI_RESPONSE_PROCESSING_ERROR", "details": response_text_for_log}
    except Exception as e: # Other unexpected errors
        logger.error(f"[{operation_name}] Unexpected error in GPT summarization: {e}", exc_info=True)
        return {"status": "error", "message": f"Unexpected error in GPT summarization: {e}", "code": "UNEXPECTED_SUMMARIZATION_ERROR"}

def process_audio_url_for_notion( audio_url: str, title: str, notion_db_id: str = None, notion_source_text: str = "Audio URL Note", linked_task_id: str = None, linked_event_id: str = None, deepgram_api_key: str = None, openai_api_key: str = None ) -> dict:
    if not notion: return {"status": "error", "message": "Notion client not initialized.", "code": "NOTION_CLIENT_ERROR"}
    temp_audio_file = None
    try:
        with requests.get(audio_url, stream=True, timeout=30) as r:
            r.raise_for_status(); temp_audio_file = tempfile.NamedTemporaryFile(delete=False, suffix=".tmpaudio")
            for chunk in r.iter_content(chunk_size=8192): temp_audio_file.write(chunk)
            temp_audio_file_path = temp_audio_file.name; temp_audio_file.close()
    except requests.exceptions.RequestException as e:
        if temp_audio_file: os.unlink(temp_audio_file.name)
        return {"status": "error", "message": f"Failed to download audio from URL: {audio_url}. Error: {e}", "code": "AUDIO_DOWNLOAD_ERROR"}
    except Exception as e:
        if temp_audio_file and os.path.exists(temp_audio_file.name): os.unlink(temp_audio_file.name)
        return {"status": "error", "message": f"Error preparing audio file from URL: {str(e)}", "code": "FILE_PREPARATION_ERROR"}
    transcript_resp = transcribe_audio_deepgram(temp_audio_file_path, deepgram_api_key_param=deepgram_api_key)
    os.unlink(temp_audio_file_path)
    if transcript_resp["status"] == "error": return {"status": "error", "message": "Transcription failed for downloaded audio.", "code": "TRANSCRIPTION_ERROR", "details": transcript_resp.get("message")}
    transcript = transcript_resp.get("data", {}).get("transcript", ""); summary, key_points = None, None
    if transcript.strip():
        summarize_resp = summarize_transcript_gpt(transcript, openai_api_key_param=openai_api_key)
        if summarize_resp["status"] == "success":
            summary = summarize_resp["data"]["summary"]
            key_points = summarize_resp["data"]["key_points"]
        else:
            logger.warning(f"Summarization failed for audio URL {audio_url}: {summarize_resp['message']}")
    else:
        summary = "No speech detected or transcript was empty."
        key_points = ""

    logger.info(f"Creating Notion note for audio URL {audio_url}, title: {title}")
    create_note_resp = create_notion_note(
        title=title,
        content=f"Note from audio URL: {audio_url}",
        notion_db_id=notion_db_id,
        source=notion_source_text,
        linked_task_id=linked_task_id,
        linked_event_id=linked_event_id,
        transcription=transcript,
        summary=summary,
        key_points=key_points,
        audio_file_link=audio_url
    )

    if create_note_resp["status"] == "success":
        logger.info(f"Successfully created Notion note for audio URL {audio_url}. Page ID: {create_note_resp['data']['page_id']}")
        return {"status": "success", "data": {"notion_page_id": create_note_resp["data"]["page_id"], "url": create_note_resp["data"]["url"], "summary": summary, "key_points": key_points, "transcript_preview": transcript[:200]}}
    else:
        logger.error(f"Failed to create Notion note from audio URL {audio_url}.", extra={"details": create_note_resp.get("message"), "code": create_note_resp.get("code")})
        return {"status": "error", "message": "Failed to create Notion note from audio URL.", "code": "NOTION_CREATE_ERROR", "details": create_note_resp.get("message")}

# get_text_embedding_openai_with_retry is removed as get_text_embedding_openai is now the one with retry logic.

# Original function kept for reference or if non-retry version is needed by other parts.
# The search_routes.py should be updated to call get_text_embedding_openai_with_retry.
# For now, I will modify the original function directly to include tenacity and model change.

def get_text_embedding_openai(text_to_embed: str, openai_api_key_param: str = None, embedding_model: str = "text-embedding-ada-002") -> dict:
    # Default model changed to ada-002
    oai_key_to_use = openai_api_key_param or OPENAI_API_KEY_GLOBAL
    operation_name = "get_text_embedding_openai" # For logging

    if not oai_key_to_use or not oai_key_to_use.startswith('sk-'):
        logger.error(f"[{operation_name}] OpenAI API key not set or invalid.")
        return {"status": "error", "message": "OpenAI API key not set or invalid for embedding.", "code": "OPENAI_CONFIG_ERROR"}
    if not text_to_embed or not text_to_embed.strip():
        logger.warning(f"[{operation_name}] Text to embed cannot be empty.")
        return {"status": "error", "message": "Text to embed cannot be empty.", "code": "VALIDATION_ERROR"}

    # This is the effective function that will be retried
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.APIConnectionError, openai.RateLimitError, openai.APIStatusError)),
        before_sleep=lambda retry_state: logger.info(f"[{operation_name}] Retrying (attempt {retry_state.attempt_number}) due to: {retry_state.outcome.exception()}")
    )
    def _get_embedding_core():
        # logger_nu = logging.getLogger(__name__) # Using module logger now
        attempt_num = getattr(_get_embedding_core, 'retry', {}).get('statistics', {}).get('attempt_number', 1)
        logger.info(f"[{operation_name}] Attempt {attempt_num}: Generating OpenAI embedding with model {embedding_model} for text (first 50): '{text_to_embed[:50]}...'")

        client = openai.OpenAI(api_key=oai_key_to_use)
        response = client.embeddings.create(model=embedding_model, input=text_to_embed.strip())
        return response.data[0].embedding

    try:
        embedding_vector = _get_embedding_core()
        logger.info(f"[{operation_name}] Successfully generated embedding.")
        return {"status": "success", "data": embedding_vector}
    except openai.AuthenticationError as e:
        logger.error(f"[{operation_name}] OpenAI API authentication error (non-retryable): {e}", exc_info=True)
        return {"status": "error", "message": f"OpenAI API authentication error: {e}", "code": "OPENAI_AUTH_ERROR", "details": str(e)}
    except openai.BadRequestError as e:
        logger.error(f"[{operation_name}] OpenAI API BadRequestError (non-retryable): {e}", exc_info=True)
        return {"status": "error", "message": f"OpenAI API bad request: {e}", "code": "OPENAI_BAD_REQUEST", "details": str(e)}
    except Exception as e:
        logger.error(f"[{operation_name}] Failed to generate OpenAI embedding after retries or due to other error: {e}", exc_info=True)
        error_code = "OPENAI_EMBEDDING_ERROR"
        if isinstance(e, openai.RateLimitError): error_code = "OPENAI_RATE_LIMIT_ERROR"
        elif isinstance(e, openai.APIConnectionError): error_code = "OPENAI_CONNECTION_ERROR"
        elif isinstance(e, openai.APIStatusError): error_code = f"OPENAI_API_STATUS_{e.status_code}"
        return {"status": "error", "message": f"Failed to generate OpenAI embedding: {type(e).__name__}", "code": error_code, "details": str(e)}

def embed_and_store_transcript_in_lancedb(
    notion_page_id: str,
    transcript_text: str,
    meeting_title: str,
    meeting_date_iso: Optional[str], # Expect ISO date string or None
    user_id: Optional[str] = None,
    openai_api_key_param: Optional[str] = None, # For OpenAI
    lancedb_uri_param: Optional[str] = None # For LanceDB
) -> dict:
    """
    Generates embedding for the transcript text and stores it in LanceDB
    along with metadata.
    """
    db_path = lancedb_uri_param or os.environ.get("LANCEDB_URI")
    if not db_path:
        return {"status": "error", "message": "LanceDB URI not configured.", "code": "LANCEDB_CONFIG_ERROR"}

    if not notion_page_id or not transcript_text or not meeting_title:
        return {"status": "error", "message": "Missing required fields: notion_page_id, transcript_text, or meeting_title.", "code": "VALIDATION_ERROR"}

    # Handle meeting_date
    parsed_meeting_date: datetime
    if meeting_date_iso:
        try:
            # Attempt to parse ISO format, handling potential 'Z' for UTC
            if meeting_date_iso.endswith("Z"):
                parsed_meeting_date = datetime.fromisoformat(meeting_date_iso[:-1] + "+00:00")
            else:
                parsed_meeting_date = datetime.fromisoformat(meeting_date_iso)
        except ValueError:
            logger.warning(f"Could not parse meeting_date_iso '{meeting_date_iso}'. Defaulting to now.")
            parsed_meeting_date = datetime.now()
    else:
        parsed_meeting_date = datetime.now()
        logger.warning("meeting_date_iso not provided. Defaulting to now.")

    # Generate Text Embedding
    embedding_response = get_text_embedding_openai(
        transcript_text,
        openai_api_key_param=openai_api_key_param
    )

    if embedding_response["status"] == "error":
        return embedding_response # Propagate error from embedding function

    vector_embedding = embedding_response["data"]

    # Store in LanceDB
    store_result = add_transcript_embedding(
        db_path=db_path,
        notion_page_id=notion_page_id,
        meeting_title=meeting_title,
        meeting_date=parsed_meeting_date, # Pass datetime object
        transcript_chunk=transcript_text, # Using full transcript as one chunk for now
        vector_embedding=vector_embedding,
        user_id=user_id
        # table_name defaults to "meeting_transcripts" in add_transcript_embedding
    )

    return store_result

[end of atomic-docker/project/functions/note_utils.py]
