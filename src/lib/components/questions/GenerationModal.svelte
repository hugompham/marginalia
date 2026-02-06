<script lang="ts">
	import { X, Sparkles, Loader2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Highlight, Collection, QuestionType, Difficulty } from '$lib/types';

	interface Props {
		open: boolean;
		highlights: Highlight[];
		collection: Collection;
		onClose: () => void;
		onGenerate: (questionTypes: QuestionType[], difficulty: Difficulty) => void;
		isGenerating?: boolean;
	}

	let { open, highlights, collection, onClose, onGenerate, isGenerating = false }: Props = $props();

	let selectedTypes = $state<QuestionType[]>(['cloze', 'conceptual']);
	let difficulty = $state<Difficulty>('standard');

	const questionTypeOptions: { value: QuestionType; label: string; description: string }[] = [
		{
			value: 'cloze',
			label: 'Cloze Deletions',
			description: 'Fill-in-the-blank cards that test recall of key terms'
		},
		{
			value: 'definition',
			label: 'Definitions',
			description: 'What is X? questions for key concepts and terms'
		},
		{
			value: 'conceptual',
			label: 'Conceptual',
			description: 'Why/How questions that test deeper understanding'
		}
	];

	function toggleType(type: QuestionType) {
		if (selectedTypes.includes(type)) {
			selectedTypes = selectedTypes.filter((t) => t !== type);
		} else {
			selectedTypes = [...selectedTypes, type];
		}
	}

	function handleGenerate() {
		if (selectedTypes.length > 0) {
			onGenerate(selectedTypes, difficulty);
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isGenerating) {
			onClose();
		}
	}
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
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div class="bg-surface w-full max-w-lg rounded-xl shadow-2xl">
			<div class="border-canvas flex items-center justify-between border-b p-4">
				<h2 id="modal-title" class="text-lg font-semibold">Generate Questions</h2>
				<button
					onclick={onClose}
					disabled={isGenerating}
					class="text-secondary hover:text-primary rounded-lg p-1 transition-colors disabled:opacity-50"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<div class="p-4">
				<div class="mb-4">
					<p class="text-secondary text-sm">
						Generate study questions from <span class="text-primary font-medium"
							>{highlights.length} highlight{highlights.length !== 1 ? 's' : ''}</span
						>
						in "{collection.title}".
					</p>
				</div>

				<div class="mb-6" role="group" aria-labelledby="question-types-label">
					<span id="question-types-label" class="text-primary mb-2 block text-sm font-medium"
						>Question Types</span
					>
					<div class="space-y-2">
						{#each questionTypeOptions as option}
							<button
								onclick={() => toggleType(option.value)}
								disabled={isGenerating}
								class="border-canvas hover:border-muted w-full rounded-lg border p-3 text-left transition-colors disabled:opacity-50 {selectedTypes.includes(
									option.value
								)
									? 'border-accent bg-accent/5'
									: ''}"
							>
								<div class="flex items-center gap-3">
									<div
										class="flex h-5 w-5 items-center justify-center rounded border {selectedTypes.includes(
											option.value
										)
											? 'border-accent bg-accent'
											: 'border-muted'}"
									>
										{#if selectedTypes.includes(option.value)}
											<svg class="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
												<path
													d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z"
												/>
											</svg>
										{/if}
									</div>
									<div>
										<div class="text-primary text-sm font-medium">{option.label}</div>
										<div class="text-secondary text-xs">{option.description}</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>

				{#if selectedTypes.length === 0}
					<p class="text-accent mb-4 text-sm">Please select at least one question type.</p>
				{/if}

				<div class="mb-2" role="radiogroup" aria-labelledby="difficulty-label">
					<span id="difficulty-label" class="text-primary mb-2 block text-sm font-medium"
						>Difficulty</span
					>
					<div class="flex gap-2">
						<button
							role="radio"
							aria-checked={difficulty === 'standard'}
							onclick={() => (difficulty = 'standard')}
							disabled={isGenerating}
							class="flex-1 rounded-lg border p-3 text-left transition-colors disabled:opacity-50 {difficulty ===
							'standard'
								? 'border-accent bg-accent/5'
								: 'border-canvas hover:border-muted'}"
						>
							<div class="text-primary text-sm font-medium">Standard</div>
							<div class="text-secondary text-xs">Recall and basic understanding</div>
						</button>
						<button
							role="radio"
							aria-checked={difficulty === 'challenging'}
							onclick={() => (difficulty = 'challenging')}
							disabled={isGenerating}
							class="flex-1 rounded-lg border p-3 text-left transition-colors disabled:opacity-50 {difficulty ===
							'challenging'
								? 'border-accent bg-accent/5'
								: 'border-canvas hover:border-muted'}"
						>
							<div class="text-primary text-sm font-medium">Challenging</div>
							<div class="text-secondary text-xs">Analysis, application, evaluation</div>
						</button>
					</div>
				</div>
			</div>

			<div class="border-canvas flex justify-end gap-2 border-t p-4">
				<Button variant="ghost" onclick={onClose} disabled={isGenerating}>Cancel</Button>
				<Button
					variant="primary"
					onclick={handleGenerate}
					disabled={selectedTypes.length === 0 || isGenerating}
				>
					{#if isGenerating}
						<Loader2 size={16} class="mr-2 animate-spin" />
						Generating...
					{:else}
						<Sparkles size={16} class="mr-2" />
						Generate Questions
					{/if}
				</Button>
			</div>
		</div>
	</div>
{/if}
