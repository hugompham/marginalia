<script lang="ts">
	import { Check, X, CheckCheck, Loader2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import QuestionCard from './QuestionCard.svelte';
	import EditQuestionModal from './EditQuestionModal.svelte';
	import type { QuestionType, Highlight } from '$lib/types';

	interface GeneratedQuestion {
		highlightId: string;
		questionType: QuestionType;
		question: string;
		answer: string;
		clozeText?: string;
		confidence: number;
	}

	interface Props {
		questions: GeneratedQuestion[];
		highlights: Highlight[];
		onSave: (approved: GeneratedQuestion[]) => void;
		onCancel: () => void;
		isSaving?: boolean;
	}

	let { questions, highlights, onSave, onCancel, isSaving = false }: Props = $props();

	let localQuestions = $state<GeneratedQuestion[]>([]);
	let questionStatuses = $state<Map<number, 'pending' | 'approved' | 'rejected'>>(new Map());
	let editingQuestion = $state<{ index: number; question: GeneratedQuestion } | null>(null);

	// Keep a local, editable copy of questions for UI edits
	$effect(() => {
		localQuestions = questions.map((q) => ({ ...q }));
	});

	// Initialize all questions as pending
	$effect(() => {
		const newStatuses = new Map<number, 'pending' | 'approved' | 'rejected'>();
		localQuestions.forEach((_, index) => {
			if (!questionStatuses.has(index)) {
				newStatuses.set(index, 'pending');
			} else {
				newStatuses.set(index, questionStatuses.get(index)!);
			}
		});
		questionStatuses = newStatuses;
	});

	function getHighlightText(highlightId: string): string | undefined {
		return highlights.find((h) => h.id === highlightId)?.text;
	}

	function approveQuestion(index: number) {
		questionStatuses = new Map(questionStatuses).set(index, 'approved');
	}

	function rejectQuestion(index: number) {
		questionStatuses = new Map(questionStatuses).set(index, 'rejected');
	}

	function approveAll() {
		const newStatuses = new Map<number, 'pending' | 'approved' | 'rejected'>();
		localQuestions.forEach((_, index) => {
			newStatuses.set(index, 'approved');
		});
		questionStatuses = newStatuses;
	}

	function rejectAll() {
		const newStatuses = new Map<number, 'pending' | 'approved' | 'rejected'>();
		localQuestions.forEach((_, index) => {
			newStatuses.set(index, 'rejected');
		});
		questionStatuses = newStatuses;
	}

	function openEditModal(index: number) {
		editingQuestion = { index, question: { ...localQuestions[index] } };
	}

	function handleEditSave(updated: GeneratedQuestion) {
		if (editingQuestion !== null) {
			const editIndex = editingQuestion.index;
			localQuestions = localQuestions.map((q, index) =>
				index === editIndex ? updated : q
			);
			approveQuestion(editIndex);
			editingQuestion = null;
		}
	}

	function handleSave() {
		const approved = localQuestions.filter(
			(_, index) => questionStatuses.get(index) === 'approved'
		);
		onSave(approved);
	}

	let approvedCount = $derived(
		Array.from(questionStatuses.values()).filter((s) => s === 'approved').length
	);
	let rejectedCount = $derived(
		Array.from(questionStatuses.values()).filter((s) => s === 'rejected').length
	);
	let pendingCount = $derived(
		Array.from(questionStatuses.values()).filter((s) => s === 'pending').length
	);
</script>

<div class="flex h-full flex-col">
	<div class="border-canvas flex items-center justify-between border-b p-4">
		<div>
			<h2 class="text-primary text-lg font-semibold">Review Generated Questions</h2>
			<p class="text-secondary text-sm">
				{approvedCount} approved, {rejectedCount} rejected, {pendingCount} pending
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={rejectAll} disabled={isSaving}>
				<X size={16} class="mr-1" />
				Reject All
			</Button>
			<Button variant="ghost" size="sm" onclick={approveAll} disabled={isSaving}>
				<CheckCheck size={16} class="mr-1" />
				Approve All
			</Button>
		</div>
	</div>

	<div class="flex-1 space-y-3 overflow-y-auto p-4">
		{#each localQuestions as question, index}
			<QuestionCard
				{question}
				highlightText={getHighlightText(question.highlightId)}
				status={questionStatuses.get(index) ?? 'pending'}
				onApprove={() => approveQuestion(index)}
				onReject={() => rejectQuestion(index)}
				onEdit={() => openEditModal(index)}
			/>
		{/each}
	</div>

	<div class="border-canvas flex items-center justify-between border-t p-4">
		<p class="text-secondary text-sm">
			{approvedCount} question{approvedCount !== 1 ? 's' : ''} will be added as cards
		</p>
		<div class="flex gap-2">
			<Button variant="ghost" onclick={onCancel} disabled={isSaving}>Cancel</Button>
			<Button variant="primary" onclick={handleSave} disabled={approvedCount === 0 || isSaving}>
				{#if isSaving}
					<Loader2 size={16} class="mr-2 animate-spin" />
					Saving...
				{:else}
					<Check size={16} class="mr-2" />
					Save {approvedCount} Card{approvedCount !== 1 ? 's' : ''}
				{/if}
			</Button>
		</div>
	</div>
</div>

{#if editingQuestion}
	<EditQuestionModal
		open={true}
		question={editingQuestion.question}
		onSave={handleEditSave}
		onClose={() => (editingQuestion = null)}
	/>
{/if}
