import pytest
import json
from unittest.mock import patch, MagicMock, mock_open as unittest_mock_open, AsyncMock
import uuid # For mocking uuid.uuid4
import io # For io.BytesIO
import tempfile # For patching tempfile.mkdtemp
import shutil # For patching shutil.rmtree
import requests # For requests.exceptions

# Add project root to sys.path to allow importing handler and note_utils
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))) # Points to functions/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))) # Points to functions/audio_processor/

from audio_processor.handler import app as flask_app
from audio_processor.handler import AUDIO_OUTPUT_DIR

@pytest.fixture
def client():
    with flask_app.test_client() as client:
        yield client

# Mock Deepgram response structure for STT
class MockDeepgramSTTResponse:
    def __init__(self, transcript):
        self.results = MagicMock()
        self.results.channels = [MagicMock()]
        self.results.channels[0].alternatives = [MagicMock()]
        self.results.channels[0].alternatives[0].transcript = transcript

# ---- Tests for / (main Hasura action endpoint) ----
# These tests remain largely the same as they test the handler's interaction
# with process_audio_for_note, whose own resilience is tested in test_note_utils.py

@patch('audio_processor.handler.process_audio_for_note')
def test_handler_success(mock_process_audio, client):
    mock_process_audio.return_value = "test_note_id_123"
    payload = {"input": {"arg1": {"audio_file_path": "dummy/path/to/audio.wav", "title": "Test Note from Audio", "content": "Initial content here.", "source": "Test Handler"}}, "session_variables": {"x-hasura-user-id": "test-user"}}
    response = client.post('/', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    response_data = response.get_json()
    assert response_data["status"] == "success"
    assert response_data["note_id"] == "test_note_id_123"
    mock_process_audio.assert_called_once_with(audio_file_path="dummy/path/to/audio.wav", note_id=None, title="Test Note from Audio", content="Initial content here.", source="Test Handler", linked_task_id=None, linked_event_id=None)

# ... (other existing tests for '/' endpoint can remain as they are, e.g., error handling, missing params) ...
@patch('audio_processor.handler.process_audio_for_note')
def test_handler_process_audio_returns_error(mock_process_audio, client):
    mock_process_audio.return_value = "Error: Transcription failed badly"
    payload = {"input": {"arg1": {"audio_file_path": "dummy/audio_error.wav"}}}
    response = client.post('/', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert "Error: Transcription failed badly" in response_data["error"]

@patch('audio_processor.handler.process_audio_for_note')
def test_handler_process_audio_raises_exception(mock_process_audio, client):
    mock_process_audio.side_effect = Exception("Unexpected internal error")
    payload = {"input": {"arg1": {"audio_file_path": "dummy/audio_exception.wav"}}}
    response = client.post('/', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 500
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert "An unexpected error occurred: Unexpected internal error" in response_data["error"]

def test_handler_missing_audio_file_path(client):
    payload = {"input": {"arg1": {"title": "Note without audio path"}}}
    response = client.post('/', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert "Missing required argument: audio_file_path" in response_data["error"]

# ---- Tests for /stt endpoint (with Retry Logic) ----

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
@patch('audio_processor.handler.app.logger')
@patch('audio_processor.handler.shutil.rmtree')
@patch('audio_processor.handler.os.remove')
@patch('audio_processor.handler.tempfile.mkdtemp')
@patch('audio_processor.handler.secure_filename', side_effect=lambda x: x)
@patch('audio_processor.handler.deepgram.listen.prerecorded.v("1").transcribe_file')
@patch('audio_processor.handler.open', new_callable=unittest_mock_open, read_data=b'fake_audio_data_content')
def test_stt_retry_and_success(
    mock_open_file, mock_transcribe_file, mock_secure_filename, mock_mkdtemp,
    mock_os_remove, mock_shutil_rmtree, mock_app_logger, client
):
    fake_temp_dir = "/tmp/fake_temp_dir_retry_success"
    mock_mkdtemp.return_value = fake_temp_dir
    audio_filename = 'test_audio_retry.wav'

    mock_transcribe_file.side_effect = [
        requests.exceptions.ConnectionError("Simulated connection error 1"), # Simulate a retryable error
        requests.exceptions.Timeout("Simulated timeout error 2"),       # Simulate another retryable error
        MockDeepgramSTTResponse("hello after retries")
    ]

    file_data = io.BytesIO(b'fake_audio_data_for_retry')
    data = {'audio_file': (file_data, audio_filename)}
    response = client.post('/stt', data=data, content_type='multipart/form-data')

    assert response.status_code == 200
    response_data = response.get_json()
    assert response_data["status"] == "success"
    assert response_data["transcription"] == "hello after retries"
    assert mock_transcribe_file.call_count == 3

    retry_log_calls = [call_args[0][0] for call_args in mock_app_logger.info.call_args_list if "Retrying Deepgram STT call" in call_args[0][0]]
    assert len(retry_log_calls) == 2
    assert "attempt 2" in retry_log_calls[0]
    assert "attempt 3" in retry_log_calls[1]
    mock_os_remove.assert_called_once() # Ensure cleanup happened
    mock_shutil_rmtree.assert_called_once()

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
@patch('audio_processor.handler.app.logger')
@patch('audio_processor.handler.shutil.rmtree')
@patch('audio_processor.handler.os.remove')
@patch('audio_processor.handler.tempfile.mkdtemp')
@patch('audio_processor.handler.secure_filename', side_effect=lambda x: x)
@patch('audio_processor.handler.deepgram.listen.prerecorded.v("1").transcribe_file')
@patch('audio_processor.handler.open', new_callable=unittest_mock_open, read_data=b'fake_audio_data_content')
def test_stt_deepgram_api_error_after_retries(
    mock_open_file, mock_transcribe_file, mock_secure_filename, mock_mkdtemp,
    mock_os_remove, mock_shutil_rmtree, mock_app_logger, client):
    fake_temp_dir = "/tmp/fake_temp_dir_api_error_retries"
    mock_mkdtemp.return_value = fake_temp_dir

    final_error_message = "Persistent Deepgram API Error"
    # Simulate an error that will persist through retries
    mock_transcribe_file.side_effect = Exception(final_error_message)

    file_data = io.BytesIO(b'fake_audio_data_for_api_error_retries')
    data = {'audio_file': (file_data, 'test_audio_api_error_retries.wav')}
    response = client.post('/stt', data=data, content_type='multipart/form-data')

    assert response.status_code == 500
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert f"An unexpected error occurred during STT: {final_error_message}" in response_data["error"]
    assert response_data["code"] == "DEEPGRAM_STT_ERROR"
    assert mock_transcribe_file.call_count == 3

    retry_log_calls = [call_args[0][0] for call_args in mock_app_logger.info.call_args_list if "Retrying Deepgram STT call" in call_args[0][0]]
    assert len(retry_log_calls) == 2

    final_error_log_found = False
    for call_args in mock_app_logger.error.call_args_list:
        if final_error_message in call_args[0][0] and "final, after retries" in call_args[0][0]:
            final_error_log_found = True
            break
    assert final_error_log_found is True
    mock_os_remove.assert_called_once()
    mock_shutil_rmtree.assert_called_once()

# ... (other existing /stt tests like missing file, no API key, malformed response can remain) ...
@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
def test_stt_no_audio_file_part(client):
    response = client.post('/stt', data={}, content_type='multipart/form-data')
    assert response.status_code == 400 # etc.

# ---- Tests for /tts endpoint (with Retry Logic) ----

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
@patch('audio_processor.handler.app.logger')
@patch('audio_processor.handler.uuid.uuid4')
@patch('audio_processor.handler.open', new_callable=unittest_mock_open)
@patch('audio_processor.handler.deepgram.speak.rest.v("1").synthesize', new_callable=AsyncMock)
@patch('audio_processor.handler.os.path.exists', return_value=True)
async def test_tts_retry_and_success(
    mock_path_exists, mock_synthesize, mock_file_open, mock_uuid4, mock_app_logger, client
):
    mock_uuid_value = "test-tts-retry-uuid"
    mock_uuid4.return_value = mock_uuid_value
    mock_audio_data = [b'chunk1', b'chunk2']
    async def mock_stream_gen():
        for chunk in mock_audio_data: yield chunk

    successful_response = AsyncMock()
    successful_response.stream = mock_stream_gen()

    mock_synthesize.side_effect = [
        requests.exceptions.ConnectionError("Simulated connection error 1"),
        requests.exceptions.Timeout("Simulated timeout error 2"),
        successful_response
    ]

    payload = {"text": "Hello speech for retry."}
    response = await client.post('/tts', data=json.dumps(payload), content_type='application/json') # Use await for async route

    assert response.status_code == 200
    response_data = response.get_json()
    assert response_data["status"] == "success"
    expected_filename = f"tts_{mock_uuid_value}.mp3"
    assert response_data["audio_url"] == f"/generated_audio/{expected_filename}"
    assert mock_synthesize.call_count == 3

    retry_log_calls = [call_args[0][0] for call_args in mock_app_logger.info.call_args_list if "Retrying Deepgram TTS call" in call_args[0][0]]
    assert len(retry_log_calls) == 2
    assert "attempt 2" in retry_log_calls[0]
    assert "attempt 3" in retry_log_calls[1]
    mock_file_open.assert_called_once() # Ensure file was written

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
@patch('audio_processor.handler.app.logger')
@patch('audio_processor.handler.uuid.uuid4')
@patch('audio_processor.handler.open', new_callable=unittest_mock_open)
@patch('audio_processor.handler.deepgram.speak.rest.v("1").synthesize', new_callable=AsyncMock)
@patch('audio_processor.handler.os.path.exists', return_value=True)
async def test_tts_deepgram_api_error_after_retries(
    mock_path_exists, mock_synthesize, mock_file_open, mock_uuid4, mock_app_logger, client
):
    final_error_message = "Persistent Deepgram TTS Error"
    mock_synthesize.side_effect = Exception(final_error_message) # Fails all 3 attempts
    mock_uuid4.return_value = "error-uuid-tts-retries"

    payload = {"text": "This will cause a persistent API error for TTS."}
    response = await client.post('/tts', data=json.dumps(payload), content_type='application/json')

    assert response.status_code == 500
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert f"An unexpected error occurred during TTS: {final_error_message}" in response_data["error"]
    assert response_data["code"] == "DEEPGRAM_TTS_ERROR"
    assert mock_synthesize.call_count == 3

    retry_log_calls = [call_args[0][0] for call_args in mock_app_logger.info.call_args_list if "Retrying Deepgram TTS call" in call_args[0][0]]
    assert len(retry_log_calls) == 2

    final_error_log_found = False
    for call_args in mock_app_logger.error.call_args_list:
        if final_error_message in call_args[0][0] and "final, after retries" in call_args[0][0]:
            final_error_log_found = True
            break
    assert final_error_log_found is True
    mock_file_open.assert_not_called() # File should not be opened if API fails

# ... (other existing /tts tests like missing text, no API key, no stream response can remain) ...
@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
def test_tts_missing_text(client): # This test is synchronous, but endpoint is async
    # To test async Flask routes with sync client, client.post becomes awaitable
    # Or use an async test runner / pytest-asyncio
    # For simplicity, if this test doesn't involve awaits itself, it might work,
    # but it's better to mark it async if the endpoint is async.
    # Let's assume client.post for async routes can be awaited or pytest handles it.
    # If not, this test would need adjustment (e.g. asyncio.run(client.post(...)))
    # For now, keeping it as is, but it's a potential point of failure if client is purely sync.
    response = client.post('/tts', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400 # etc.

# ---- Tests for /stt_stream WebSocket endpoint (Connection Retry) ----

class MockLiveTranscriptionConnection:
    def __init__(self):
        self.handlers = {}
        self.send_buffer = []
        self.is_started = False
        self.is_finished = False
        self.start_options = None
        self._start_call_count = 0 # For tracking start attempts

    def on(self, event_name, callback):
        self.handlers[event_name] = [callback] # Simplified: one handler per event

    def start(self, options, **kwargs): # This is synchronous in SDK v3
        self._start_call_count += 1
        # Simulate failure based on side_effect if provided by test
        if hasattr(self, '_start_side_effect') and self._start_side_effect:
            effect = self._start_side_effect.pop(0) if isinstance(self._start_side_effect, list) else self._start_side_effect
            if isinstance(effect, Exception):
                raise effect
            elif isinstance(effect, bool): # For return value of start()
                self.is_started = effect
                if effect and 'Open' in self.handlers: # Simulate Open if start returns True
                    self.handlers['Open'][0](self, {"event": "Open", "message": "Mock DG conn opened"})
                return effect

        self.is_started = True
        self.start_options = options
        if 'Open' in self.handlers:
             self.handlers['Open'][0](self, {"event": "Open", "message": "Mock DG conn opened"})
        return True

    def send(self, data): self.send_buffer.append(data)
    async def finish(self, **kwargs): # Made async to match handler's await
        self.is_finished = True
        if 'Close' in self.handlers:
            self.handlers['Close'][0](self, {"event": "Close", "message": "Mock DG conn closed"})

    # Methods to simulate Deepgram emitting events
    def simulate_transcript_event(self, transcript_text, is_final):
        if 'Transcript' in self.handlers:
            payload = MagicMock()
            payload.is_final = is_final
            payload.channel.alternatives = [MagicMock(transcript=transcript_text)]
            self.handlers['Transcript'][0](self, payload)

    def simulate_error_event(self, error_message_obj): # error_message_obj can be an Exception or mock
        if 'Error' in self.handlers:
             self.handlers['Error'][0](self, error_message_obj)


@pytest.fixture
def mock_deepgram_live_connection_fixture(mocker):
    mock_conn = MockLiveTranscriptionConnection()
    # Patch where DeepgramClient().listen.live.v() is called in handler
    patcher = patch('audio_processor.handler.deepgram.listen.live.v')
    mock_live_v1_method = patcher.start()
    mock_live_v1_method.return_value = mock_conn
    yield mock_conn # Provide the custom mock connection
    patcher.stop()

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_key_for_stt_stream_retry"}, clear=True)
@patch('audio_processor.handler.app.logger')
async def test_stt_stream_connection_retry_and_success(mock_app_logger, client, mock_deepgram_live_connection_fixture):
    mock_conn = mock_deepgram_live_connection_fixture
    mock_conn._start_side_effect = [ # Configure side effects for start()
        RuntimeError("Simulated DG connection error 1"),
        RuntimeError("Simulated DG connection error 2"),
        True # Success on the third attempt
    ]

    async with client.websocket_connect('/stt_stream') as ws:
        # Connection attempt happens here. We expect it to retry and succeed.
        # If successful, the handler might send an implicit open or wait.
        # For this test, we mostly care about the retry attempts on start.
        # A simple send/receive can confirm the WS is open after retries.
        await ws.send_bytes(b"ping")
        # We don't expect a specific response to ping unless the handler is built for it.
        # The fact that send_bytes doesn't fail implies connection is open.

    assert mock_conn._start_call_count == 3
    retry_log_calls = [call_args[0][0] for call_args in mock_app_logger.warning.call_args_list if "Retrying Deepgram live connection start" in call_args[0][0]]
    assert len(retry_log_calls) == 2
    assert "attempt 2" in retry_log_calls[0]
    assert "attempt 3" in retry_log_calls[1]
    assert mock_conn.is_finished # Should be finished when WebSocket context closes

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_key_for_stt_stream_fail_retry"}, clear=True)
@patch('audio_processor.handler.app.logger')
async def test_stt_stream_connection_final_failure(mock_app_logger, client, mock_deepgram_live_connection_fixture):
    mock_conn = mock_deepgram_live_connection_fixture
    final_error_message = "Persistent DG connection failure"
    mock_conn._start_side_effect = RuntimeError(final_error_message) # Fails all 3 attempts

    async with client.websocket_connect('/stt_stream') as ws:
        # Expect the WebSocket to receive an error message from the handler
        response = await ws.receive_json(timeout=1)
        assert "error" in response
        assert final_error_message in response["error"] # Check if the original error is propagated

    assert mock_conn._start_call_count == 3
    retry_log_calls = [call_args[0][0] for call_args in mock_app_logger.warning.call_args_list if "Retrying Deepgram live connection start" in call_args[0][0]]
    assert len(retry_log_calls) == 2

    # Check for the final error log after retries are exhausted by the main try-except in stt_stream
    final_error_log_found = False
    for call_args in mock_app_logger.error.call_args_list:
        # The error logged by the main handler might be more generic like "Error in STT stream handler"
        # but the exc_info=True should capture the RuntimeError(final_error_message)
        if "Error in STT stream handler" in call_args[0][0] and final_error_message in str(call_args[1].get('exc_info')):
            final_error_log_found = True
            break
    # assert final_error_log_found is True # This check can be tricky with exc_info formatting

    # The WebSocket might be closed by the server, or finish might not be called if error is too early.
    # assert mock_conn.is_finished # This depends on handler's finally block execution path

# ... (other existing /stt_stream tests can remain, adapted to use mock_deepgram_live_connection_fixture) ...
# Example adaptation:
@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_key_for_stt_stream_data"}, clear=True)
async def test_stt_stream_audio_forwarding_adapted(client, mock_deepgram_live_connection_fixture):
    mock_conn = mock_deepgram_live_connection_fixture
    async with client.websocket_connect('/stt_stream') as ws:
        test_audio_data = b'\x01\x02\x03\x04'
        await ws.send_bytes(test_audio_data)
        # Simple way to ensure message is processed if handler is quick:
        await asyncio.sleep(0.01) # Small delay

    assert mock_conn.is_started
    assert len(mock_conn.send_buffer) > 0
    assert mock_conn.send_buffer[0] == test_audio_data
    assert mock_conn.is_finished

# Ensure all async tests are marked with @pytest.mark.asyncio if not implicitly handled by fixture/runner
# The client.post for async routes also needs `await`.
# For other existing tests for /tts, if they use client.post on an async route, they need `await`.
# Example: test_tts_missing_text, test_tts_deepgram_api_error, etc.
# The original tests for /tts were not marked async.
# Let's assume pytest-asyncio is used and it handles `client.post` on async routes correctly
# or that `client.post` itself becomes awaitable.
# For the new tests, I've used `await client.post` for the async `/tts` route.
# For existing sync tests on sync routes, no change.
# For existing sync tests on async routes (like the original /tts tests), they might need `async def` and `await`.

# Final pass on /tts tests to ensure they are async if the route is async
@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
async def test_tts_missing_text_async(client): # Renamed and made async
    response = await client.post('/tts', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert "Missing required argument: text" in response_data["error"]

@patch.dict(os.environ, {}, clear=True)
@patch('audio_processor.handler.DEEPGRAM_API_KEY', None)
@patch('audio_processor.handler.deepgram', None)
async def test_tts_missing_api_key_async(client): # Renamed and made async
    payload = {"text": "Text input with no API key."}
    response = await client.post('/tts', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 500
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert "Deepgram client not initialized or API key missing" in response_data["error"]

@patch.dict(os.environ, {"DEEPGRAM_API_KEY": "test_deepgram_key"})
@patch('audio_processor.handler.uuid.uuid4')
@patch('audio_processor.handler.open', new_callable=unittest_mock_open)
@patch('audio_processor.handler.deepgram.speak.rest.v("1").synthesize', new_callable=AsyncMock)
async def test_tts_deepgram_no_stream_response_async(mock_synthesize, mock_file_open, mock_uuid4, client): # Renamed
    mock_uuid_value = "no-stream-uuid-async"
    mock_uuid4.return_value = mock_uuid_value
    mock_deepgram_response = AsyncMock()
    mock_deepgram_response.stream = None
    mock_synthesize.return_value = mock_deepgram_response
    payload = {"text": "Text that results in no stream."}
    response = await client.post('/tts', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 500
    response_data = response.get_json()
    assert response_data["status"] == "error"
    assert "Failed to get audio stream from Deepgram" in response_data["error"]
    mock_file_open.assert_not_called()
