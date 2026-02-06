import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithRetry, fetchJsonWithRetry } from './fetch';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchWithRetry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return response on first successful attempt', async () => {
		const mockResponse = new Response('success', { status: 200 });
		mockFetch.mockResolvedValueOnce(mockResponse);

		const result = await fetchWithRetry('https://api.example.com/test');

		expect(result).toBe(mockResponse);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('should retry on network error', async () => {
		mockFetch
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValueOnce(new Response('success', { status: 200 }));

		const result = await fetchWithRetry('https://api.example.com/test', undefined, {
			maxRetries: 3,
			initialDelay: 10 // Small delay for fast tests
		});

		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('should retry on 500 server error', async () => {
		mockFetch
			.mockResolvedValueOnce(new Response('error', { status: 500 }))
			.mockResolvedValueOnce(new Response('success', { status: 200 }));

		const result = await fetchWithRetry('https://api.example.com/test', undefined, {
			maxRetries: 3,
			initialDelay: 10
		});

		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('should retry on 429 rate limit', async () => {
		mockFetch
			.mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
			.mockResolvedValueOnce(new Response('success', { status: 200 }));

		const result = await fetchWithRetry('https://api.example.com/test', undefined, {
			maxRetries: 3,
			initialDelay: 10
		});

		expect(result.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('should NOT retry on 400 client error by default', async () => {
		mockFetch.mockResolvedValueOnce(new Response('bad request', { status: 400 }));

		const result = await fetchWithRetry('https://api.example.com/test');

		expect(result.status).toBe(400);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('should respect maxRetries limit', async () => {
		mockFetch.mockRejectedValue(new Error('Network error'));

		await expect(
			fetchWithRetry('https://api.example.com/test', undefined, {
				maxRetries: 2,
				initialDelay: 10
			})
		).rejects.toThrow('Network error');

		expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
	});

	it('should use exponential backoff', async () => {
		const delays: number[] = [];

		// Spy on setTimeout to capture delays
		vi.spyOn(global, 'setTimeout').mockImplementation(((fn: any, delay: number) => {
			delays.push(delay);
			// Execute immediately for testing
			fn();
			return 0 as any;
		}) as any);

		mockFetch
			.mockRejectedValueOnce(new Error('Error 1'))
			.mockRejectedValueOnce(new Error('Error 2'))
			.mockResolvedValueOnce(new Response('success', { status: 200 }));

		await fetchWithRetry('https://api.example.com/test', undefined, {
			maxRetries: 3,
			initialDelay: 1000,
			backoffMultiplier: 2
		});

		// Should have delays: 1000ms, 2000ms (exponential backoff)
		expect(delays).toEqual([1000, 2000]);

		vi.restoreAllMocks();
	});

	it('should return failed response after max retries', async () => {
		const errorResponse = new Response('server error', { status: 500 });
		mockFetch.mockResolvedValue(errorResponse);

		const result = await fetchWithRetry('https://api.example.com/test', undefined, {
			maxRetries: 2,
			initialDelay: 10
		});

		expect(result.status).toBe(500);
		expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
	});
});

describe('fetchJsonWithRetry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should parse JSON on successful response', async () => {
		const data = { message: 'success' };
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(data), { status: 200 }));

		const result = await fetchJsonWithRetry('https://api.example.com/test');

		expect(result).toEqual(data);
	});

	it('should throw error with message on non-ok response', async () => {
		const errorData = { error: 'Not found' };
		mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(errorData), { status: 404 }));

		await expect(fetchJsonWithRetry('https://api.example.com/test')).rejects.toThrow('Not found');
	});

	it('should throw generic error if no error field in response', async () => {
		mockFetch.mockResolvedValue(new Response('{}', { status: 500 }));

		await expect(
			fetchJsonWithRetry('https://api.example.com/test', undefined, {
				maxRetries: 0 // Don't retry for this test
			})
		).rejects.toThrow('HTTP 500');
	});
});
