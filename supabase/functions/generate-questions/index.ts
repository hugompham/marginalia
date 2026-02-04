// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface Highlight {
	id: string;
	text: string;
	chapter?: string;
	contextBefore?: string;
	contextAfter?: string;
}

interface Collection {
	title: string;
	author?: string;
}

interface RequestBody {
	highlights: Highlight[];
	collection: Collection;
	questionTypes: ('cloze' | 'definition' | 'conceptual')[];
	apiKey: string;
	provider: 'openai' | 'anthropic';
	model: string;
}

const typeInstructions: Record<string, string> = {
	cloze: `
CLOZE DELETIONS:
- Remove a key term or phrase that tests understanding
- The blank should be specific enough to have one clear answer
- Keep surrounding context meaningful
- Format: "The {{c1::answer}} is important because..."
- Only create one cloze deletion per question`,

	definition: `
DEFINITION QUESTIONS:
- Ask "What is [term]?" or "Define [concept]"
- Answer should be concise but complete
- Focus on terms the reader likely wants to remember
- Keep answers under 2 sentences`,

	conceptual: `
CONCEPTUAL QUESTIONS:
- Ask "Why" or "How" questions
- Test understanding, not just recall
- Answer should explain the reasoning
- Avoid yes/no questions`
};

function buildPrompt(
	highlights: Highlight[],
	questionTypes: string[],
	collection: Collection
): string {
	const selectedInstructions = questionTypes.map((t) => typeInstructions[t]).join('\n\n');

	return `You are helping a reader retain knowledge from "${collection.title}"${collection.author ? ` by ${collection.author}` : ''}.

Generate study questions from the following highlights. Create 1-3 questions per highlight based on how much meaningful content it contains.

${selectedInstructions}

GUIDELINES:
- Questions should test genuine understanding, not trivial details
- Answers must be found in or directly implied by the highlight
- Skip highlights that are too vague or don't contain learnable content
- For each question, rate your confidence (0-1) that it's high quality
- Prefer cloze deletions when possible as they're most effective for memory
- Keep questions concise and focused

OUTPUT FORMAT (JSON array):
[
  {
    "highlightId": "uuid",
    "questionType": "cloze" | "definition" | "conceptual",
    "question": "...",
    "answer": "...",
    "clozeText": "... {{c1::answer}} ..." (only for cloze type),
    "confidence": 0.85
  }
]

HIGHLIGHTS:
${highlights
	.map(
		(h) => `
---
ID: ${h.id}
Text: "${h.text}"
${h.chapter ? `Chapter: ${h.chapter}` : ''}
${h.contextBefore ? `Context before: "${h.contextBefore}"` : ''}
${h.contextAfter ? `Context after: "${h.contextAfter}"` : ''}
`
	)
	.join('\n')}

Generate questions now. Output ONLY the JSON array, no other text:`;
}

async function generateWithOpenAI(apiKey: string, model: string, prompt: string) {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			messages: [
				{
					role: 'system',
					content:
						'You are an expert educational content creator specializing in spaced repetition flashcards. You create high-quality questions that test understanding and aid memory retention. Always output valid JSON.'
				},
				{ role: 'user', content: prompt }
			],
			temperature: 0.7,
			max_tokens: 4096
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'OpenAI API error');
	}

	const data = await response.json();
	return data.choices[0]?.message?.content || '';
}

async function generateWithAnthropic(apiKey: string, model: string, prompt: string) {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model,
			max_tokens: 4096,
			messages: [{ role: 'user', content: prompt }]
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || 'Anthropic API error');
	}

	const data = await response.json();
	return data.content[0]?.text || '';
}

function parseQuestions(content: string): unknown[] {
	let jsonStr = content.trim();

	// Handle if wrapped in markdown code block
	const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	if (jsonMatch) {
		jsonStr = jsonMatch[1];
	}

	// Handle if there's text before/after the JSON
	const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
	if (arrayMatch) {
		jsonStr = arrayMatch[0];
	}

	try {
		const questions = JSON.parse(jsonStr);
		if (!Array.isArray(questions)) {
			throw new Error('Response is not an array');
		}
		return questions;
	} catch (_e) {
		console.error('Failed to parse questions:', content);
		return [];
	}
}

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const body: RequestBody = await req.json();
		const { highlights, collection, questionTypes, apiKey, provider, model } = body;

		if (!highlights?.length || !collection || !questionTypes?.length || !apiKey || !provider || !model) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const prompt = buildPrompt(highlights, questionTypes, collection);

		let content: string;
		if (provider === 'openai') {
			content = await generateWithOpenAI(apiKey, model, prompt);
		} else {
			content = await generateWithAnthropic(apiKey, model, prompt);
		}

		const questions = parseQuestions(content);

		return new Response(JSON.stringify({ questions }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Generation error:', error);
		return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
