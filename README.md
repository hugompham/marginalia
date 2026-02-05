# Marginalia

A spaced repetition app for reading highlights. Import your highlights from books, articles, and documents, then generate AI-powered flashcards to retain what you read.

## Features

- **Import Highlights**: Paste highlights manually, scrape web articles, or upload Kindle `My Clippings.txt`
- **AI Question Generation**: Generate flashcards from highlights using OpenAI or Anthropic APIs (BYOK)
- **Spaced Repetition**: FSRS algorithm optimizes review intervals for maximum retention
- **Review Sessions**: Swipeable card interface with rating buttons
- **Progress Tracking**: Dashboard with review statistics and streaks

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS
- **Algorithm**: ts-fsrs (Free Spaced Repetition Scheduler)
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account (for database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/marginalia.git
   cd marginalia
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables (see below)

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

Create a `.env` file with the following:

```bash
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Encryption (32 bytes; base64 or hex)
# Base64: openssl rand -base64 32
# Hex: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_32_byte_key
```

## Database Setup

The app uses Supabase for authentication and data storage. Tables include:

- `profiles`: User preferences and settings
- `api_keys`: Encrypted AI provider API keys
- `collections`: Groups of highlights from a single source
- `highlights`: Individual highlighted passages
- `tags`: User-defined tags for organizing highlights
- `highlight_tags`: Junction table for highlight-tag relationships
- `cards`: Flashcards with FSRS scheduling state
- `reviews`: Review history for analytics
- `pending_questions`: AI-generated questions awaiting user approval

Row Level Security (RLS) policies ensure users can only access their own data.

### Edge Functions

The app uses several Supabase Edge Functions:

- `generate-questions`: AI-powered flashcard generation from highlights
- `scrape-url`: Web article scraping and content extraction
- `delete-account`: Secure account deletion with admin privileges

Set the service role key for functions requiring admin access:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check
```

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   ├── services/       # Business logic (AI, FSRS)
│   ├── stores/         # Svelte stores
│   ├── types/          # TypeScript definitions
│   └── utils/          # Utility functions
├── routes/
│   ├── api/            # API endpoints
│   ├── auth/           # Authentication pages
│   ├── import/         # Import flows (paste, URL, Kindle)
│   ├── library/        # Collections and highlights
│   ├── review/         # Review session
│   └── settings/       # User settings
└── app.css             # Global styles

supabase/
├── functions/          # Edge Functions (Deno)
│   ├── _shared/        # Shared utilities (CORS)
│   ├── delete-account/ # Account deletion
│   ├── generate-questions/ # AI question generation
│   └── scrape-url/     # Web scraping
└── migrations/         # Database migrations
```

## License

MIT
