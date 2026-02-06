import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuestions, testApiKey } from './provider';
import type { Highlight, Collection } from '$lib/types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('AI Provider Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockHighlight: Highlight = {
		id: 'hl-1',
		collectionId: 'col-1',
		userId: 'user-1',
		text: 'The mitochondria is the powerhouse of the cell.',
		note: null,
		chapter: null,
		pageNumber: null,
		locationPercent: null,
		contextBefore: null,
		contextAfter: null,
		hasCards: false,
		isArchived: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const mockCollection: Collection = {
		id: 'col-1',
		userId: 'user-1',
		title: 'Biology Textbook',
		author: 'Dr. Smith',
		sourceType: 'manual',
		sourceUrl: null,
		coverImageUrl: null,
		highlightCount: 1,
		cardCount: 0,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	describe('generateQuestions', () => {
		describe('OpenAI provider', () => {
			it('should generate questions using OpenAI API', async () => {
				const mockResponse = {
					choices: [
						{
							message: {
								content: JSON.stringify({
									questions: [
										{
											highlightId: 'hl-1',
											questionType: 'cloze',
											question: 'What is the powerhouse of the cell?',
											answer: 'mitochondria',
											clozeText: 'The {{c1::mitochondria}} is the powerhouse of the cell.',
											confidence: 0.95
										}
									]
								})
							}
						}
					],
					usage: {
						prompt_tokens: 100,
						completion_tokens: 50
					}
				};

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => mockResponse
				});

				const result = await generateQuestions(
					{
						provider: 'openai',
						apiKey: 'sk-test-key',
						model: 'gpt-4o-mini'
					},
					[mockHighlight],
					mockCollection,
					['cloze']
				);

				expect(result.questions).toHaveLength(1);
				expect(result.questions[0].questionType).toBe('cloze');
				expect(result.questions[0].answer).toBe('mitochondria');
				expect(result.usage).toEqual({
					promptTokens: 100,
					completionTokens: 50
				});

				// Verify API call
				expect(mockFetch).toHaveBeenCalledWith(
					'https://api.openai.com/v1/chat/completions',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
							Authorization: 'Bearer sk-test-key'
						})
					})
				);
			});

			it('should throw error on OpenAI API failure', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					json: async () => ({
						error: {
							message: 'Invalid API key'
						}
					})
				});

				await expect(
					generateQuestions(
						{
							provider: 'openai',
							apiKey: 'invalid-key',
							model: 'gpt-4o-mini'
						},
						[mockHighlight],
						mockCollection,
						['cloze']
					)
				).rejects.toThrow('Invalid API key');
			});

			it('should handle missing usage data gracefully', async () => {
				const mockResponse = {
					choices: [
						{
							message: {
								content: JSON.stringify({
									questions: [
										{
											highlightId: 'hl-1',
											questionType: 'definition',
											question: 'What is a cell?',
											answer: 'Basic unit of life',
											confidence: 0.9
										}
									]
								})
							}
						}
					]
					// No usage field
				};

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => mockResponse
				});

				const result = await generateQuestions(
					{
						provider: 'openai',
						apiKey: 'sk-test-key',
						model: 'gpt-4o-mini'
					},
					[mockHighlight],
					mockCollection,
					['definition']
				);

				expect(result.questions).toHaveLength(1);
				expect(result.usage).toBeUndefined();
			});
		});

		describe('Anthropic provider', () => {
			it('should generate questions using Anthropic API', async () => {
				const mockResponse = {
					content: [
						{
							text: JSON.stringify({
								questions: [
									{
										highlightId: 'hl-1',
										questionType: 'conceptual',
										question: 'Why is the mitochondria called the powerhouse?',
										answer: 'It produces ATP energy for the cell',
										confidence: 0.92
									}
								]
							})
						}
					],
					usage: {
						input_tokens: 80,
						output_tokens: 60
					}
				};

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => mockResponse
				});

				const result = await generateQuestions(
					{
						provider: 'anthropic',
						apiKey: 'sk-ant-test-key',
						model: 'claude-3-5-sonnet-20241022'
					},
					[mockHighlight],
					mockCollection,
					['conceptual']
				);

				expect(result.questions).toHaveLength(1);
				expect(result.questions[0].questionType).toBe('conceptual');
				expect(result.usage).toEqual({
					promptTokens: 80,
					completionTokens: 60
				});

				// Verify API call
				expect(mockFetch).toHaveBeenCalledWith(
					'https://api.anthropic.com/v1/messages',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
							'x-api-key': 'sk-ant-test-key',
							'anthropic-version': '2023-06-01'
						})
					})
				);
			});

			it('should throw error on Anthropic API failure', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					json: async () => ({
						error: {
							message: 'Rate limit exceeded'
						}
					})
				});

				await expect(
					generateQuestions(
						{
							provider: 'anthropic',
							apiKey: 'sk-ant-test-key',
							model: 'claude-3-5-sonnet-20241022'
						},
						[mockHighlight],
						mockCollection,
						['cloze']
					)
				).rejects.toThrow('Rate limit exceeded');
			});
		});
	});

	describe('testApiKey', () => {
		describe('OpenAI', () => {
			it('should validate valid OpenAI key', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: [] })
				});

				const result = await testApiKey('openai', 'sk-valid-key', 'gpt-4o-mini');

				expect(result.valid).toBe(true);
				expect(result.error).toBeUndefined();
				expect(mockFetch).toHaveBeenCalledWith(
					'https://api.openai.com/v1/models',
					expect.objectContaining({
						headers: {
							Authorization: 'Bearer sk-valid-key'
						}
					})
				);
			});

			it('should reject invalid OpenAI key', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					json: async () => ({
						error: {
							message: 'Incorrect API key provided'
						}
					})
				});

				const result = await testApiKey('openai', 'sk-invalid-key', 'gpt-4o-mini');

				expect(result.valid).toBe(false);
				expect(result.error).toBe('Incorrect API key provided');
			});

			it('should handle network errors', async () => {
				mockFetch.mockRejectedValueOnce(new Error('Network error'));

				const result = await testApiKey('openai', 'sk-key', 'gpt-4o-mini');

				expect(result.valid).toBe(false);
				expect(result.error).toBe('Failed to connect to API');
			});
		});

		describe('Anthropic', () => {
			it('should validate valid Anthropic key', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						content: [{ text: 'Hello!' }]
					})
				});

				const result = await testApiKey(
					'anthropic',
					'sk-ant-valid-key',
					'claude-3-5-sonnet-20241022'
				);

				expect(result.valid).toBe(true);
				expect(result.error).toBeUndefined();
				expect(mockFetch).toHaveBeenCalledWith(
					'https://api.anthropic.com/v1/messages',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
							'x-api-key': 'sk-ant-valid-key',
							'anthropic-version': '2023-06-01'
						})
					})
				);
			});

			it('should reject invalid Anthropic key', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					json: async () => ({
						error: {
							message: 'Invalid x-api-key'
						}
					})
				});

				const result = await testApiKey(
					'anthropic',
					'sk-ant-invalid',
					'claude-3-5-sonnet-20241022'
				);

				expect(result.valid).toBe(false);
				expect(result.error).toBe('Invalid x-api-key');
			});

			it('should handle network errors', async () => {
				mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

				const result = await testApiKey('anthropic', 'sk-ant-key', 'claude-3-5-sonnet-20241022');

				expect(result.valid).toBe(false);
				expect(result.error).toBe('Failed to connect to API');
			});
		});
	});
});
