# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Marginalia

Spaced repetition app for reading highlights. Import from books/articles/Kindle, generate AI flashcards (BYOK -- OpenAI or Anthropic), review with FSRS scheduling, visualize connections in a knowledge graph. Deployed on Cloudflare Pages with Supabase backend.

## Commands

```bash
# Dev (native -- preferred)
make dev-native        # Supabase + edge functions + SvelteKit natively

# Dev (Docker)
make dev               # Supabase + edge functions + SvelteKit in Docker

# Build & deploy
pnpm build             # Cloudflare Pages build
pnpm cf:preview        # Build + Wrangler local preview
pnpm cf:deploy         # Build + deploy to Cloudflare

# Quality gates (run all before handoff)
pnpm check             # svelte-check typecheck
pnpm lint              # ESLint (flat config, ESLint 9)
pnpm lint:fix          # ESLint autofix
pnpm format:check      # Prettier check
pnpm format            # Prettier write

# Tests (vitest, jsdom environment, globals enabled)
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # Coverage (v8 provider, reports to coverage/)
# Single file:
pnpm vitest run src/lib/services/ai/provider.test.ts

# Database
pnpm db:start          # supabase start
pnpm db:stop           # supabase stop
pnpm db:reset          # supabase db reset (re-runs all migrations)
pnpm db:types          # Regenerate src/lib/types/database.ts from local schema

# Setup from scratch
make setup             # pnpm install + supabase start + db:types
```

## Architecture

### Stack

- SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- Tailwind CSS 3 with CSS custom properties for theming
- Supabase: PostgreSQL 17, Auth (magic link + Google OAuth), Edge Functions (Deno)
- Adapter: `@sveltejs/adapter-cloudflare`
- Spaced repetition: `ts-fsrs` (90% target retention, fuzz enabled)
- Graph: `@xyflow/svelte` v1.5
- Validation: `zod`
- Icons: `lucide-svelte`
- Package manager: **pnpm** (not npm/yarn). Node 22+, pnpm 10+.

### Path Aliases (svelte.config.js)

- `$components` -> `src/lib/components`
- `$stores` -> `src/lib/stores`
- `$services` -> `src/lib/services`
- `$utils` -> `src/lib/utils`
- `$lib` -> `src/lib` (SvelteKit default)

### Component Organization

Components live in `$components/<domain>/` with barrel exports (`index.ts`).
Domains: `ui`, `layout`, `highlights`, `tags`, `analytics`, `questions`, `review`, `mindmap`.
Import as: `import { Button, Modal } from '$components/ui'`.

## Key Patterns

### Database Types Flow

Supabase generates `src/lib/types/database.ts` (snake_case). App types in `src/lib/types/index.ts` (camelCase). Mappers in `$utils/mappers.ts` convert between them. **Always use mappers when reading from Supabase** -- never consume DB rows directly.

Available mappers: `mapCollection`, `mapHighlight`, `mapCard`, `mapReview`, `mapTag`, `mapProfile`, `mapAPIKey`, `mapPendingQuestion`, `mapHighlightLink`. Each has a batch variant (e.g., `mapCollections`).

After schema changes: run `pnpm db:types` to regenerate, then update mappers and app types if needed.

### Auth

Two helpers in `$lib/server/auth.ts`:

- `requireAuth(locals)` -- API routes. Returns `User`. Throws 401 JSON on failure.
- `getAuthenticatedSession(locals)` -- Page loads. Returns `{ user, session }`. Throws redirect(303) on failure.

Both call `getUser()` for JWT verification (not just `getSession()`).

The hooks server (`src/hooks.server.ts`) gates protected routes: `/library`, `/import`, `/review`, `/settings`, `/cards`, `/mindmap`, `/`. Reads theme + sidebar state from cookies. Injects `data-theme` attribute into HTML via `transformPageChunk`.

### Root Layout Data Pipeline

1. `hooks.server.ts`: Creates server Supabase client per-request on `event.locals.supabase`
2. `+layout.server.ts`: Loads profile, API keys, theme, sidebar state. Onboarding guard redirects to `/onboarding` if `onboarding_completed === false`.
3. `+layout.ts`: Creates browser Supabase client. Passes through server data.
4. `+layout.svelte`: Renders Shell (sidebar/navbar) for authenticated pages. Manages auth listener, theme/sidebar stores, global dialogs (ProfileDialog, AccountSettingsDialog), Toast system.

Invalidation keys: `supabase:auth`, `app:profile`.

### Stores

- `$stores/review.ts`: Full review session state machine. `reviewSession` writable with `startSession()`, `answerCard()`, `skipCard()`, `endSession()`, `clearSession()`. Derived: `currentCard`, `sessionProgress`, `currentSchedulingOptions`, `sessionStats`.
- `$stores/theme.ts`: `theme` writable + `setTheme()` (updates DOM, cookie, and DB).
- `$stores/sidebar.ts`: `sidebarCollapsed` writable + `toggleSidebar()`. Constants: `SIDEBAR_EXPANDED=256`, `SIDEBAR_COLLAPSED=64`.

### AI Service Layer (`$services/ai/`)

- `provider.ts`: Unified interface for OpenAI + Anthropic. `generateQuestions()`, `suggestHighlightLinks()`, `testApiKey()`.
- `prompts.ts`: Prompt engineering with Bloom's taxonomy levels. `buildGenerationPrompt()` creates context-rich prompts with per-type instructions. `parseGeneratedQuestions()` robustly handles markdown-wrapped JSON, validates fields, filters invalid entries.
- `link-prompts.ts`: `buildLinkSuggestionPrompt()` for semantic connections between highlights. `parseSuggestedLinks()` with validation.
- OpenAI: `/v1/chat/completions`, JSON response format, temp 0.7
- Anthropic: `/v1/messages`, system message, temp 0.7

### FSRS Integration (`$services/spaced-repetition/fsrs.ts`)

- `toFSRSCard()` / `fromFSRSCard()`: Bidirectional conversion between app Card and ts-fsrs Card
- `getSchedulingOptions(card)`: Pre-calculates all 4 rating outcomes with human-readable intervals (e.g., "2d", "10m")
- `processReview(card, rating)`: Core scheduling, returns updated card fields + review log
- `getRetrievability(card)`: Recall probability (0-1) via FSRS forgetting curve
- `sortCardsByUrgency(cards)`: Due first, then by retrievability (lowest = most urgent)

### Encryption

API keys encrypted at rest with AES-256-GCM. `$utils/crypto.ts` uses Web Crypto API. `ENCRYPTION_KEY` env var: 64-char hex or 32-byte base64.

### Fetch Utilities

`$utils/fetch.ts`: `fetchWithRetry()` with exponential backoff (3 retries, retries on 5xx/429/network errors). `fetchJsonWithRetry<T>()` convenience wrapper.

### HTML Utilities

`$utils/html.ts`: `escapeHtml()` for XSS prevention, `decodeHtmlEntities()` for named entities.

## Database Schema

10 tables, all with RLS (`user_id = auth.uid()`):

| Table               | Key Details                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`          | Auto-created on signup (trigger). Columns: first_name, last_name, display_name, avatar_url, daily_review_goal, preferred_question_types[], theme, onboarding_completed. |
| `api_keys`          | encrypted_key + key_hint. Unique per (user_id, provider).                                                                                                               |
| `collections`       | Denormalized highlight_count, card_count maintained by triggers. source_type: web_article, manual, kindle, epub, pdf.                                                   |
| `highlights`        | text, note, chapter, page_number, location_percent, context_before/after, has_cards, is_archived.                                                                       |
| `tags`              | name + hex color. Unique per user.                                                                                                                                      |
| `highlight_tags`    | Junction table. Composite PK (highlight_id, tag_id).                                                                                                                    |
| `cards`             | FSRS fields: stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due, last_review. question_type: cloze, definition, conceptual.                  |
| `reviews`           | Snapshots: stability_before, difficulty_before, state_before. duration_ms for analytics.                                                                                |
| `pending_questions` | status: pending, accepted, rejected, edited. ai_confidence 0-1.                                                                                                         |
| `highlight_links`   | link_type: manual, ai_suggested. status: active, dismissed, pending. Prevents self-links.                                                                               |

RPC functions (SECURITY DEFINER, hardened): `get_due_cards_count`, `get_today_review_count`, `get_user_streak`, `get_collection_link_counts`.

Triggers: `update_updated_at` (4 tables), `update_collection_highlight_count`, `update_collection_card_count`, `update_highlight_has_cards`, `handle_new_user`.

## API Routes

### Data

- `POST /api/collections` -- Create collection + highlights in one request
- `POST /api/cards` -- Create flashcards from approved questions
- `POST /api/review` -- Save review result, run FSRS scheduling, update card

### AI

- `POST /api/generate-questions` -- Decrypt API key, build prompt, call AI, return questions
- `POST /api/highlight-links/suggest` -- AI link suggestions between highlights (min 2, max 100)
- `POST /api/test-key` -- Validate AI provider API key

### CRUD

- `/api/tags` -- GET (list), POST (create), PATCH `[id]` (update), DELETE `[id]`
- `/api/highlights/[id]/tags` -- POST (add tag), DELETE (remove tag)
- `/api/highlight-links` -- GET (list, filterable), POST (create), PATCH `[id]`, DELETE `[id]`

### Utilities

- `POST /api/scrape-url` -- Article scraping with SSRF protection (blocks private IPs). Tries edge function first, falls back to direct fetch.
- `PATCH /api/theme` -- Update user theme preference

## Design System

Theming via CSS custom properties in `app.css`, mapped through `tailwind.config.js`:

| Token                                                | Usage                                             |
| ---------------------------------------------------- | ------------------------------------------------- |
| `bg-canvas` / `bg-surface` / `bg-subtle`             | Page background / cards / hover states            |
| `text-primary` / `text-secondary` / `text-tertiary`  | Main / muted / faint text                         |
| `bg-accent` / `text-accent`                          | Warm terracotta (`#c2694f` light, `#d4856d` dark) |
| `border-border` / `border-border-strong`             | Subtle / emphasized borders                       |
| `shadow-card` / `shadow-card-hover` / `shadow-focus` | Card elevation states                             |

- Dark mode: `html[data-theme='dark']` selector (not class-based). Toggled via cookie + DB.
- Fonts: Newsreader (headings, serif), Inter (body, sans), JetBrains Mono (code)
- Component classes: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`
- Border radius: `rounded-card` (8px), `rounded-button` (6px), `rounded-input` (6px)
- Max widths: `max-w-content` (680px), `max-w-app` (1440px)
- Breakpoints: `mobile` (<640), `tablet` (640-1023), `desktop` (1024+)
- Animations: <300ms, transform/opacity only. `duration-fast` (150ms), `duration-normal` (250ms), `duration-slow` (400ms).

## Edge Functions (Deno)

Located in `supabase/functions/`. All require Bearer token auth. CORS from `_shared/cors.ts`.

- `generate-questions`: AI flashcard generation. Accepts highlights + collection context. Returns typed questions with confidence.
- `scrape-url`: Article extraction with SSRF protection. Uses `deno_dom` for HTML parsing. Strips nav/footer/scripts, extracts semantic content.
- `delete-account`: Validates JWT, then deletes via admin API (service role key). Cascades all user data.

## Routes Overview

| Route            | Purpose                  | Key Behavior                                                                                                    |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `/`              | Dashboard                | Stats cards, weekly chart, streak badge, recent collections, CTA to review                                      |
| `/auth/login`    | Login                    | Magic link (OTP) + Google OAuth                                                                                 |
| `/auth/callback` | OAuth/magic link handler | Code exchange or token verification, redirect sanitization                                                      |
| `/onboarding`    | First-time setup         | Name, theme. Prefills from Google profile. Sets onboarding_completed.                                           |
| `/library`       | Collection list          | Paginated (20/page), search by title/author                                                                     |
| `/library/[id]`  | Collection detail        | Highlights with tags, selection, AI generation flow (GenerationModal -> ReviewQueue -> save)                    |
| `/import`        | Method selector          | Links to paste, URL, Kindle                                                                                     |
| `/import/paste`  | Manual entry             | Title/author + highlights textarea (split by blank lines). Preview before save.                                 |
| `/import/url`    | Web article              | URL input -> scrape -> text selection UI for highlighting -> save collection                                    |
| `/import/kindle` | Kindle import            | Upload My Clippings.txt -> preview (dedup, merge) -> import. Post-import summary.                               |
| `/review`        | Review session           | Query params: type, collection, limit. Swipe/keyboard. FSRS scheduling on rate.                                 |
| `/mindmap`       | Collection graph         | @xyflow/svelte. Tag edges + cross-collection link edges. Click to drill into collection.                        |
| `/mindmap/[id]`  | Highlight network        | Tree layout (collection -> chapters -> highlights). Manual link mode, AI suggestions panel.                     |
| `/settings`      | User settings            | Profile dialog, account settings dialog, tag manager. API key management, review preferences, account deletion. |

## Known Quirks

- Supabase generated types produce `never` in some query contexts (especially `highlight_tags`, partial selects). Use `select('*')` and type assertions when needed.
- `session` from `getAuthenticatedSession` is typed as possibly null even after the auth check. Use `session!.user.id` pattern.
- `mapProfile` uses `Record<string, unknown>` casts for newer columns (first_name, last_name, avatar_url, onboarding_completed) that may not be in generated types yet.
- `mapHighlightLink` uses `Record<string, unknown>` for the row type since highlight_links may not be in generated types.
- ESLint ignores: `src/lib/types/database.ts`, `src/app.d.ts`, `supabase/functions/**`, all config files.
- Docker mode rewrites OAuth URLs from `localhost` to `host.docker.internal` for Supabase connectivity.

## Test Files

```
src/lib/utils/helpers.test.ts       # Crypto helpers
src/lib/utils/fetch.test.ts         # Retry logic
src/lib/utils/mappers.test.ts       # Database mappers
src/lib/services/ai/provider.test.ts      # AI provider abstraction
src/lib/services/ai/prompts.test.ts       # Prompt building + parsing
src/lib/services/ai/link-prompts.test.ts  # Link suggestion prompts
src/lib/services/spaced-repetition/fsrs.test.ts  # FSRS scheduling
src/lib/services/importers/kindle.test.ts         # Kindle parser
```

Coverage: `src/lib/**/*.ts` only (excludes types/, test files, .d.ts).

## Environment Variables

See `.env.example`. Required:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` -- Supabase connection
- `ENCRYPTION_KEY` -- 32 bytes (64-char hex or base64) for API key encryption

Optional:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` -- Google OAuth
- `SUPABASE_SERVICE_ROLE_KEY` -- Edge function secret (set via `supabase secrets set`)
