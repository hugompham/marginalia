<script lang="ts">
	import { X } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { GeneratedQuestion } from '$lib/types';

	interface Props {
		open: boolean;
		question: GeneratedQuestion;
		onSave: (question: GeneratedQuestion) => void;
		onClose: () => void;
	}

	let { open, question, onSave, onClose }: Props = $props();

	let editedQuestion = $state('');
	let editedAnswer = $state('');
	let editedClozeText = $state('');
	let editedType = $state<QuestionType>('definition');

	// Sync state when question prop changes
	$effect(() => {
		if (question) {
			editedQuestion = question.question;
			editedAnswer = question.answer;
			editedClozeText = question.clozeText ?? '';
			editedType = question.questionType;
		}
	});

	function handleSave() {
		onSave({
			...question,
			questionType: editedType,
			question: editedQuestion,
			answer: editedAnswer,
			clozeText: editedType === 'cloze' ? editedClozeText : undefined,
			confidence: 1.0 // User-edited questions get full confidence
		});
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	const isValid = $derived(
		editedQuestion.trim().length > 0 &&
			editedAnswer.trim().length > 0 &&
			(editedType !== 'cloze' || editedClozeText.trim().length > 0)
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-modal-title"
		tabindex="-1"
	>
		<div class="bg-surface w-full max-w-lg rounded-xl shadow-2xl">
			<div class="border-canvas flex items-center justify-between border-b p-4">
				<h2 id="edit-modal-title" class="text-lg font-semibold">Edit Question</h2>
				<button
					onclick={onClose}
					class="text-secondary hover:text-primary rounded-lg p-1 transition-colors"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<div class="space-y-4 p-4">
				<div>
					<label for="question-type" class="text-primary mb-1 block text-sm font-medium"
						>Question Type</label
					>
					<select
						id="question-type"
						bind:value={editedType}
						class="input w-full"
					>
						<option value="cloze">Cloze Deletion</option>
						<option value="definition">Definition</option>
						<option value="conceptual">Conceptual</option>
					</select>
				</div>

				{#if editedType === 'cloze'}
					<div>
						<label for="cloze-text" class="text-primary mb-1 block text-sm font-medium">
							Cloze Text
						</label>
						<Textarea
							id="cloze-text"
							bind:value={editedClozeText}
							placeholder={'The {{c1::answer}} goes in curly braces...'}
							rows={3}
						/>
						<p class="text-secondary mt-1 text-xs">
							Use {"{{c1::answer}}"} syntax to mark the hidden portion.
						</p>
					</div>
				{:else}
					<div>
						<label for="question-text" class="text-primary mb-1 block text-sm font-medium">
							Question
						</label>
						<Textarea
							id="question-text"
							bind:value={editedQuestion}
							placeholder="Enter your question..."
							rows={2}
						/>
					</div>
				{/if}

				<div>
					<label for="answer-text" class="text-primary mb-1 block text-sm font-medium">
						Answer
					</label>
					<Textarea
						id="answer-text"
						bind:value={editedAnswer}
						placeholder="Enter the answer..."
						rows={2}
					/>
				</div>
			</div>

			<div class="border-canvas flex justify-end gap-2 border-t p-4">
				<Button variant="ghost" onclick={onClose}>Cancel</Button>
				<Button variant="primary" onclick={handleSave} disabled={!isValid}>
					Save Changes
				</Button>
			</div>
		</div>
	</div>
{/if}
