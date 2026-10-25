/**
 * Safe fetch helper that gracefully handles JSON responses
 * and prevents "SyntaxError: Unexpected token '<', '<!DOCTYPE '... is not valid JSON"
 */
export async function safeJsonFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    throw new Error(
      `Network error connecting to ${url}: ${networkErr.message}. Please check your connection and ensure the backend server is running.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error(`Failed to parse JSON response from ${url}:`, parseErr);
      data = null;
    }
  }

  if (!response.ok) {
    // If backend returned a JSON error message, use it directly
    const backendMessage = data && (data.error || data.message);
    if (backendMessage) {
      const err = new Error(backendMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    // If backend returned non-JSON (HTML 404/500/etc.)
    if (!isJson) {
      const err = new Error(
        `Server returned an unexpected non-JSON response (${response.status} ${response.statusText || 'Error'}). Please ensure the API server is running.`
      );
      err.status = response.status;
      throw err;
    }

    const err = new Error(`Request failed with status ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  if (!data && response.status !== 204) {
    throw new Error(
      `Expected JSON response from server, but received ${contentType || 'non-JSON content'}`
    );
  }

  return data;
}
