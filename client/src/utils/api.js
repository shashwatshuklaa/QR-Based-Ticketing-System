/**
 * API configuration and utility helpers
 */

// Read and sanitize the configured backend API base URL
const rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE_URL =
  rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl)
    ? (rawBaseUrl.startsWith('localhost') || rawBaseUrl.startsWith('127.0.0.1')
        ? `http://${rawBaseUrl}`
        : `https://${rawBaseUrl}`)
    : rawBaseUrl;

if (typeof window !== 'undefined' && API_BASE_URL && API_BASE_URL.includes('.vercel.app')) {
  console.warn(
    `[API Config Warning] VITE_API_URL points to a .vercel.app domain (${API_BASE_URL}). Vercel hosts the static frontend, not the Express backend. Set VITE_API_URL to your backend host (e.g. Render).`
  );
}

/**
 * Builds a full API endpoint URL, ensuring existing prefixes like /api
 * are preserved and never duplicated.
 *
 * @param {string} endpoint - The relative endpoint path (e.g. '/api/events') or full URL
 * @returns {string} The fully qualified API URL or relative path for local dev proxy
 */
export function apiUrl(endpoint = '') {
  if (!endpoint || /^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  // Ensure endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!API_BASE_URL) {
    // In local development without VITE_API_URL, relative path uses Vite's proxy
    return cleanEndpoint;
  }

  // If API_BASE_URL already ends with /api and cleanEndpoint starts with /api, prevent duplication
  if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
    return `${API_BASE_URL}${cleanEndpoint.slice(4)}`;
  }

  return `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * Safe fetch helper that gracefully handles JSON responses
 * and prevents "SyntaxError: Unexpected token '<', '<!DOCTYPE '... is not valid JSON"
 */
export async function safeJsonFetch(url, options = {}) {
  const targetUrl = apiUrl(url);
  let response;
  try {
    response = await fetch(targetUrl, options);
  } catch (networkErr) {
    throw new Error(
      `Network error connecting to ${targetUrl}: ${networkErr.message}. Please check your connection and ensure the backend server is running.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error(`Failed to parse JSON response from ${targetUrl}:`, parseErr);
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
