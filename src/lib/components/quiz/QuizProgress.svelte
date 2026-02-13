<script lang="ts">
	import type { QuizAnswer } from '$lib/types';

	interface Props {
		current: number;
		total: number;
		answers: QuizAnswer[];
	}

	let { current, total, answers }: Props = $props();

	function getSegmentColor(index: number): string {
		const answer = answers[index];
		if (!answer) return 'bg-subtle';
		return answer.isCorrect
			? 'bg-green-500'
			: 'bg-red-500';
	}
</script>

<div class="space-y-sm">
	<!-- Progress bar -->
	<div class="flex gap-1">
		{#each Array(total) as _, index}
			<div
				class="flex-1 h-1 rounded-full transition-colors duration-fast {getSegmentColor(index)}"
			></div>
		{/each}
	</div>

	<!-- Progress text -->
	<p class="text-sm text-secondary text-center">
		{current} of {total}
	</p>
</div>
