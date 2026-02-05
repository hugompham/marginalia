/**
 * Fetch utilities with retry logic and error handling
 * @module fetch
 */

interface RetryOptions {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries?: number;
	/** Initial delay in milliseconds (default: 1000) */
	initialDelay?: number;
	/** Backoff multiplier (default: 2 for exponential backoff) */
	backoffMultiplier?: number;
	/** Whether to retry on non-network errors (default: false) */
	retryOnNonNetworkError?: boolean;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is retriable
 */
function isRetriableError(error: unknown, response?: Response): boolean {
	// Network errors (no response)
	if (!response) {
		return true;
	}

	// Server errors (5xx)
	if (response.status >= 500) {
		return true;
	}

	// Rate limiting (429)
	if (response.status === 429) {
		return true;
	}

	// Timeout errors
	if (error instanceof Error && error.name === 'AbortError') {
		return true;
	}

	return false;
}

/**
 * Fetch with exponential backoff retry logic
 * Automatically retries failed requests with increasing delays
 *
 * @example
 * ```ts
 * const result = await fetchWithRetry('/api/review', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * }, {
 *   maxRetries: 3,
 *   initialDelay: 1000
 * });
 * ```
 */
export async function fetchWithRetry<T = unknown>(
	url: string,
	init?: RequestInit,
	options: RetryOptions = {}
): Promise<Response> {
	const {
		maxRetries = 3,
		initialDelay = 1000,
		backoffMultiplier = 2,
		retryOnNonNetworkError = false
	} = options;

	let lastError: unknown;
	let lastResponse: Response | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, init);

			// Success - return immediately
			if (response.ok) {
				return response;
			}

			// Check if error is retriable
			lastResponse = response;
			if (!isRetriableError(null, response) && !retryOnNonNetworkError) {
				return response;
			}

			// Last attempt - return the failed response
			if (attempt === maxRetries) {
				return response;
			}

			// Calculate delay with exponential backoff
			const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
			console.warn(
				`Request to ${url} failed with status ${response.status}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
			);
			await sleep(delay);
		} catch (error) {
			lastError = error;

			// Check if error is retriable
			if (!isRetriableError(error) && !retryOnNonNetworkError) {
				throw error;
			}

			// Last attempt - throw the error
			if (attempt === maxRetries) {
				throw error;
			}

			// Calculate delay with exponential backoff
			const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
			console.warn(
				`Request to ${url} failed: ${error instanceof Error ? error.message : 'Unknown error'}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
			);
			await sleep(delay);
		}
	}

	// Should never reach here, but TypeScript needs it
	if (lastResponse) {
		return lastResponse;
	}
	throw lastError ?? new Error('Unknown error');
}

/**
 * Fetch JSON with retry logic
 * Convenience wrapper around fetchWithRetry that parses JSON response
 */
export async function fetchJsonWithRetry<T = unknown>(
	url: string,
	init?: RequestInit,
	options?: RetryOptions
): Promise<T> {
	const response = await fetchWithRetry(url, init, options);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
}
