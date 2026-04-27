# Marginalia

A spaced repetition app for reading highlights. Import highlights from books, articles, and Kindle, then generate AI-powered flashcards to retain what you read.

## Features

- **Import Highlights**: Paste manually, scrape web articles (with text selection UI), or upload Kindle `My Clippings.txt` (deduplication, collection merging, preview before import)
- **AI Question Generation**: Generate cloze, definition, and conceptual flashcards from highlights using OpenAI or Anthropic (BYOK). Two difficulty levels: standard (Bloom's L1-2) and challenging (Bloom's L3-5). Confidence scoring per question.
- **Spaced Repetition**: FSRS algorithm (ts-fsrs) with 90% target retention, fuzz-enabled scheduling, retrievability-based urgency sorting
- **Review Sessions**: Swipeable card interface with keyboard shortcuts (1-4), touch gestures, interval previews per rating, skip/defer cards. Session types: due, new, struggling, all. Filterable by collection.
- **Knowledge Graph**: Mindmap visualization of collections and highlights using @xyflow/svelte. Tag-based edges, manual link creation, AI-powered link suggestions between highlights.
- **Dashboard**: Due/reviewed counts, retention rate, weekly review chart with goal indicator, streak tracking, recent collections
- **Tagging**: Color-coded tags on highlights, AND-filter in library, tag-based edges in mindmap
- **Onboarding**: Profile setup (name, theme) after first login, prefilled from Google OAuth metadata

## Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Framework       | SvelteKit 2.x + Svelte 5 (runes)              |
| Database        | Supabase (PostgreSQL 17, RLS, Edge Functions) |
| Styling         | Tailwind CSS 3 + CSS custom properties        |
| Algorithm       | ts-fsrs (Free Spaced Repetition Scheduler)    |
| Graph           | @xyflow/svelte 1.5                            |
| Auth            | Supabase Auth (magic link + Google OAuth)     |
| Deployment      | Cloudflare Pages                              |
| Package Manager | pnpm 10+                                      |
| Runtime         | Node.js 22+, Deno (edge functions)            |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (optional, for containerized dev)

### Quick Start

```bash
git clone https://github.com/hugompham/marginalia.git
cd marginalia
cp .env.example .env
# Edit .env with your keys (see Environment Variables below)
make setup        # pnpm install + supabase start + generate types
make dev-native   # Supabase + edge functions + SvelteKit natively
```

Open [http://localhost:5173](http://localhost:5173). Supabase Studio at [http://localhost:54323](http://localhost:54323). Inbucket (email testing) at [http://localhost:54324](http://localhost:54324).

### Docker Mode

```bash
make dev          # Supabase + edge functions + SvelteKit in Docker
```

The SvelteKit container reaches Supabase via `host.docker.internal:54321`. HMR works via bind-mounted `src/` with Vite polling.

## Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# Supabase (local defaults for supabase start)
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>   # from supabase start output

# Encryption key for API keys at rest (32 bytes)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64-char-hex-or-base64>

# Google OAuth (optional -- for "Continue with Google")
# Create at https://console.cloud.google.com/apis/credentials
# Redirect URI: http://localhost:54321/auth/v1/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

For edge functions requiring admin access:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Development

### Make Targets

| Command           | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `make dev`        | Full stack: Supabase + edge functions + SvelteKit in Docker          |
| `make dev-native` | Full stack: Supabase + edge functions + SvelteKit natively           |
| `make stop`       | Stop all services (Docker + Supabase)                                |
| `make clean`      | Stop + remove Docker volumes + reset Supabase (destructive, prompts) |
| `make setup`      | Fresh install: pnpm install + supabase start + generate types        |
| `make logs`       | Tail Docker container logs                                           |

### Common Commands

```bash
# Build & deploy
pnpm build              # Cloudflare Pages build
pnpm cf:preview         # Build + local Wrangler preview
pnpm cf:deploy          # Build + deploy to Cloudflare Pages

# Quality gates
pnpm check              # svelte-check typecheck
pnpm lint               # ESLint
pnpm format:check       # Prettier check

# Tests (vitest, jsdom)
pnpm test               # Watch mode
pnpm test:run           # Single run
pnpm test:coverage      # Coverage report (v8)

# Database
pnpm db:reset           # Reset local Supabase DB
pnpm db:types           # Regenerate TypeScript types from schema
```

## Database

### Schema

10 tables with RLS on all. Every table scoped to `user_id = auth.uid()`.

| Table               | Purpose                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`          | User settings (name, avatar, theme, daily goal, preferred question types, onboarding status). Auto-created on signup via trigger. |
| `api_keys`          | Encrypted AI provider credentials (OpenAI/Anthropic). Unique per user+provider. Stores `key_hint` (last 4 chars) for display.     |
| `collections`       | Books, articles, Kindle imports. Denormalized `highlight_count` and `card_count` maintained by triggers.                          |
| `highlights`        | Text passages within collections. Optional note, chapter, page, location, context.                                                |
| `tags`              | User-defined color-coded labels.                                                                                                  |
| `highlight_tags`    | M2M junction between highlights and tags.                                                                                         |
| `cards`             | Flashcards with full FSRS state (stability, difficulty, reps, lapses, state, due). Three types: cloze, definition, conceptual.    |
| `reviews`           | Individual review events with pre-review state snapshots for analytics.                                                           |
| `pending_questions` | AI-generated questions awaiting user approval (pending/accepted/rejected/edited).                                                 |
| `highlight_links`   | Connections between highlights (manual or AI-suggested) with confidence scores.                                                   |

### RPC Functions

| Function                              | Purpose                                      |
| ------------------------------------- | -------------------------------------------- |
| `get_due_cards_count(user_id)`        | Count non-suspended cards due now            |
| `get_today_review_count(user_id)`     | Reviews since midnight today                 |
| `get_user_streak(user_id)`            | Current consecutive-day review streak        |
| `get_collection_link_counts(user_id)` | Cross-collection link aggregates for mindmap |

All are `SECURITY DEFINER` with `auth.uid()` validation and hardened `search_path`.

### Edge Functions (Deno)

| Function             | Purpose                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-questions` | AI flashcard generation from highlights (OpenAI/Anthropic). Prompt engineering with Bloom's taxonomy, difficulty levels, confidence scoring. |
| `scrape-url`         | Web article extraction with SSRF protection (blocks private IPs). Metadata + content extraction from semantic HTML.                          |
| `delete-account`     | Account deletion via admin API (requires service role key). Cascades all user data.                                                          |

Shared CORS config in `supabase/functions/_shared/cors.ts`.

## Project Structure

```
src/
├── lib/
│   ├── components/        # Svelte 5 components (barrel exports via index.ts)
│   │   ├── ui/            # Design system: Button, Input, Textarea, Card, Modal, Toast, Spinner, Toggle, Skeleton
│   │   ├── layout/        # Shell, Sidebar, Header, BottomNav, ProfileDialog, AccountSettingsDialog, ProfileDropdown
│   │   ├── highlights/    # HighlightCard, HighlightList, CollectionCard
│   │   ├── tags/          # TagBadge, TagPicker, TagManager
│   │   ├── analytics/     # StatsCard, StreakBadge, WeeklyChart
│   │   ├── questions/     # QuestionCard, ReviewQueue, GenerationModal, EditQuestionModal
│   │   ├── review/        # ReviewCard (swipe+keyboard), RatingButtons, SessionProgress, SessionComplete
│   │   └── mindmap/       # CollectionNode, HighlightNode, ChapterNode, GhostHighlightNode,
│   │                      # TagEdge, LinkEdge, CollectionLinkEdge, MindmapNodeDetails,
│   │                      # LinkModeToolbar, SuggestionPanel, layout utils
│   ├── server/            # Server-only: auth helpers (requireAuth, getAuthenticatedSession)
│   ├── services/
│   │   ├── ai/            # Provider abstraction (OpenAI/Anthropic), prompt engineering, link suggestions
│   │   ├── spaced-repetition/  # FSRS wrapper (scheduling, review processing, urgency sorting)
│   │   └── importers/     # Kindle My Clippings.txt parser
│   ├── stores/            # Svelte stores: review session, theme, sidebar
│   ├── types/             # App types (camelCase) + generated database types (snake_case)
│   ├── utils/             # crypto (AES-256-GCM), fetch (retry), html (escape/decode), mappers (DB->app)
│   └── supabase.ts        # Client factory (browser + server)
├── routes/
│   ├── api/               # REST endpoints
│   │   ├── cards/         # POST: create flashcards from approved questions
│   │   ├── collections/   # POST: create collection with highlights
│   │   ├── generate-questions/  # POST: AI question generation
│   │   ├── highlight-links/     # CRUD + POST suggest (AI link suggestions)
│   │   ├── highlights/[id]/tags/  # POST/DELETE: tag management per highlight
│   │   ├── review/        # POST: save review + FSRS update
│   │   ├── scrape-url/    # POST: article scraping (SSRF-protected)
│   │   ├── tags/          # CRUD: tag management
│   │   ├── test-key/      # POST: validate AI provider API key
│   │   └── theme/         # PATCH: update theme preference
│   ├── auth/              # Login (magic link + Google OAuth), callback, error
│   ├── onboarding/        # First-time profile setup
│   ├── library/           # Collection list + [id] detail (highlights, tags, AI generation)
│   ├── import/            # Method selector, URL (scrape + highlight), paste, Kindle
│   ├── review/            # Spaced repetition session (swipe, keyboard, skip)
│   ├── mindmap/           # Collection graph + [id] highlight network (links, AI suggestions)
│   └── settings/          # Profile, API keys, review preferences, tags, account deletion
└── app.css                # Design tokens (CSS custom properties), component classes

supabase/
├── functions/             # Deno edge functions
├── migrations/            # 6 migrations (schema, security hardening, profile enrichment)
├── templates/             # Email templates (magic link)
└── config.toml            # Local Supabase config
```

## License

MIT
