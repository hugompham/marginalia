/**
 * AI Provider Service
 *
 * Handles communication with AI providers (OpenAI, Anthropic) for
 * generating flashcard questions from highlights.
 *
 * @module services/ai/provider
 */

import type { AIProvider, QuestionType, Highlight, Collection, QuizQuestion } from '$lib/types';
import {
	buildGenerationPrompt,
	buildAnthropicSystem,
	parseGeneratedQuestions,
	type GeneratedQuestion,
	type PromptContext
} from './prompts';
import { buildLinkSuggestionPrompt, parseSuggestedLinks } from './link-prompts';
import {
	buildSummaryPrompt,
	parseSummaryResponse,
	SUMMARY_SYSTEM_MESSAGE
} from './summary-prompts';
import { buildQuizPrompt, parseQuizQuestions, QUIZ_SYSTEM_MESSAGE } from './quiz-prompts';
import type { SuggestedLink } from '$lib/types';

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
 * Token usage statistics from AI API responses
 */
interface TokenUsage {
	promptTokens: number;
	completionTokens: number;
}

/**
 * Options for AI provider call helpers
 */
interface CallOptions {
	temperature?: number;
	maxTokens?: number;
	jsonMode?: boolean;
}

/**
 * Raw result from an AI provider call
 */
interface CallResult {
	content: string;
	usage?: TokenUsage;
}

/**
 * Result from question generation
 */
export interface GenerationResult {
	/** Generated questions */
	questions: GeneratedQuestion[];
	/** Token usage statistics (if available) */
	usage?: TokenUsage;
}

/**
 * Result from link suggestion
 */
export interface LinkSuggestionResult {
	suggestions: SuggestedLink[];
	usage?: TokenUsage;
}

/**
 * Result from summary generation
 */
export interface SummaryResult {
	summary: string;
	themes: string[];
	highlightCount: number;
	usage?: TokenUsage;
}

// ---------------------------------------------------------------------------
// Internal call helpers
// ---------------------------------------------------------------------------

/**
 * Calls OpenAI Chat Completions API with standard auth/headers/error handling.
 */
async function callOpenAI(
	apiKey: string,
	model: string,
	prompt: string,
	systemMessage: string,
	opts?: CallOptions
): Promise<CallResult> {
	const messages = [
		{ role: 'system' as const, content: systemMessage },
		{ role: 'user' as const, content: prompt }
	];

	const body: Record<string, unknown> = {
		model,
		messages,
		temperature: opts?.temperature ?? 0.7,
		max_tokens: opts?.maxTokens ?? 4096
	};

	if (opts?.jsonMode !== false) {
		body.response_format = { type: 'json_object' };
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'OpenAI API error');
	}

	const data = await response.json();
	const content = data.choices[0]?.message?.content || '';

	return {
		content,
		usage: data.usage
			? {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens
				}
			: undefined
	};
}

/**
 * Calls Anthropic Messages API with standard auth/headers/error handling.
 */
async function callAnthropic(
	apiKey: string,
	model: string,
	prompt: string,
	systemMessage: string,
	opts?: CallOptions
): Promise<CallResult> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model,
			max_tokens: opts?.maxTokens ?? 4096,
			system: systemMessage,
			messages: [{ role: 'user' as const, content: prompt }]
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'Anthropic API error');
	}

	const data = await response.json();
	const content = data.content[0]?.text || '';

	return {
		content,
		usage: data.usage
			? {
					promptTokens: data.usage.input_tokens,
					completionTokens: data.usage.output_tokens
				}
			: undefined
	};
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates flashcard questions from highlights using AI
 *
 * @param config - AI provider configuration
 * @param highlights - Highlights to generate questions from
 * @param collection - Parent collection for context
 * @param questionTypes - Types of questions to generate
 * @param promptContext - Additional context: tags, card counts, difficulty
 * @returns Generated questions with usage statistics
 */
export async function generateQuestions(
	config: AIConfig,
	highlights: Highlight[],
	collection: Collection,
	questionTypes: QuestionType[],
	promptContext?: PromptContext
): Promise<GenerationResult> {
	const prompt = buildGenerationPrompt(highlights, questionTypes, collection, promptContext);
	const systemMessage = buildAnthropicSystem(); // same SYSTEM_MESSAGE for both providers

	const callFn = config.provider === 'openai' ? callOpenAI : callAnthropic;
	const result = await callFn(config.apiKey, config.model, prompt, systemMessage, {
		temperature: 0.7
	});

	return {
		questions: parseGeneratedQuestions(result.content),
		usage: result.usage
	};
}

/**
 * Suggests semantic connections between highlights using AI
 */
export async function suggestHighlightLinks(
	config: AIConfig,
	highlights: Array<{
		id: string;
		text: string;
		chapter?: string | null;
		collections?: { title: string; author: string | null } | null;
	}>
): Promise<LinkSuggestionResult> {
	const prompt = buildLinkSuggestionPrompt(highlights);
	const systemMessage = buildAnthropicSystem();

	const callFn = config.provider === 'openai' ? callOpenAI : callAnthropic;
	const result = await callFn(config.apiKey, config.model, prompt, systemMessage, {
		temperature: 0.5
	});

	return {
		suggestions: parseSuggestedLinks(result.content),
		usage: result.usage
	};
}

/**
 * Generates a structured summary from highlights using AI
 *
 * @param config - AI provider configuration
 * @param highlights - Highlights to summarize
 * @param collection - Parent collection for context
 * @returns Summary text, themes, and usage statistics
 */
export async function generateSummary(
	config: AIConfig,
	highlights: Array<{
		text: string;
		note?: string | null;
		chapter?: string | null;
		pageNumber?: number | null;
	}>,
	collection: { title: string; author?: string | null }
): Promise<SummaryResult> {
	const prompt = buildSummaryPrompt(highlights, collection);

	const callFn = config.provider === 'openai' ? callOpenAI : callAnthropic;
	const result = await callFn(config.apiKey, config.model, prompt, SUMMARY_SYSTEM_MESSAGE, {
		temperature: 0.7
	});

	const parsed = parseSummaryResponse(result.content);

	return {
		summary: parsed.summary,
		themes: parsed.themes,
		highlightCount: highlights.length,
		usage: result.usage
	};
}

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

// ---------------------------------------------------------------------------
// Quiz Generation
// ---------------------------------------------------------------------------

/**
 * Result from quiz generation
 */
export interface QuizResult {
	questions: QuizQuestion[];
	usage?: TokenUsage;
}

/**
 * Generates quiz questions from highlights using AI
 *
 * @param config - AI provider configuration
 * @param highlights - Highlights to generate quiz questions from (need id for highlightId matching)
 * @param collection - Parent collection for context
 * @param questionCount - Number of questions to generate (default 10)
 * @returns Quiz questions with usage statistics
 */
export async function generateQuiz(
	config: AIConfig,
	highlights: Array<{
		id: string;
		text: string;
		note?: string | null;
		chapter?: string | null;
		pageNumber?: number | null;
	}>,
	collection: { title: string; author?: string | null },
	questionCount: number = 10
): Promise<QuizResult> {
	const prompt = buildQuizPrompt(highlights, collection, questionCount);

	const callFn = config.provider === 'openai' ? callOpenAI : callAnthropic;
	const result = await callFn(config.apiKey, config.model, prompt, QUIZ_SYSTEM_MESSAGE, {
		temperature: 0.7
	});

	return {
		questions: parseQuizQuestions(result.content),
		usage: result.usage
	};
}
