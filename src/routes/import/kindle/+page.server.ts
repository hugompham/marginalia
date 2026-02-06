import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	parseKindleClippings,
	dedupeHighlights,
	buildCollectionKey
} from '$lib/services/importers/kindle';

interface HighlightInput {
	text: string;
	note?: string | null;
	pageNumber?: number | null;
}

interface PreviewCollection {
	title: string;
	author: string | null;
	highlightCount: number;
	newHighlightCount: number;
	exists: boolean;
	willImport: boolean;
	reason?: string;
	existingId?: string;
}

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	preview: async ({ request, locals }) => {
		const session = await locals.getSession();

		if (!session) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const file = formData.get('clippings');
		const minHighlights = parseMinHighlights(formData);

		if (!(file instanceof File)) {
			return fail(400, { error: 'Please upload your My Clippings.txt file.' });
		}

		const text = await file.text();
		const parsed = parseKindleClippings(text);

		if (parsed.totalHighlights === 0) {
			return fail(400, {
				error: 'No highlights found. Make sure this is a valid My Clippings.txt file.'
			});
		}

		const existingMap = await getExistingCollections(locals.supabase, session.user.id);

		const previewCollections: PreviewCollection[] = [];

		for (const collection of parsed.collections) {
			const key = buildCollectionKey(collection.title, collection.author);
			const existing = existingMap.get(key);
			const dedupedHighlights = dedupeHighlights(collection.highlights);
			const meetsMinimum = dedupedHighlights.length >= minHighlights;

			let newHighlights = dedupedHighlights;

			if (existing) {
				newHighlights = await filterExistingHighlights(
					locals.supabase,
					existing.id,
					dedupedHighlights
				);
			}

			const willImport = meetsMinimum && newHighlights.length > 0;
			let reason: string | undefined;
			if (!meetsMinimum) {
				reason = `Below minimum (${minHighlights})`;
			} else if (newHighlights.length === 0) {
				reason = 'No new highlights';
			}

			previewCollections.push({
				title: collection.title,
				author: collection.author,
				highlightCount: dedupedHighlights.length,
				newHighlightCount: newHighlights.length,
				exists: !!existing,
				willImport,
				reason,
				existingId: existing?.id
			});
		}

		return {
			preview: {
				fileName: file.name,
				totalCollections: parsed.collections.length,
				totalHighlights: parsed.totalHighlights,
				minHighlights,
				collections: previewCollections
			}
		};
	},
	import: async ({ request, locals }) => {
		const session = await locals.getSession();

		if (!session) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const file = formData.get('clippings');
		const minHighlights = parseMinHighlights(formData);

		if (!(file instanceof File)) {
			return fail(400, { error: 'Please upload your My Clippings.txt file.' });
		}

		const text = await file.text();
		const parsed = parseKindleClippings(text);

		if (parsed.totalHighlights === 0) {
			return fail(400, {
				error: 'No highlights found. Make sure this is a valid My Clippings.txt file.'
			});
		}

		const existingMap = await getExistingCollections(locals.supabase, session.user.id);

		const summaryCollections: {
			id: string;
			title: string;
			highlightCount: number;
			action: 'created' | 'appended' | 'skipped';
			skippedReason?: string;
		}[] = [];
		let createdCount = 0;
		let appendedCount = 0;
		let skippedCount = 0;

		for (const collection of parsed.collections) {
			const dedupedHighlights = dedupeHighlights(collection.highlights);

			if (dedupedHighlights.length < minHighlights) {
				skippedCount += 1;
				summaryCollections.push({
					id: '',
					title: collection.title,
					highlightCount: 0,
					action: 'skipped',
					skippedReason: `Below minimum (${minHighlights})`
				});
				continue;
			}

			const key = buildCollectionKey(collection.title, collection.author);
			const existing = existingMap.get(key);

			let collectionId: string;
			let collectionTitle: string;
			let action: 'created' | 'appended';

			if (existing) {
				collectionId = existing.id;
				collectionTitle = existing.title;
				action = 'appended';
				appendedCount += 1;
			} else {
				const { data: created, error: collectionError } = await locals.supabase
					.from('collections')
					.insert({
						user_id: session.user.id,
						title: collection.title,
						author: collection.author,
						source_type: 'kindle',
						highlight_count: 0,
						card_count: 0
					})
					.select('id, title, author')
					.single();

				if (collectionError || !created) {
					console.error('Failed to create Kindle collection:', collectionError);
					return fail(500, { error: 'Failed to import Kindle highlights.' });
				}

				collectionId = created.id;
				collectionTitle = created.title;
				action = 'created';
				createdCount += 1;

				existingMap.set(buildCollectionKey(created.title, created.author), {
					id: created.id,
					title: created.title,
					author: created.author
				});
			}

			const newHighlights = await filterExistingHighlights(
				locals.supabase,
				collectionId,
				dedupedHighlights
			);

			if (newHighlights.length === 0) {
				skippedCount += 1;
				summaryCollections.push({
					id: collectionId,
					title: collectionTitle,
					highlightCount: 0,
					action: 'skipped',
					skippedReason: 'No new highlights'
				});
				continue;
			}

			const highlightRecords = newHighlights.map((highlight) => ({
				user_id: session.user.id,
				collection_id: collectionId,
				text: highlight.text,
				note: highlight.note ?? null,
				page_number: highlight.pageNumber ?? null,
				has_cards: false,
				is_archived: false
			}));

			try {
				await insertHighlightsInChunks(locals.supabase, highlightRecords);
			} catch (err) {
				console.error('Failed to insert Kindle highlights:', err);
				if (action === 'created') {
					await locals.supabase.from('collections').delete().eq('id', collectionId);
				}
				return fail(500, { error: 'Failed to import Kindle highlights.' });
			}

			summaryCollections.push({
				id: collectionId,
				title: collectionTitle,
				highlightCount: newHighlights.length,
				action
			});
		}

		return {
			success: true,
			summary: {
				totalCollections: parsed.collections.length,
				totalHighlights: parsed.totalHighlights,
				minHighlights,
				createdCollections: createdCount,
				appendedCollections: appendedCount,
				skippedCollections: skippedCount,
				collections: summaryCollections
			}
		};
	}
};

// Helper functions for text normalization (used in filtering)
function normalizeHighlightText(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

async function getExistingCollections(supabase: { from: (table: string) => any }, userId: string) {
	const { data, error } = await supabase
		.from('collections')
		.select('id, title, author')
		.eq('user_id', userId);

	if (error || !data) {
		console.error('Failed to fetch existing collections:', error);
		return new Map<string, { id: string; title: string; author: string | null }>();
	}

	const existingMap = new Map<string, { id: string; title: string; author: string | null }>();

	for (const collection of data) {
		existingMap.set(buildCollectionKey(collection.title, collection.author), {
			id: collection.id,
			title: collection.title,
			author: collection.author
		});
	}

	return existingMap;
}

async function filterExistingHighlights(
	supabase: { from: (table: string) => any },
	collectionId: string,
	highlights: HighlightInput[]
): Promise<HighlightInput[]> {
	if (!collectionId) return highlights;

	const texts = Array.from(
		new Set(highlights.map((h) => normalizeHighlightText(h.text)).filter(Boolean))
	);

	if (texts.length === 0) return [];

	const existingTexts = await fetchExistingHighlightTexts(supabase, collectionId, texts);

	return highlights.filter(
		(highlight) => !existingTexts.has(normalizeHighlightText(highlight.text))
	);
}

async function fetchExistingHighlightTexts(
	supabase: { from: (table: string) => any },
	collectionId: string,
	texts: string[]
): Promise<Set<string>> {
	const existing = new Set<string>();
	const chunkSize = 200;

	for (let i = 0; i < texts.length; i += chunkSize) {
		const chunk = texts.slice(i, i + chunkSize);
		const { data, error } = await supabase
			.from('highlights')
			.select('text')
			.eq('collection_id', collectionId)
			.in('text', chunk);

		if (error) {
			throw error;
		}

		for (const row of data ?? []) {
			if (row.text) {
				existing.add(normalizeHighlightText(row.text));
			}
		}
	}

	return existing;
}

function parseMinHighlights(formData: FormData): number {
	const rawValue = formData.get('minHighlights');
	const parsed = Number.parseInt(String(rawValue ?? ''), 10);
	if (!Number.isFinite(parsed) || parsed < 1) return 1;
	return Math.min(parsed, 1000);
}

async function insertHighlightsInChunks(
	supabase: { from: (table: string) => any },
	highlights: Array<Record<string, unknown>>,
	chunkSize = 500
) {
	for (let i = 0; i < highlights.length; i += chunkSize) {
		const chunk = highlights.slice(i, i + chunkSize);
		const { error } = await supabase.from('highlights').insert(chunk);
		if (error) {
			throw error;
		}
	}
}
