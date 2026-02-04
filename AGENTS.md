# Marginalia - Agent Development Guide

This guide provides essential information for AI agents working in the Marginalia codebase.

## Project Overview

Marginalia is a spaced repetition application for reading highlights. Users import highlights from books, articles, and documents, then generate AI-powered flashcards for retention using the FSRS algorithm.

**Tech Stack**: SvelteKit 2.x + Svelte 5, Supabase (PostgreSQL), Tailwind CSS, TypeScript, deployed on Cloudflare Pages.

## Development Commands

```bash
# Development
pnpm dev              # Start development server (localhost:5173)
pnpm build            # Build for production
pnpm preview          # Preview production build

# Type Checking (CRITICAL - always run before committing)
pnpm check            # Run svelte-check for type errors
pnpm check:watch      # Run svelte-check in watch mode

# Database (Supabase)
pnpm db:start         # Start local Supabase instance
pnpm db:stop          # Stop local Supabase instance  
pnpm db:reset         # Reset database (destructive)
pnpm db:types         # Generate TypeScript types from schema

# Setup
pnpm prepare          # Sync SvelteKit (runs automatically)
```

**IMPORTANT**: Always run `pnpm check` before committing. No test framework is currently set up.

## Code Style Guidelines

### TypeScript Conventions
- **Type-first**: Comprehensive TypeScript interfaces with JSDoc comments
- **Strict mode**: Use TypeScript strict mode throughout
- **Explicit returns**: Always specify return types for functions
- **No implicit any**: Avoid `any` type - use `unknown` or proper typing

Example:
```typescript
/**
 * @module Highlight Operations
 * Handles importing and processing of user highlights
 */

interface Highlight {
  id: string;
  content: string;
  source: string;
  created_at: Date;
}

export async function processHighlight(content: string): Promise<Highlight> {
  // implementation
}
```

### Svelte Component Patterns
- **Modern Svelte 5**: Use `$props()` syntax, not `export let`
- **TypeScript components**: Always include `lang="ts"` attribute
- **Snippet composition**: Use Svelte 5 snippets for flexible content
- **Interface props**: Define prop interfaces before component

Example:
```svelte
<script lang="ts">
  interface Props {
    highlights: Highlight[];
    onSelect?: (highlight: Highlight) => void;
  }
  
  let { highlights, onSelect }: Props = $props();
</script>
```

### Import Organization
Use this import order:
1. External libraries (React, Svelte, etc.)
2. Internal lib imports (use aliases)
3. Relative imports

```typescript
import { browser } from '$app/environment';
import { page } from '$app/stores';
import type { PageData } from './$types';
import { processHighlight } from '$services/highlights';
import { showToast } from '$utils/toast';
import { ReviewCard } from '$components/review';
```

### CSS/Style Conventions
- **Tailwind-first**: Use utility classes for styling
- **Design tokens**: Use CSS custom properties defined in `app.css`
- **Component classes**: Add component-specific classes in `@layer components`
- **Responsive design**: Mobile-first approach

Color palette:
- Canvas: `bg-canvas` (#FAF9F7)
- Surface: `bg-surface` (#FFFFFF) 
- Accent: `text-accent` (#C2694F)
- Text: `text-primary`, `text-secondary`

### Naming Conventions
- **Components**: PascalCase (`ReviewCard.svelte`, `QuestionModal.svelte`)
- **Files**: camelCase for utilities (`crypto.ts`, `api-client.ts`)
- **Functions**: camelCase with descriptive verbs (`processHighlight`, `generateFlashcard`)
- **Variables**: camelCase, avoid abbreviations (`highlightContent`, not `hlCnt`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINT`, `MAX_HIGHLIGHTS`)

### Database Patterns
- **Type-safe queries**: Use auto-generated TypeScript types
- **RLS compliance**: All database access must respect Row Level Security
- **Error handling**: Check Supabase responses and extract errors properly

```typescript
const { data, error } = await supabase
  .from('highlights')
  .select('*')
  .eq('user_id', userId);

if (error) {
  throw new Error(`Failed to fetch highlights: ${error.message}`);
}
```

### Error Handling
- **Descriptive errors**: Throw errors with clear, actionable messages
- **User feedback**: Use toast notifications for user-facing errors
- **API errors**: Extract and display Supabase error messages
- **Async errors**: Always handle promise rejections

```typescript
try {
  const result = await processHighlight(content);
  showToast('Highlight processed successfully', 'success');
} catch (error) {
  console.error('Processing failed:', error);
  showToast(error.message, 'error');
}
```

## File Structure

```
src/lib/
├── components/
│   ├── ui/          # Reusable UI components
│   ├── review/      # Review session components
│   ├── questions/   # Question management
│   ├── highlights/  # Highlight display
│   ├── analytics/   # Dashboard components
│   └── layout/      # Layout components
├── services/
│   ├── ai/          # AI integration
│   ├── spaced-repetition/ # FSRS algorithm
│   └── importers/   # Import functionality
├── stores/          # Svelte stores
├── types/           # TypeScript definitions
├── utils/           # Utility functions
└── supabase.ts      # Database client
```

## Import Aliases

- `$components` → `src/lib/components`
- `$stores` → `src/lib/stores`
- `$services` → `src/lib/services`
- `$utils` → `src/lib/utils`

## Development Workflow

1. **Before coding**: Run `pnpm check` to ensure clean state
2. **While developing**: Use `pnpm dev` for hot reload
3. **Database changes**: Run `pnpm db:types` after schema changes
4. **Before committing**: Run `pnpm check` for type safety
5. **Testing**: No test framework set up - manual testing required

## Security Guidelines

- **API keys**: Use encrypted storage for external API keys
- **User data**: All database access must be RLS-protected
- **Input validation**: Validate user inputs, especially for AI prompts
- **Error messages**: Don't expose sensitive information in error messages

## Performance Considerations

- **Bundle size**: Minimize imports, use dynamic imports where appropriate
- **Database queries**: Use efficient queries, avoid N+1 problems
- **Client-side**: Use Svelte's reactivity efficiently, avoid unnecessary re-renders
- **Images**: Optimize images, use WebP format where supported

## Common Patterns

### Component Props
```typescript
interface Props {
  // Required props first
  item: Highlight;
  // Optional props with defaults
  compact?: boolean;
  onSelect?: (item: Highlight) => void;
}

let { item, compact = false, onSelect }: Props = $props();
```

### API Calls
```typescript
export async function fetchHighlights(userId: string): Promise<Highlight[]> {
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch highlights: ${error.message}`);
  return data || [];
}
```

### Store Usage
```typescript
import { writable } from 'svelte/store';

interface UserState {
  user: User | null;
  loading: boolean;
}

export const userStore = writable<UserState>({
  user: null,
  loading: true
});
```

Remember: This codebase prioritizes type safety, user experience, and maintainability. When in doubt, follow existing patterns in the codebase.