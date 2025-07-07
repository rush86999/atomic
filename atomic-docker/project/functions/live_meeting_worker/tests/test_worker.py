import pytest
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent 'functions' directory and 'live_meeting_worker' to sys.path for imports
FUNCTIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if FUNCTIONS_DIR not in sys.path:
    sys.path.append(FUNCTIONS_DIR)
WORKER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if WORKER_DIR not in sys.path:
    sys.path.append(WORKER_DIR)

# Now import the target module
try:
    from live_meeting_worker import worker as live_meeting_worker
    import psycopg2 # Import psycopg2 to access its specific error types
except ImportError as e:
    # Fallback for environments where path adjustments might not be enough
    # This indicates a setup issue if it happens during actual test runs.
    print(f"CRITICAL IMPORT ERROR in test_worker.py: {e}")
    print(f"sys.path: {sys.path}")
    # Define placeholders if import fails, so tests can be discovered but will likely fail informatively.
    live_meeting_worker = None
    psycopg2 = MagicMock() # Mock psycopg2 if it couldn't be imported
    psycopg2.OperationalError = type('OperationalError', (Exception,), {})
    psycopg2.Error = type('Error', (Exception,), {})


@pytest.fixture(autouse=True)
def mock_env_vars_for_db():
    """Mocks environment variables for DB connection parameters."""
    env_vars = {
        "POSTGRES_HOST": "testhost",
        "POSTGRES_PORT": "5432",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
        "POSTGRES_DB": "testdb"
    }
    with patch.dict(os.environ, env_vars):
        # If live_meeting_worker re-imports os or re-evaluates DB_CONN_PARAMS at module level upon import,
        # it might be necessary to reload it here.
        # For now, assuming DB_CONN_PARAMS is evaluated when get_db_connection is called or at least after this fixture.
        if live_meeting_worker: # If module was imported successfully
            import importlib
            importlib.reload(live_meeting_worker) # Reload to pick up new DB_CONN_PARAMS
        yield

@pytest.fixture
def mock_psycopg2_unavailable():
    """Fixture to simulate psycopg2 not being available."""
    # Temporarily set PSYCOPG2_AVAILABLE to False in the worker module
    if live_meeting_worker:
        with patch.object(live_meeting_worker, 'PSYCOPG2_AVAILABLE', False):
            yield
    else: # If worker module itself failed to import, just yield
        yield


# --- Tests for get_db_connection ---

@patch('live_meeting_worker.worker.psycopg2.connect')
@patch('live_meeting_worker.worker.logger')
def test_get_db_connection_success_first_try(mock_logger, mock_connect, mock_env_vars_for_db):
    """Test successful DB connection on the first attempt."""
    if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")

    mock_connection_instance = MagicMock()
    mock_connect.return_value = mock_connection_instance

    conn = live_meeting_worker.get_db_connection()

    assert conn == mock_connection_instance
    mock_connect.assert_called_once_with(
        host="testhost", port="5432", user="testuser", password="testpassword", dbname="testdb"
    )
    # Check for the successful connection log
    successful_log_found = any("Successfully connected to PostgreSQL" in call[0][0] for call in mock_logger.info.call_args_list)
    assert successful_log_found

@patch('live_meeting_worker.worker.psycopg2.connect')
@patch('live_meeting_worker.worker.logger')
def test_get_db_connection_retry_and_success(mock_logger, mock_connect, mock_env_vars_for_db):
    """Test DB connection succeeds after a few retries on OperationalError."""
    if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")

    mock_connection_instance = MagicMock()
    mock_connect.side_effect = [
        psycopg2.OperationalError("Simulated connection failure 1"),
        psycopg2.OperationalError("Simulated connection failure 2"),
        mock_connection_instance # Success on the third attempt
    ]

    conn = live_meeting_worker.get_db_connection()

    assert conn == mock_connection_instance
    assert mock_connect.call_count == 3

    # Check for retry logs
    retry_log_calls = [call[0][0] for call in mock_logger.info.call_args_list if "Retrying DB connection" in call[0][0]]
    assert len(retry_log_calls) == 2
    assert "attempt 2" in retry_log_calls[0]
    assert "attempt 3" in retry_log_calls[1]

    # Check for the error logs during failed attempts
    error_log_calls = [call[0][0] for call in mock_logger.error.call_args_list if "OperationalError connecting to PostgreSQL" in call[0][0]]
    assert len(error_log_calls) == 2 # Two failed attempts logged

    successful_log_found = any("Successfully connected to PostgreSQL" in call[0][0] for call in mock_logger.info.call_args_list)
    assert successful_log_found


@patch('live_meeting_worker.worker.psycopg2.connect')
@patch('live_meeting_worker.worker.logger')
def test_get_db_connection_final_failure_after_retries(mock_logger, mock_connect, mock_env_vars_for_db):
    """Test DB connection fails after all retries."""
    if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")

    mock_connect.side_effect = psycopg2.OperationalError("Persistent connection failure")

    with pytest.raises(psycopg2.OperationalError, match="Persistent connection failure"):
        live_meeting_worker.get_db_connection()

    assert mock_connect.call_count == 3 # Max attempts

    retry_log_calls = [call[0][0] for call in mock_logger.info.call_args_list if "Retrying DB connection" in call[0][0]]
    assert len(retry_log_calls) == 2

    error_log_calls = [call[0][0] for call in mock_logger.error.call_args_list if "OperationalError connecting to PostgreSQL" in call[0][0]]
    assert len(error_log_calls) == 3 # All 3 attempts logged error before raising/retrying


@patch('live_meeting_worker.worker.psycopg2.connect')
@patch('live_meeting_worker.worker.logger')
def test_get_db_connection_non_retryable_psycopg2_error(mock_logger, mock_connect, mock_env_vars_for_db):
    """Test that non-OperationalError psycopg2 errors are not retried and return None."""
    if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")

    # Example: psycopg2.InterfaceError or other psycopg2.Error subclasses not being OperationalError
    # Ensure the error is a subclass of psycopg2.Error but not psycopg2.OperationalError
    class NonRetryableDBError(psycopg2.Error): pass
    mock_connect.side_effect = NonRetryableDBError("Non-retryable database error")

    conn = live_meeting_worker.get_db_connection()

    assert conn is None
    assert mock_connect.call_count == 1 # Should not retry

    # Check for the specific log for non-retryable errors
    non_retryable_error_log_found = any(
        "Non-retryable psycopg2.Error connecting to PostgreSQL" in call[0][0]
        for call in mock_logger.error.call_args_list
    )
    assert non_retryable_error_log_found

    # Ensure no retry logs were made
    retry_log_calls = [call[0][0] for call in mock_logger.info.call_args_list if "Retrying DB connection" in call[0][0]]
    assert len(retry_log_calls) == 0


def test_get_db_connection_psycopg2_not_available(mock_psycopg2_unavailable, mock_env_vars_for_db):
    """Test behavior when psycopg2 is not available."""
    if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")

    # We need to patch logger inside worker for this specific scenario if PSYCOPG2_AVAILABLE is False from start
    with patch('live_meeting_worker.worker.logger') as mock_logger_in_test:
        conn = live_meeting_worker.get_db_connection()
        assert conn is None
        mock_logger_in_test.warning.assert_any_call("psycopg2 not available, cannot connect to DB.")

# Note: More tests could be added for init_task_status and update_task_status
# to verify their DB interactions, especially around error handling and logging.
# However, the primary goal here was to test the tenacity retry logic for get_db_connection.
# Testing those would require mocking get_db_connection itself to return a mock connection
# with a mock cursor, which is standard practice for testing DB interaction logic.
# For now, focusing on the connection retry.
#
# Example structure for testing update_task_status (conceptual):
# @patch('live_meeting_worker.worker.get_db_connection')
# @patch('live_meeting_worker.worker.logger')
# def test_update_task_status_success(mock_logger, mock_get_db_conn):
#   if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")
#   mock_conn_instance = MagicMock()
#   mock_cursor_instance = MagicMock()
#   mock_get_db_conn.return_value = mock_conn_instance
#   mock_conn_instance.cursor.return_value.__enter__.return_value = mock_cursor_instance # For 'with conn.cursor() as cur:'
#   mock_cursor_instance.rowcount = 1
#
#   live_meeting_worker.update_task_status("task123", "New Status")
#
#   mock_get_db_conn.assert_called_once()
#   mock_cursor_instance.execute.assert_called_once()
#   mock_conn_instance.commit.assert_called_once()
#   mock_conn_instance.close.assert_called_once()
#   # Assert logger calls for success
#   mock_logger.info.assert_any_call("DB Status (Task task123): Updated status to 'New Status'.")
#
# @patch('live_meeting_worker.worker.get_db_connection')
# @patch('live_meeting_worker.worker.logger')
# def test_update_task_status_db_error(mock_logger, mock_get_db_conn):
#   if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")
#   mock_conn_instance = MagicMock()
#   mock_get_db_conn.return_value = mock_conn_instance
#   mock_conn_instance.cursor.side_effect = psycopg2.Error("Simulated DB update error") # Simulate error during cursor op
#
#   live_meeting_worker.update_task_status("task456", "Error Status")
#
#   mock_conn_instance.rollback.assert_called_once()
#   mock_logger.error.assert_any_call(
#       "DB Status (Task task456): Error updating task status to 'Error Status': Simulated DB update error",
#       exc_info=True
#   )
#
# def test_update_task_status_no_db_connection(mock_logger_global_patch): # Assume logger is patched globally for worker
#   if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")
#   with patch('live_meeting_worker.worker.get_db_connection', return_value=None) as mock_get_db_conn_none:
#        live_meeting_worker.update_task_status("task789", "Status With No DB")
#        mock_get_db_conn_none.assert_called_once()
#        # Check logger for "No DB connection" message
#        mock_logger_global_patch.error.assert_any_call("DB Status (Task task789): No DB connection. Skipping update_task_status to 'Status With No DB'.")
#
# def test_update_task_status_psycopg2_not_available(mock_logger_global_patch, mock_psycopg2_unavailable):
#   if not live_meeting_worker: pytest.skip("live_meeting_worker module not imported.")
#   live_meeting_worker.update_task_status("task101", "Status With No Psycopg")
#   mock_logger_global_patch.warning.assert_any_call("DB Status (Task task101): psycopg2 not available. Skipping update_task_status to 'Status With No Psycopg'.")

# Global logger patch for tests that don't explicitly patch it, if needed for broader checks
# @pytest.fixture(autouse=True) # If you want it for all tests in this file
# def mock_logger_global_patch():
#    if live_meeting_worker:
#        with patch.object(live_meeting_worker, 'logger', new_callable=MagicMock) as mock_log:
#            yield mock_log
#    else:
#        yield MagicMock() # Dummy mock if worker isn't loaded
