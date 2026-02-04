/**
 * AI Provider Service
 *
 * Handles communication with AI providers (OpenAI, Anthropic) for
 * generating flashcard questions from highlights.
 *
 * @module services/ai/provider
 */

import type { AIProvider, QuestionType, Highlight, Collection } from '$lib/types';
import {
	buildGenerationPrompt,
	buildOpenAIMessages,
	buildAnthropicMessages,
	parseGeneratedQuestions,
	type GeneratedQuestion
} from './prompts';

/**
 * Configuration for AI API calls
 */
export interface AIConfig {
	/** AI provider to use */
	provider: AIProvider;
	/** Decrypted API key */
	apiKey: string;
	/** Model identifier (e.g., gpt-4o-mini, claude-3-5-sonnet) */
	model: string;
}

/**
 * Result from question generation
 */
export interface GenerationResult {
	/** Generated questions */
	questions: GeneratedQuestion[];
	/** Token usage statistics (if available) */
	usage?: {
		promptTokens: number;
		completionTokens: number;
	};
}

/**
 * Generates flashcard questions from highlights using AI
 *
 * @param config - AI provider configuration
 * @param highlights - Highlights to generate questions from
 * @param collection - Parent collection for context
 * @param questionTypes - Types of questions to generate
 * @returns Generated questions with usage statistics
 *
 * @example
 * ```ts
 * const result = await generateQuestions(
 *   { provider: 'openai', apiKey: 'sk-...', model: 'gpt-4o-mini' },
 *   highlights,
 *   collection,
 *   ['cloze', 'conceptual']
 * );
 * ```
 */
export async function generateQuestions(
	config: AIConfig,
	highlights: Highlight[],
	collection: Collection,
	questionTypes: QuestionType[]
): Promise<GenerationResult> {
	const prompt = buildGenerationPrompt(highlights, questionTypes, collection);

	if (config.provider === 'openai') {
		return generateWithOpenAI(config, prompt);
	} else {
		return generateWithAnthropic(config, prompt);
	}
}

/**
 * Generates questions using OpenAI's Chat Completions API
 */
async function generateWithOpenAI(config: AIConfig, prompt: string): Promise<GenerationResult> {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiKey}`
		},
		body: JSON.stringify({
			model: config.model,
			messages: buildOpenAIMessages(prompt),
			temperature: 0.7,
			max_tokens: 4096,
			response_format: { type: 'json_object' }
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'OpenAI API error');
	}

	const data = await response.json();
	const content = data.choices[0]?.message?.content || '';
	const questions = parseGeneratedQuestions(content);

	return {
		questions,
		usage: data.usage
			? {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens
				}
			: undefined
	};
}

/**
 * Generates questions using Anthropic's Messages API
 */
async function generateWithAnthropic(config: AIConfig, prompt: string): Promise<GenerationResult> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': config.apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: config.model,
			max_tokens: 4096,
			messages: buildAnthropicMessages(prompt)
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'Anthropic API error');
	}

	const data = await response.json();
	const content = data.content[0]?.text || '';
	const questions = parseGeneratedQuestions(content);

	return {
		questions,
		usage: data.usage
			? {
					promptTokens: data.usage.input_tokens,
					completionTokens: data.usage.output_tokens
				}
			: undefined
	};
}

/**
 * Tests if an API key is valid by making a minimal API request
 *
 * @param provider - AI provider to test
 * @param apiKey - API key to validate
 * @param model - Model to use for Anthropic test
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * const result = await testApiKey('openai', 'sk-...', 'gpt-4o-mini');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export async function testApiKey(
	provider: AIProvider,
	apiKey: string,
	model: string
): Promise<{ valid: boolean; error?: string }> {
	try {
		if (provider === 'openai') {
			const response = await fetch('https://api.openai.com/v1/models', {
				headers: {
					Authorization: `Bearer ${apiKey}`
				}
			});

			if (!response.ok) {
				const data = await response.json();
				return { valid: false, error: data.error?.message || 'Invalid API key' };
			}

			return { valid: true };
		} else {
			// Anthropic requires a message request to validate
			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model,
					max_tokens: 10,
					messages: [{ role: 'user', content: 'Hi' }]
				})
			});

			if (!response.ok) {
				const data = await response.json();
				return { valid: false, error: data.error?.message || 'Invalid API key' };
			}

			return { valid: true };
		}
	} catch {
		return { valid: false, error: 'Failed to connect to API' };
	}
}
