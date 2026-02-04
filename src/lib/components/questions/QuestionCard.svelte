<script lang="ts">
	import { Check, X, Edit3, RotateCcw } from 'lucide-svelte';
	import type { QuestionType } from '$lib/types';

	interface GeneratedQuestion {
		highlightId: string;
		questionType: QuestionType;
		question: string;
		answer: string;
		clozeText?: string;
		confidence: number;
	}

	interface Props {
		question: GeneratedQuestion;
		highlightText?: string;
		onApprove: () => void;
		onReject: () => void;
		onEdit: () => void;
		status?: 'pending' | 'approved' | 'rejected';
	}

	let { question, highlightText, onApprove, onReject, onEdit, status = 'pending' }: Props = $props();

	const typeLabels: Record<QuestionType, string> = {
		cloze: 'Cloze',
		definition: 'Definition',
		conceptual: 'Conceptual'
	};

	const typeColors: Record<QuestionType, string> = {
		cloze: 'bg-blue-100 text-blue-700',
		definition: 'bg-green-100 text-green-700',
		conceptual: 'bg-purple-100 text-purple-700'
	};

	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function formatClozeText(text: string): string {
		const regex = /\{\{c1::(.*?)\}\}/g;
		let result = '';
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(text)) !== null) {
			result += escapeHtml(text.slice(lastIndex, match.index));
			result += '<span class="bg-accent/20 text-accent font-medium px-1 rounded">[...]</span>';
			lastIndex = regex.lastIndex;
		}

		result += escapeHtml(text.slice(lastIndex));
		return result;
	}

	function getConfidenceColor(confidence: number): string {
		if (confidence >= 0.8) return 'text-green-600';
		if (confidence >= 0.6) return 'text-yellow-600';
		return 'text-red-600';
	}
</script>

<div
	class="border-canvas rounded-lg border p-4 transition-all {status === 'approved'
		? 'border-green-300 bg-green-50/50'
		: status === 'rejected'
			? 'border-red-300 bg-red-50/50 opacity-60'
			: 'bg-surface'}"
>
	<div class="mb-3 flex items-start justify-between gap-2">
		<div class="flex items-center gap-2">
			<span class="rounded-full px-2 py-0.5 text-xs font-medium {typeColors[question.questionType]}">
				{typeLabels[question.questionType]}
			</span>
			<span class="text-tertiary text-xs {getConfidenceColor(question.confidence)}">
				{Math.round(question.confidence * 100)}% confidence
			</span>
		</div>

		{#if status === 'pending'}
			<div class="flex items-center gap-1">
				<button
					onclick={onEdit}
					class="text-tertiary hover:text-primary rounded p-1.5 transition-colors hover:bg-gray-100"
					aria-label="Edit question"
				>
					<Edit3 size={16} />
				</button>
				<button
					onclick={onReject}
					class="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50"
					aria-label="Reject question"
				>
					<X size={16} />
				</button>
				<button
					onclick={onApprove}
					class="rounded p-1.5 text-green-600 transition-colors hover:bg-green-50"
					aria-label="Approve question"
				>
					<Check size={16} />
				</button>
			</div>
		{:else}
			<button
				onclick={() => {
					if (status === 'approved') onReject();
					else onApprove();
				}}
				class="text-tertiary hover:text-primary rounded p-1.5 transition-colors hover:bg-gray-100"
				aria-label="Undo"
			>
				<RotateCcw size={16} />
			</button>
		{/if}
	</div>

	{#if highlightText}
		<div class="border-canvas text-tertiary mb-3 border-l-2 pl-3 text-sm italic">
			"{highlightText.length > 100 ? highlightText.slice(0, 100) + '...' : highlightText}"
		</div>
	{/if}

	<div class="space-y-2">
		{#if question.questionType === 'cloze' && question.clozeText}
			<div class="text-primary text-sm">
				{@html formatClozeText(question.clozeText)}
			</div>
		{:else}
			<div>
				<span class="text-tertiary text-xs font-medium uppercase">Q:</span>
				<p class="text-primary text-sm">{question.question}</p>
			</div>
			<div>
				<span class="text-tertiary text-xs font-medium uppercase">A:</span>
				<p class="text-primary text-sm">{question.answer}</p>
			</div>
		{/if}
	</div>
</div>
