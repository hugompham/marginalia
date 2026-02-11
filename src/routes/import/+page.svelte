<script lang="ts">
	import { Card } from '$components/ui';
	import { Link, FileText, ChevronRight, BookMarked } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Import | Marginalia</title>
</svelte:head>

<div class="px-lg py-xl">
	<h1 class="font-heading text-xl text-primary mb-md">Import</h1>
	<p class="text-secondary mb-xl">Choose how you want to import your highlights.</p>

	<div class="space-y-md">
		<!-- Web Article -->
		<a href="/import/url" class="block group">
			<Card padding="lg" class="flex items-center gap-lg">
				<div class="p-md rounded-button bg-accent/10 group-hover:bg-accent/20 transition-colors">
					<Link class="text-accent" size={24} />
				</div>
				<div class="flex-1">
					<h3 class="font-heading text-lg text-primary group-hover:text-accent transition-colors">
						Web Article
					</h3>
					<p class="text-sm text-secondary">Paste a URL and highlight text directly</p>
				</div>
				<ChevronRight class="text-tertiary group-hover:text-accent transition-colors" size={20} />
			</Card>
		</a>

		<!-- Manual Paste -->
		<a href="/import/paste" class="block group">
			<Card padding="lg" class="flex items-center gap-lg">
				<div class="p-md rounded-button bg-success/10 group-hover:bg-success/20 transition-colors">
					<FileText class="text-success" size={24} />
				</div>
				<div class="flex-1">
					<h3 class="font-heading text-lg text-primary group-hover:text-accent transition-colors">
						Paste Highlights
					</h3>
					<p class="text-sm text-secondary">Paste highlights from any source</p>
				</div>
				<ChevronRight class="text-tertiary group-hover:text-accent transition-colors" size={20} />
			</Card>
		</a>

		<!-- Kindle -->
		<a href="/import/kindle" class="block group">
			<Card padding="lg" class="flex items-center gap-lg">
				<div class="p-md rounded-button bg-warning/10 group-hover:bg-warning/20 transition-colors">
					<BookMarked class="text-warning" size={24} />
				</div>
				<div class="flex-1">
					<h3 class="font-heading text-lg text-primary group-hover:text-accent transition-colors">
						Kindle Import
					</h3>
					<p class="text-sm text-secondary">Upload your My Clippings.txt file</p>
				</div>
				<ChevronRight class="text-tertiary group-hover:text-accent transition-colors" size={20} />
			</Card>
		</a>
	</div>
</div>
