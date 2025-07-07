import pytest
from unittest.mock import patch, MagicMock
import os

# Assuming research_agent.py is in the same directory or PYTHONPATH is set up correctly
# For sibling imports in tests, ensure the module can be found.
# If research_agent is in 'atom-agent' and tests are in 'atom-agent', this relative import should work.
try:
    from . import research_agent
    from serpapi import SerpApiClientException # Import for simulating errors
except ImportError:
    # Fallback if running script directly or path issues
    import research_agent
    from serpapi import SerpApiClientException


# Fixture to set environment variables for SERPAPI_API_KEY
@pytest.fixture(autouse=True) # Apply to all tests in this module
def mock_serpapi_key_env():
    with patch.dict(os.environ, {"SERPAPI_API_KEY": "test_serp_api_key"}):
        # Reload research_agent to pick up the mocked env var if it's loaded at module level
        # This is important if SERPAPI_API_KEY_GLOBAL is set on import
        import importlib
        importlib.reload(research_agent)
        yield


@patch('research_agent.GoogleSearch') # Patch GoogleSearch in the research_agent module
def test_python_search_web_wrapper_success(mock_google_search_constructor):
    mock_search_instance = MagicMock()
    mock_google_search_constructor.return_value = mock_search_instance

    expected_results_data = {
        "organic_results": [{
            "title": "Test Title 1", "link": "http://example.com/1", "snippet": "Test snippet 1"
        }, {
            "title": "Test Title 2", "link": "http://example.com/2", "snippet": "Test snippet 2"
        }]
    }
    mock_search_instance.get_dict.return_value = expected_results_data

    result = research_agent.python_search_web_wrapper("test query")

    assert result["status"] == "success"
    assert len(result["data"]) == 2
    assert result["data"][0]["title"] == "Test Title 1"
    mock_google_search_constructor.assert_called_once_with({
        "q": "test query",
        "api_key": "test_serp_api_key",
        "engine": "google",
        "timeout": 20
    })
    mock_search_instance.get_dict.assert_called_once()


@patch('research_agent.GoogleSearch')
@patch('research_agent.logger') # Patch the logger
def test_python_search_web_wrapper_retry_on_serpapi_client_exception(mock_logger, mock_google_search_constructor):
    mock_search_instance = MagicMock()
    mock_google_search_constructor.return_value = mock_search_instance

    # Simulate SerpApiClientException that should be retried (e.g., timeout)
    # The retry logic retries on SerpApiClientException or ConnectionError broadly.
    # For SerpApiClientException, the custom is_retryable_serpapi_exception is commented out,
    # so any SerpApiClientException will be retried.
    retryable_error = SerpApiClientException("Request timed out.")

    successful_response_data = {
        "organic_results": [{"title": "Success After Retry", "link": "http://example.com/retry", "snippet": "Snippet"}]
    }

    mock_search_instance.get_dict.side_effect = [
        retryable_error,
        retryable_error,
        successful_response_data
    ]

    result = research_agent.python_search_web_wrapper("retry test query")

    assert mock_search_instance.get_dict.call_count == 3
    assert result["status"] == "success"
    assert result["data"][0]["title"] == "Success After Retry"

    # Check logger calls for retries
    # Example: logger.info(f"Retrying SerpApi call for query '{query}' (attempt {retry_state.attempt_number}) ...")
    assert mock_logger.info.call_count >= 2 # At least 2 retry logs + other info logs
    retry_log_calls = [call_args[0][0] for call_args in mock_logger.info.call_args_list if "Retrying SerpApi call" in call_args[0][0]]
    assert len(retry_log_calls) == 2
    assert "attempt 2" in retry_log_calls[0]
    assert "attempt 3" in retry_log_calls[1]


@patch('research_agent.GoogleSearch')
@patch('research_agent.logger')
def test_python_search_web_wrapper_final_failure_after_retries(mock_logger, mock_google_search_constructor):
    mock_search_instance = MagicMock()
    mock_google_search_constructor.return_value = mock_search_instance

    final_error_message = "Persistent API error"
    # Simulate an error that will persist through retries
    mock_search_instance.get_dict.side_effect = SerpApiClientException(final_error_message)

    result = research_agent.python_search_web_wrapper("final fail query")

    assert mock_search_instance.get_dict.call_count == 3 # Max attempts
    assert result["status"] == "error"
    assert final_error_message in result["message"]
    assert result["code"] == "SEARCH_API_ERROR_FINAL" # Code for error after retries

    retry_log_calls = [call_args[0][0] for call_args in mock_logger.info.call_args_list if "Retrying SerpApi call" in call_args[0][0]]
    assert len(retry_log_calls) == 2

    # Check for the final error log from the wrapper
    final_error_log_found = False
    for call_args in mock_logger.error.call_args_list:
        if final_error_message in call_args[0][0] and "after retries" in call_args[0][0]:
            final_error_log_found = True
            break
    assert final_error_log_found


@patch('research_agent.GoogleSearch')
def test_python_search_web_wrapper_non_retryable_error_in_response_body(mock_google_search_constructor):
    mock_search_instance = MagicMock()
    mock_google_search_constructor.return_value = mock_search_instance

    # This error is in the response body, not an exception, so tenacity won't retry it.
    error_response_data = {
        "error": "Your API key is invalid.",
        "search_parameters": {"q": "test query"}
    }
    mock_search_instance.get_dict.return_value = error_response_data

    result = research_agent.python_search_web_wrapper("test query with bad key info")

    assert mock_search_instance.get_dict.call_count == 1 # No retry
    assert result["status"] == "error"
    assert "Your API key is invalid." in result["message"]
    assert result["code"] == "SEARCH_API_AUTH_ERROR_RESPONSE" # Specific code for this case


def test_python_search_web_wrapper_no_serpapi_key():
    # Temporarily remove SERPAPI_API_KEY from environ for this test
    with patch.dict(os.environ, {}, clear=True): # Clear all, or just remove the key
        import importlib
        importlib.reload(research_agent) # Reload to make it pick up empty env

        result = research_agent.python_search_web_wrapper("query without key")
        assert result["status"] == "error"
        assert "Search API key is missing." in result["message"]
        assert result["code"] == "CONFIG_ERROR_SEARCH_KEY"
    # mock_serpapi_key_env fixture will restore it for other tests
