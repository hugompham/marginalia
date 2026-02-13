/**
 * AI Prompt Building and Response Parsing for Quiz Generation
 *
 * Builds prompts for multiple-choice, true/false, and short-answer quiz
 * questions derived from reading highlights. Parses and validates AI
 * responses into typed QuizQuestion arrays.
 *
 * @module services/ai/quiz-prompts
 */

import type { QuizQuestion, QuizQuestionType } from '$lib/types';
import { tryParseJSON } from './parse-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Highlight shape accepted by the quiz prompt builder
 */
interface HighlightForQuiz {
	id: string;
	text: string;
	note?: string | null;
	chapter?: string | null;
	pageNumber?: number | null;
}

/**
 * Collection context for the quiz prompt
 */
interface CollectionContext {
	title: string;
	author?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_QUIZ_TYPES: QuizQuestionType[] = ['multiple_choice', 'true_false', 'short_answer'];

/** System message for quiz generation */
export const QUIZ_SYSTEM_MESSAGE =
	'You are an educational quiz creator that tests reading comprehension. ' +
	'You produce challenging but fair questions that assess understanding of ' +
	'source material. Questions should be unambiguous with clearly correct answers. ' +
	'Always output valid JSON.';

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Builds the prompt for AI quiz generation from a set of highlights.
 *
 * @param highlights - Highlights to generate quiz questions from
 * @param collection - Parent collection (title, author)
 * @param questionCount - Number of questions to generate (default 10)
 * @returns Complete prompt string
 */
export function buildQuizPrompt(
	highlights: HighlightForQuiz[],
	collection: CollectionContext,
	questionCount: number = 10
): string {
	const authorLine = collection.author ? ` by ${collection.author}` : '';

	const mcCount = Math.round(questionCount * 0.4);
	const tfCount = Math.round(questionCount * 0.3);
	const saCount = questionCount - mcCount - tfCount;

	const formattedHighlights = highlights
		.map((h) => {
			const parts = [`ID: ${h.id}`, `Text: "${h.text}"`];
			if (h.chapter) parts.push(`Chapter: ${h.chapter}`);
			if (h.pageNumber != null) parts.push(`Page: ${h.pageNumber}`);
			if (h.note) parts.push(`Reader note: "${h.note}"`);
			return `---\n${parts.join('\n')}`;
		})
		.join('\n\n');

	return `Generate a quiz to test comprehension of highlights from "${collection.title}"${authorLine}.

Create exactly ${questionCount} questions with this distribution:
- ${mcCount} multiple_choice questions
- ${tfCount} true_false questions
- ${saCount} short_answer questions

MULTIPLE CHOICE RULES:
- Exactly 4 options per question
- One option must be the correctAnswer
- Distractors should be plausible but clearly wrong to someone who read the material
- Options should be similar in length and style

TRUE/FALSE RULES:
- Provide a clear statement in the "statement" field
- correctAnswer must be exactly "true" or "false"
- Avoid double negatives and ambiguous phrasing
- Mix true and false answers roughly evenly

SHORT ANSWER RULES:
- Expect a 1-2 sentence response
- correctAnswer should be a concise model answer
- Question should be specific enough to have one clear answer

GENERAL GUIDELINES:
- Each question must reference a specific highlightId from the source highlights
- Every question needs an explanation referencing the source highlight text
- Test genuine comprehension, not trivial details
- Spread questions across different highlights when possible
- If a highlight has a reader note, consider what the reader found important

CONFIDENCE SCORING:
- 0.85-1.0: Unambiguous question with clear correct answer
- 0.70-0.84: Good question, minor room for interpretation
- 0.50-0.69: Acceptable but may have some ambiguity
- Below 0.50: Do not include

OUTPUT FORMAT (JSON object with "questions" array):
{
  "questions": [
    {
      "highlightId": "uuid",
      "type": "multiple_choice",
      "question": "What does the author argue about X?",
      "correctAnswer": "Option B text",
      "explanation": "The highlight states that...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "confidence": 0.90
    },
    {
      "highlightId": "uuid",
      "type": "true_false",
      "question": "Evaluate the following statement:",
      "statement": "The author claims that X leads to Y.",
      "correctAnswer": "true",
      "explanation": "According to the highlight...",
      "confidence": 0.88
    },
    {
      "highlightId": "uuid",
      "type": "short_answer",
      "question": "Explain why X is significant in the context of Y.",
      "correctAnswer": "X is significant because...",
      "explanation": "The highlight explains that...",
      "confidence": 0.85
    }
  ]
}

HIGHLIGHTS:
${formattedHighlights}

Generate the quiz now. Output ONLY the JSON object, no other text:`;
}

// ---------------------------------------------------------------------------
// Parser / Validator
// ---------------------------------------------------------------------------

/**
 * Validates a single parsed quiz question object.
 * Returns true only if all type-specific invariants hold.
 */
function isValidQuizQuestion(item: Record<string, unknown>): boolean {
	// Common required string fields
	if (
		typeof item.question !== 'string' ||
		item.question.trim().length === 0 ||
		typeof item.correctAnswer !== 'string' ||
		item.correctAnswer.trim().length === 0 ||
		typeof item.explanation !== 'string' ||
		item.explanation.trim().length === 0 ||
		typeof item.highlightId !== 'string' ||
		item.highlightId.trim().length === 0 ||
		typeof item.confidence !== 'number'
	) {
		return false;
	}

	// Confidence threshold
	if (item.confidence < 0.5) {
		return false;
	}

	const type = item.type as string;
	if (!VALID_QUIZ_TYPES.includes(type as QuizQuestionType)) {
		return false;
	}

	switch (type) {
		case 'multiple_choice': {
			if (!Array.isArray(item.options) || item.options.length !== 4) return false;
			if (!item.options.every((o: unknown) => typeof o === 'string' && o.trim().length > 0))
				return false;
			if (!item.options.includes(item.correctAnswer)) return false;
			return true;
		}
		case 'true_false': {
			const answer = (item.correctAnswer as string).toLowerCase();
			if (answer !== 'true' && answer !== 'false') return false;
			if (typeof item.statement !== 'string' || item.statement.trim().length === 0) return false;
			return true;
		}
		case 'short_answer': {
			// correctAnswer already validated as non-empty string above
			return true;
		}
		default:
			return false;
	}
}

/**
 * Parses AI response content into validated QuizQuestion array.
 *
 * Handles JSON objects, arrays, and markdown-wrapped responses.
 * Filters out invalid questions silently (returns empty array on total failure).
 *
 * @param content - Raw AI response content
 * @returns Array of valid quiz questions
 */
export function parseQuizQuestions(content: string): QuizQuestion[] {
	let jsonStr = content.trim();

	// Handle markdown code block wrapper
	const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	if (jsonMatch) {
		jsonStr = jsonMatch[1].trim();
	}

	const parsed = tryParseJSON(jsonStr);
	if (parsed === undefined) {
		if (content.length > 10) {
			console.warn('Failed to parse quiz response:', content.slice(0, 200));
		}
		return [];
	}

	// Extract questions array from response
	let questions: unknown[];
	if (Array.isArray(parsed)) {
		questions = parsed;
	} else if (parsed && typeof parsed === 'object') {
		questions = Array.isArray(parsed.questions)
			? parsed.questions
			: ((Object.values(parsed).find((v) => Array.isArray(v)) as unknown[]) ?? []);
	} else {
		return [];
	}

	// Validate and normalize each question
	const valid: QuizQuestion[] = [];

	for (const q of questions) {
		const item = q as Record<string, unknown>;
		if (!isValidQuizQuestion(item)) continue;

		const base: QuizQuestion = {
			highlightId: (item.highlightId as string).trim(),
			type: item.type as QuizQuestionType,
			question: (item.question as string).trim(),
			correctAnswer: (item.correctAnswer as string).trim(),
			explanation: (item.explanation as string).trim(),
			confidence: item.confidence as number
		};

		// Attach type-specific fields
		if (base.type === 'multiple_choice') {
			base.options = (item.options as string[]).map((o) => o.trim());
		}
		if (base.type === 'true_false') {
			base.statement = (item.statement as string).trim();
			base.correctAnswer = base.correctAnswer.toLowerCase();
		}

		valid.push(base);
	}

	if (valid.length === 0 && content.length > 10) {
		console.warn('Quiz response had content but no valid questions:', content.slice(0, 200));
	}

	return valid;
}
