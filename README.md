# Marginalia — Product Specification

> Transform reading highlights into lasting knowledge through spaced repetition.

**Target User:** Casual readers who want to retain more from what they read.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Design System](#2-design-system)
3. [Technical Architecture](#3-technical-architecture)
4. [Data Models](#4-data-models)
5. [Feature Specification](#5-feature-specification)
6. [Implementation Phases](#6-implementation-phases)
7. [API Design](#7-api-design)
8. [Future Considerations](#8-future-considerations)

---

## 1. Product Vision

### Core Loop

```
Import Highlights → Generate Questions → Daily Review → Retain Knowledge
```

### Key Principles

1. **Effortless capture** — Getting highlights into the app should feel instant
2. **Smart defaults** — AI does the heavy lifting; users approve, not create
3. **Gentle commitment** — 5-10 minutes daily, not hour-long study sessions
4. **Context is king** — Every card connects back to its source material
5. **Reading-first aesthetic** — Feels like a book, not a productivity app

### What Makes Marginalia Different

- **Not for students cramming** — For curious people who read and forget
- **Context bundled with every card** — Original highlight, source, chapter always visible
- **Quality over quantity** — Fewer, better questions from AI
- **Brings Your Own AI** — Users provide their API key (Claude, OpenAI, etc.)

---

## 2. Design System

### Philosophy

Marginalia should feel like opening a well-loved book — warm, calm, focused. Avoid app-like busy-ness. Prioritize typography and whitespace over decorative elements.

### Color Palette

```
Background
├── Canvas:        #FAF9F7  (warm off-white, like book paper)
├── Surface:       #FFFFFF  (cards, modals)
├── Subtle:        #F5F3F0  (secondary backgrounds)

Text
├── Primary:       #1A1A1A  (near-black, easy on eyes)
├── Secondary:     #6B6B6B  (muted gray for metadata)
├── Tertiary:      #9B9B9B  (placeholders, disabled)

Accent
├── Primary:       #C2694F  (terracotta — warm, bookish)
├── Primary Hover: #A85640
├── Success:       #4A7C59  (muted forest green)
├── Warning:       #C9A227  (muted gold)
├── Error:         #B54B4B  (muted red)

Borders & Dividers
├── Default:       #E8E6E3
├── Strong:        #D4D1CC
```

### Typography

```
Font Stack
├── Headings:      "Newsreader", Georgia, serif
├── Body:          "Inter", system-ui, sans-serif
├── Monospace:     "JetBrains Mono", monospace (for code highlights)

Scale (rem)
├── xs:    0.75   (12px) — metadata, timestamps
├── sm:    0.875  (14px) — secondary text
├── base:  1      (16px) — body text
├── lg:    1.125  (18px) — card questions
├── xl:    1.25   (20px) — section headers
├── 2xl:   1.5    (24px) — page titles
├── 3xl:   2      (32px) — hero text

Line Heights
├── Tight:   1.25  (headings)
├── Normal:  1.6   (body text — optimized for reading)
├── Loose:   1.8   (long-form content)
```

### Spacing Scale

```
4px  — xs   (tight internal padding)
8px  — sm   (between related elements)
12px — md   (default gap)
16px — lg   (section padding)
24px — xl   (between sections)
32px — 2xl  (major divisions)
48px — 3xl  (page margins on desktop)
```

### Component Patterns

#### Cards (Highlights & Flashcards)

```
- Background: Surface (#FFFFFF)
- Border: 1px solid Default border
- Border Radius: 8px
- Shadow: 0 1px 3px rgba(0,0,0,0.04)
- Padding: 16px (mobile), 24px (desktop)
- Hover: Shadow increases to 0 2px 8px rgba(0,0,0,0.08)
```

#### Buttons

```
Primary
- Background: Accent Primary
- Text: #FFFFFF
- Padding: 12px 20px
- Border Radius: 6px
- Font Weight: 500

Secondary
- Background: transparent
- Border: 1px solid Default border
- Text: Primary text
- Hover: Background Subtle

Ghost
- Background: transparent
- Text: Secondary text
- Hover: Background Subtle
```

#### Form Inputs

```
- Background: Surface
- Border: 1px solid Default border
- Border Radius: 6px
- Padding: 12px 14px
- Focus: Border Accent Primary, subtle shadow
- Placeholder: Tertiary text
```

### Iconography

Use [Lucide Icons](https://lucide.dev/) — clean, consistent, 24px default size.

Key icons:
- `book-open` — Collections/Sources
- `highlighter` — Highlights
- `brain` — Review/Learning
- `sparkles` — AI generation
- `check` — Success/Mastered
- `repeat` — Spaced repetition
- `settings` — Settings
- `key` — API keys

### Motion

```
Durations
├── Fast:    150ms  (micro-interactions)
├── Normal:  250ms  (most transitions)
├── Slow:    400ms  (page transitions, reveals)

Easing
├── Default: cubic-bezier(0.4, 0, 0.2, 1)
├── Enter:   cubic-bezier(0, 0, 0.2, 1)
├── Exit:    cubic-bezier(0.4, 0, 1, 1)
```

Card swipe physics:
- Resistance: 0.6 (slight drag feel)
- Velocity threshold: 500px/s to trigger action
- Snap back: 300ms with bounce easing

### Responsive Breakpoints

```
Mobile:     < 640px   (single column, full-width cards)
Tablet:     640-1024px (optional sidebar, wider cards)
Desktop:    > 1024px  (persistent sidebar, max-width content)

Max content width: 680px (optimal reading width)
Max app width: 1280px
```

---

## 3. Technical Architecture

### Stack Overview

```
Frontend (PWA)
├── Framework:     SvelteKit 2.x
├── Styling:       Tailwind CSS 3.x
├── Components:    Custom (no UI library)
├── State:         Svelte stores + TanStack Query
├── Gestures:      Svelte Gestures / Custom
├── Hosting:       Cloudflare Pages

Backend
├── Database:      Supabase (Postgres)
├── Auth:          Supabase Auth
├── Storage:       Supabase Storage (for EPUB/PDF)
├── Edge Functions: Supabase Edge Functions (Deno)
├── Hosting:       Supabase (managed) or self-hosted

AI Integration
├── Provider:      User's API key (Claude, OpenAI, etc.)
├── Proxy:         Edge function to avoid CORS
├── Models:        Claude 3.5 Sonnet, GPT-4o-mini (user choice)
```

### Why SvelteKit?

1. **First-class Cloudflare adapter** — Native Workers deployment
2. **Lighter bundles** — Faster PWA initial load
3. **Built-in SSR + SPA modes** — Flexibility for different pages
4. **Service worker integration** — Easier offline setup when needed
5. **Less boilerplate** — Solo developer productivity

### Project Structure

```
marginalia/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/              # Base components (Button, Input, Card)
│   │   │   ├── highlights/      # Highlight-specific components
│   │   │   ├── review/          # Review session components
│   │   │   └── layout/          # Shell, Sidebar, Nav
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   ├── highlights.ts
│   │   │   ├── review.ts
│   │   │   └── settings.ts
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── provider.ts      # Abstract AI interface
│   │   │   │   ├── anthropic.ts     # Claude implementation
│   │   │   │   ├── openai.ts        # OpenAI implementation
│   │   │   │   └── prompts.ts       # Question generation prompts
│   │   │   ├── importers/
│   │   │   │   ├── web-article.ts   # URL scraping
│   │   │   │   ├── manual.ts        # Paste text
│   │   │   │   └── kindle.ts        # Future: Kindle sync
│   │   │   ├── spaced-repetition/
│   │   │   │   └── fsrs.ts          # FSRS algorithm
│   │   │   └── supabase.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   ├── text.ts              # Cloze deletion helpers
│   │   │   └── validation.ts
│   │   └── types/
│   │       └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte             # Dashboard
│   │   ├── auth/
│   │   │   ├── login/+page.svelte
│   │   │   └── callback/+page.svelte
│   │   ├── library/
│   │   │   ├── +page.svelte         # All collections
│   │   │   └── [id]/+page.svelte    # Single collection
│   │   ├── import/
│   │   │   ├── +page.svelte         # Import hub
│   │   │   ├── url/+page.svelte     # Web article import
│   │   │   └── paste/+page.svelte   # Manual paste
│   │   ├── review/
│   │   │   ├── +page.svelte         # Review session
│   │   │   └── setup/+page.svelte   # Session configuration
│   │   ├── cards/
│   │   │   └── [id]/+page.svelte    # Card detail/edit
│   │   └── settings/
│   │       └── +page.svelte
│   └── app.css                      # Tailwind + custom styles
├── static/
│   ├── manifest.json                # PWA manifest
│   └── icons/
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── generate-questions/
│       └── scrape-url/
├── svelte.config.js
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### Authentication Flow

```
1. User lands on /auth/login
2. Chooses: Email magic link OR Google OAuth
3. Supabase handles auth, redirects to /auth/callback
4. Callback creates session, redirects to /
5. All routes except /auth/* require authentication
```

### AI Integration Architecture

```
User Browser                    Edge Function                 AI Provider
     │                               │                            │
     │  POST /generate-questions     │                            │
     │  {highlights, apiKey, model}  │                            │
     │ ─────────────────────────────>│                            │
     │                               │                            │
     │                               │  POST /v1/messages         │
     │                               │  (user's API key)          │
     │                               │ ──────────────────────────>│
     │                               │                            │
     │                               │  Streaming response        │
     │                               │ <──────────────────────────│
     │                               │                            │
     │  Stream questions back        │                            │
     │ <─────────────────────────────│                            │
     │                               │                            │
```

Why proxy through edge function?
- Avoids CORS issues
- Allows response transformation
- Can add rate limiting / logging
- User's API key never stored, only passed through

---

## 4. Data Models

### Entity Relationship

```
users
  │
  ├──< api_keys (1:many)
  │
  ├──< collections (1:many)
  │     │
  │     └──< highlights (1:many)
  │           │
  │           └──< cards (1:many)
  │                 │
  │                 └──< reviews (1:many)
  │
  └──< tags (1:many)
        │
        └──<> highlight_tags (many:many with highlights)
```

### Database Schema

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  daily_review_goal INTEGER DEFAULT 20,
  preferred_question_types TEXT[] DEFAULT ARRAY['cloze', 'definition'],
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys (encrypted at rest)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai')),
  encrypted_key TEXT NOT NULL,
  model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- Collections (books, articles, etc.)
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Metadata
  title TEXT NOT NULL,
  author TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('web_article', 'manual', 'kindle', 'epub', 'pdf')),
  source_url TEXT,
  cover_image_url TEXT,
  
  -- Stats (denormalized for performance)
  highlight_count INTEGER DEFAULT 0,
  card_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Highlights
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Content
  text TEXT NOT NULL,
  note TEXT,  -- User's annotation
  
  -- Location context
  chapter TEXT,
  page_number INTEGER,
  location_percent DECIMAL(5,2),  -- 0-100% through document
  
  -- Surrounding context (for AI generation)
  context_before TEXT,  -- ~100 chars before
  context_after TEXT,   -- ~100 chars after
  
  -- Status
  has_cards BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,  -- Hex color
  
  UNIQUE(user_id, name)
);

-- Highlight-Tag junction
CREATE TABLE public.highlight_tags (
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  
  PRIMARY KEY (highlight_id, tag_id)
);

-- Cards (flashcards)
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Question content
  question_type TEXT NOT NULL CHECK (question_type IN ('cloze', 'definition', 'conceptual')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  
  -- For cloze: store the full text with {{c1::deletion}} markers
  cloze_text TEXT,
  
  -- Generation metadata
  is_ai_generated BOOLEAN DEFAULT true,
  ai_confidence DECIMAL(3,2),  -- 0-1 score
  
  -- FSRS fields
  stability DECIMAL(10,4) DEFAULT 0,
  difficulty DECIMAL(10,4) DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  last_review TIMESTAMPTZ,
  due TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  is_suspended BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews (individual review events)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  
  -- Snapshot of FSRS state before this review
  stability_before DECIMAL(10,4),
  difficulty_before DECIMAL(10,4),
  state_before TEXT,
  
  -- Time spent (milliseconds)
  duration_ms INTEGER,
  
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending questions (awaiting user approval)
CREATE TABLE public.pending_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  question_type TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  cloze_text TEXT,
  ai_confidence DECIMAL(3,2),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'edited')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_highlights_collection ON public.highlights(collection_id);
CREATE INDEX idx_highlights_user ON public.highlights(user_id);
CREATE INDEX idx_cards_user_due ON public.cards(user_id, due) WHERE NOT is_suspended;
CREATE INDEX idx_cards_highlight ON public.cards(highlight_id);
CREATE INDEX idx_reviews_card ON public.reviews(card_id);
CREATE INDEX idx_reviews_user_date ON public.reviews(user_id, reviewed_at);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can access own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Users can access own api_keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own collections"
  ON public.collections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own highlights"
  ON public.highlights FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own tags"
  ON public.tags FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own highlight_tags"
  ON public.highlight_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.highlights h
      WHERE h.id = highlight_tags.highlight_id
      AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own cards"
  ON public.cards FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own reviews"
  ON public.reviews FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own pending_questions"
  ON public.pending_questions FOR ALL
  USING (auth.uid() = user_id);

-- Functions for updating denormalized counts
CREATE OR REPLACE FUNCTION update_collection_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections
    SET highlight_count = highlight_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections
    SET highlight_count = highlight_count - 1,
        updated_at = NOW()
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_highlight_count
AFTER INSERT OR DELETE ON public.highlights
FOR EACH ROW EXECUTE FUNCTION update_collection_counts();
```

### TypeScript Types

```typescript
// src/lib/types/index.ts

export type QuestionType = 'cloze' | 'definition' | 'conceptual';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type SourceType = 'web_article' | 'manual' | 'kindle' | 'epub' | 'pdf';
export type AIProvider = 'anthropic' | 'openai';

export interface Profile {
  id: string;
  displayName: string | null;
  dailyReviewGoal: number;
  preferredQuestionTypes: QuestionType[];
  theme: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
}

export interface APIKey {
  id: string;
  userId: string;
  provider: AIProvider;
  model: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Collection {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  sourceType: SourceType;
  sourceUrl: string | null;
  coverImageUrl: string | null;
  highlightCount: number;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Highlight {
  id: string;
  collectionId: string;
  userId: string;
  text: string;
  note: string | null;
  chapter: string | null;
  pageNumber: number | null;
  locationPercent: number | null;
  contextBefore: string | null;
  contextAfter: string | null;
  hasCards: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Joined data
  collection?: Collection;
  tags?: Tag[];
  cards?: Card[];
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
}

export interface Card {
  id: string;
  highlightId: string;
  userId: string;
  questionType: QuestionType;
  question: string;
  answer: string;
  clozeText: string | null;
  isAiGenerated: boolean;
  aiConfidence: number | null;
  
  // FSRS state
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: Date | null;
  due: Date;
  
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Joined data
  highlight?: Highlight;
}

export interface Review {
  id: string;
  cardId: string;
  userId: string;
  rating: Rating;
  stabilityBefore: number;
  difficultyBefore: number;
  stateBefore: CardState;
  durationMs: number | null;
  reviewedAt: Date;
}

export interface PendingQuestion {
  id: string;
  highlightId: string;
  userId: string;
  questionType: QuestionType;
  question: string;
  answer: string;
  clozeText: string | null;
  aiConfidence: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  createdAt: Date;
}

// FSRS types
export interface FSRSCard {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: Date | null;
}

export interface SchedulingInfo {
  card: FSRSCard;
  due: Date;
  rating: Rating;
}
```

---

## 5. Feature Specification

### 5.1 Onboarding & API Setup

**First Launch Flow:**

```
1. Landing page (unauthenticated)
   - Value proposition
   - "Get Started" → Auth

2. Auth (email magic link or Google)

3. Welcome screen
   - Brief explanation of BYOK model
   - "Add API Key" CTA

4. API Key Setup
   - Choose provider: Claude (recommended) / OpenAI
   - Input API key (masked)
   - Test connection button
   - Link to "How to get an API key" for each provider

5. First Import Prompt
   - Three options: URL, Paste, or Skip
   - Skip goes to empty dashboard
```

**API Key Management (Settings):**

```
┌─────────────────────────────────────┐
│  AI Provider Settings               │
├─────────────────────────────────────┤
│                                     │
│  Claude (Anthropic)        [Active] │
│  ├── Model: claude-3-5-sonnet       │
│  ├── Key: sk-ant-••••••••••6f4a     │
│  └── [Test] [Edit] [Remove]         │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  OpenAI                    [Add →]  │
│                                     │
└─────────────────────────────────────┘
```

---

### 5.2 Content Import

#### 5.2.1 Web Article Import

**URL Input Screen:**

```
┌─────────────────────────────────────┐
│  ← Import                           │
├─────────────────────────────────────┤
│                                     │
│  Import from URL                    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ https://example.com/article │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Fetch Article]                    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Recent imports:                    │
│  • The Art of Focus — Medium        │
│  • Why We Sleep — Brain Facts       │
│                                     │
└─────────────────────────────────────┘
```

**Article Highlighting Screen:**

```
┌─────────────────────────────────────┐
│  ← Cancel              [Save 3 →]   │
├─────────────────────────────────────┤
│                                     │
│  The Science of Deep Work           │
│  by Cal Newport • 12 min read       │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Deep work is the ability to focus  │
│  without distraction on a           │
│  cognitively demanding task.░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ← highlighted, shows accent bg     │
│                                     │
│  This skill is increasingly rare    │
│  in our economy at the same time    │
│  it's becoming increasingly         │
│  valuable.                          │
│                                     │
│  ...                                │
│                                     │
└─────────────────────────────────────┘
   Tap and drag to highlight
   Tap highlight to remove
```

**Interactions:**
- Tap and drag to select text → becomes highlight
- Tap existing highlight → deselect option
- Header shows count of selections
- "Save X" creates collection with all highlights

**Web Scraping Implementation:**

```typescript
// Edge function: supabase/functions/scrape-url/index.ts

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

interface ScrapeResult {
  title: string;
  author: string | null;
  content: string;  // Clean HTML
  textContent: string;  // Plain text
  excerpt: string;
  siteName: string | null;
  publishedTime: string | null;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Marginalia/1.0)'
    }
  });
  
  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  
  if (!article) {
    throw new Error('Could not parse article content');
  }
  
  return {
    title: article.title,
    author: article.byline,
    content: article.content,
    textContent: article.textContent,
    excerpt: article.excerpt,
    siteName: article.siteName,
    publishedTime: article.publishedTime
  };
}
```

#### 5.2.2 Manual Paste Import

**Paste Screen:**

```
┌─────────────────────────────────────┐
│  ← Import                           │
├─────────────────────────────────────┤
│                                     │
│  Paste your highlights              │
│                                     │
│  Title                              │
│  ┌─────────────────────────────┐    │
│  │ Atomic Habits               │    │
│  └─────────────────────────────┘    │
│                                     │
│  Author (optional)                  │
│  ┌─────────────────────────────┐    │
│  │ James Clear                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  Highlights                         │
│  ┌─────────────────────────────┐    │
│  │ Paste one highlight per     │    │
│  │ paragraph. Separate with    │    │
│  │ blank lines.                │    │
│  │                             │    │
│  │ First highlight goes here.  │    │
│  │                             │    │
│  │ Second highlight here.      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Import Highlights]                │
│                                     │
└─────────────────────────────────────┘
```

**Parsing Logic:**
- Split by double newline (`\n\n`)
- Trim whitespace
- Filter empty strings
- Each non-empty block = one highlight

---

### 5.3 Question Generation

#### Generation Flow

```
User selects highlights
        │
        ▼
┌───────────────────┐
│ Generation Modal  │
│ - Choose types    │
│ - See highlight   │
│   count           │
└─────────┬─────────┘
          │ "Generate"
          ▼
┌───────────────────┐
│ Loading state     │
│ - Progress bar    │
│ - "Generating     │
│   questions..."   │
└─────────┬─────────┘
          │ Complete
          ▼
┌───────────────────┐
│ Review Queue      │
│ - Approve/Reject  │
│ - Edit if needed  │
└───────────────────┘
```

#### Generation Settings Modal

```
┌─────────────────────────────────────┐
│  Generate Questions            [×]  │
├─────────────────────────────────────┤
│                                     │
│  12 highlights selected             │
│                                     │
│  Question types:                    │
│                                     │
│  [✓] Cloze deletions                │
│      "The _____ is the powerhouse"  │
│                                     │
│  [✓] Definitions                    │
│      "What is X?" → "Y"             │
│                                     │
│  [ ] Conceptual                     │
│      "Why is X important?"          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Estimated: ~24-36 questions        │
│  Cost: ~$0.02 (Claude API)          │
│                                     │
│  [Cancel]              [Generate]   │
│                                     │
└─────────────────────────────────────┘
```

#### AI Prompt for Question Generation

```typescript
// src/lib/services/ai/prompts.ts

export function buildGenerationPrompt(
  highlights: Highlight[],
  questionTypes: QuestionType[],
  collection: Collection
): string {
  const typeInstructions = {
    cloze: `
CLOZE DELETIONS:
- Remove a key term or phrase that tests understanding
- The blank should be specific enough to have one clear answer
- Keep surrounding context meaningful
- Format: "The {{c1::answer}} is important because..."`,
    
    definition: `
DEFINITION QUESTIONS:
- Ask "What is [term]?" or "Define [concept]"
- Answer should be concise but complete
- Focus on terms the reader likely wants to remember`,
    
    conceptual: `
CONCEPTUAL QUESTIONS:
- Ask "Why" or "How" questions
- Test understanding, not just recall
- Answer should explain the reasoning`
  };

  const selectedInstructions = questionTypes
    .map(t => typeInstructions[t])
    .join('\n\n');

  return `You are helping a reader retain knowledge from "${collection.title}"${collection.author ? ` by ${collection.author}` : ''}.

Generate study questions from the following highlights. Create 1-3 questions per highlight based on how much meaningful content it contains.

${selectedInstructions}

GUIDELINES:
- Questions should test genuine understanding, not trivial details
- Answers must be found in or directly implied by the highlight
- Skip highlights that are too vague or don't contain learnable content
- For each question, rate your confidence (0-1) that it's high quality

OUTPUT FORMAT (JSON array):
[
  {
    "highlightId": "uuid",
    "questionType": "cloze" | "definition" | "conceptual",
    "question": "...",
    "answer": "...",
    "clozeText": "... {{c1::answer}} ..." (only for cloze type),
    "confidence": 0.85
  }
]

HIGHLIGHTS:
${highlights.map(h => `
---
ID: ${h.id}
Text: "${h.text}"
${h.chapter ? `Chapter: ${h.chapter}` : ''}
${h.contextBefore ? `Context before: "${h.contextBefore}"` : ''}
${h.contextAfter ? `Context after: "${h.contextAfter}"` : ''}
`).join('\n')}

Generate questions now:`;
}
```

#### Review Queue Screen

```
┌─────────────────────────────────────┐
│  ← Back                  Skip All   │
├─────────────────────────────────────┤
│                                     │
│  Review Generated Questions         │
│  8 of 24 remaining                  │
│                                     │
│  ━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Original Highlight                 │
│  ┌─────────────────────────────┐    │
│  │ "Habits are the compound    │    │
│  │ interest of self-           │    │
│  │ improvement."               │    │
│  │                             │    │
│  │ — Atomic Habits, Ch. 1      │    │
│  └─────────────────────────────┘    │
│                                     │
│  Generated Question (Cloze)         │
│  ┌─────────────────────────────┐    │
│  │ "Habits are the _________   │    │
│  │ of self-improvement."       │    │
│  │                             │    │
│  │ Answer: compound interest   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Confidence: ████████░░ 82%         │
│                                     │
│  [Edit]                             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [✗ Reject]              [✓ Accept] │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- Swipe right to accept
- Swipe left to reject
- "Edit" opens inline editor for question/answer
- Progress bar shows completion
- "Skip All" accepts remaining with confidence > 0.7

---

### 5.4 Review Sessions

#### FSRS Algorithm Implementation

```typescript
// src/lib/services/spaced-repetition/fsrs.ts

// FSRS-4.5 parameters (optimized defaults)
const FSRS_PARAMS = {
  w: [
    0.4, 0.6, 2.4, 5.8,  // Initial stability for Again/Hard/Good/Easy
    4.93, 0.94, 0.86, 0.01,  // Difficulty factors
    1.49, 0.14, 0.94,  // Stability factors
    2.18, 0.05, 0.34, 1.26,  // Recall factors
    0.29, 2.61  // Forgetting factors
  ],
  requestRetention: 0.9,  // Target 90% retention
  maximumInterval: 36500,  // Max 100 years
  easyBonus: 1.3,
  hardInterval: 1.2
};

export interface FSRSState {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: Date | null;
}

export interface SchedulingResult {
  again: { state: FSRSState; due: Date };
  hard: { state: FSRSState; due: Date };
  good: { state: FSRSState; due: Date };
  easy: { state: FSRSState; due: Date };
}

export function getNextStates(
  card: FSRSState,
  now: Date = new Date()
): SchedulingResult {
  const elapsedDays = card.lastReview
    ? daysBetween(card.lastReview, now)
    : 0;

  if (card.state === 'new') {
    return scheduleNewCard(card, now);
  }

  if (card.state === 'learning' || card.state === 'relearning') {
    return scheduleLearningCard(card, now, elapsedDays);
  }

  return scheduleReviewCard(card, now, elapsedDays);
}

function scheduleNewCard(card: FSRSState, now: Date): SchedulingResult {
  const w = FSRS_PARAMS.w;
  
  return {
    again: {
      state: {
        ...card,
        stability: w[0],
        difficulty: clamp(w[4] - w[5] + 0.1, 1, 10),
        state: 'learning',
        reps: 1,
        lastReview: now
      },
      due: addMinutes(now, 1)
    },
    hard: {
      state: {
        ...card,
        stability: w[1],
        difficulty: clamp(w[4] + 0.1, 1, 10),
        state: 'learning',
        reps: 1,
        lastReview: now
      },
      due: addMinutes(now, 5)
    },
    good: {
      state: {
        ...card,
        stability: w[2],
        difficulty: w[4],
        state: 'review',
        reps: 1,
        scheduledDays: Math.round(w[2]),
        lastReview: now
      },
      due: addDays(now, Math.round(w[2]))
    },
    easy: {
      state: {
        ...card,
        stability: w[3] * FSRS_PARAMS.easyBonus,
        difficulty: clamp(w[4] - w[5], 1, 10),
        state: 'review',
        reps: 1,
        scheduledDays: Math.round(w[3] * FSRS_PARAMS.easyBonus),
        lastReview: now
      },
      due: addDays(now, Math.round(w[3] * FSRS_PARAMS.easyBonus))
    }
  };
}

function scheduleReviewCard(
  card: FSRSState,
  now: Date,
  elapsedDays: number
): SchedulingResult {
  // Calculate retrievability
  const retrievability = Math.exp(
    (Math.log(0.9) / card.stability) * elapsedDays
  );
  
  // Calculate new difficulty
  const newDifficulty = (rating: Rating) => {
    const delta = rating === 'again' ? 0.2 
                : rating === 'hard' ? 0.1 
                : rating === 'good' ? 0 
                : -0.1;
    return clamp(card.difficulty + delta, 1, 10);
  };
  
  // Calculate new stability based on rating
  const newStability = (rating: Rating) => {
    const w = FSRS_PARAMS.w;
    const d = card.difficulty;
    const s = card.stability;
    const r = retrievability;
    
    if (rating === 'again') {
      return w[11] * Math.pow(d, -w[12]) * 
             (Math.pow(s + 1, w[13]) - 1) * 
             Math.exp((1 - r) * w[14]);
    }
    
    const hardPenalty = rating === 'hard' ? w[15] : 1;
    const easyBonus = rating === 'easy' ? w[16] : 1;
    
    return s * (1 + Math.exp(w[8]) *
           (11 - d) *
           Math.pow(s, -w[9]) *
           (Math.exp((1 - r) * w[10]) - 1) *
           hardPenalty *
           easyBonus);
  };
  
  const calculateInterval = (stability: number) => {
    const interval = (stability / FSRS_PARAMS.requestRetention) * 
                     Math.log(FSRS_PARAMS.requestRetention) / 
                     Math.log(0.9);
    return Math.min(
      Math.max(Math.round(interval), 1),
      FSRS_PARAMS.maximumInterval
    );
  };
  
  const againStability = newStability('again');
  const hardStability = newStability('hard');
  const goodStability = newStability('good');
  const easyStability = newStability('easy');
  
  return {
    again: {
      state: {
        stability: againStability,
        difficulty: newDifficulty('again'),
        elapsedDays: 0,
        scheduledDays: 0,
        reps: card.reps + 1,
        lapses: card.lapses + 1,
        state: 'relearning',
        lastReview: now
      },
      due: addMinutes(now, 10)
    },
    hard: {
      state: {
        stability: hardStability,
        difficulty: newDifficulty('hard'),
        elapsedDays,
        scheduledDays: calculateInterval(hardStability),
        reps: card.reps + 1,
        lapses: card.lapses,
        state: 'review',
        lastReview: now
      },
      due: addDays(now, calculateInterval(hardStability))
    },
    good: {
      state: {
        stability: goodStability,
        difficulty: newDifficulty('good'),
        elapsedDays,
        scheduledDays: calculateInterval(goodStability),
        reps: card.reps + 1,
        lapses: card.lapses,
        state: 'review',
        lastReview: now
      },
      due: addDays(now, calculateInterval(goodStability))
    },
    easy: {
      state: {
        stability: easyStability,
        difficulty: newDifficulty('easy'),
        elapsedDays,
        scheduledDays: calculateInterval(easyStability),
        reps: card.reps + 1,
        lapses: card.lapses,
        state: 'review',
        lastReview: now
      },
      due: addDays(now, calculateInterval(easyStability))
    }
  };
}

// Utility functions
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
```

#### Session Setup Screen

```
┌─────────────────────────────────────┐
│  ← Back                             │
├─────────────────────────────────────┤
│                                     │
│  Start Review Session               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Session Type                       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ○ Due Cards (23)            │    │
│  │   Scheduled for today       │    │
│  ├─────────────────────────────┤    │
│  │ ● Quick Review (20)         │    │
│  │   Mixed from all sources    │    │
│  ├─────────────────────────────┤    │
│  │ ○ New Cards Only (8)        │    │
│  │   Never reviewed before     │    │
│  ├─────────────────────────────┤    │
│  │ ○ Struggling (5)            │    │
│  │   Cards you've missed       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Filter by Collection               │
│  ┌─────────────────────────────┐    │
│  │ All Collections         [▼] │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Start Session →]                  │
│                                     │
└─────────────────────────────────────┘
```

#### Review Card Interface

**Question Side:**

```
┌─────────────────────────────────────┐
│  5 of 20                   [×]      │
├─────────────────────────────────────┤
│                                     │
│  Atomic Habits                      │
│  Chapter 1: The Power of Habits     │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│                                     │
│         ┌───────────────┐           │
│         │    CLOZE      │           │
│         └───────────────┘           │
│                                     │
│    "Habits are the _________        │
│     of self-improvement."           │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         [Tap to Reveal]             │
│                                     │
└─────────────────────────────────────┘
```

**Answer Side:**

```
┌─────────────────────────────────────┐
│  5 of 20                   [×]      │
├─────────────────────────────────────┤
│                                     │
│  Atomic Habits                      │
│  Chapter 1: The Power of Habits     │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│    "Habits are the compound         │
│     interest of self-improvement."  │
│                     ▲               │
│               answer shown          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📖 Original Highlight       │    │
│  │                             │    │
│  │ "Habits are the compound    │    │
│  │ interest of self-           │    │
│  │ improvement. The effects of │    │
│  │ your habits multiply..."    │    │
│  │                             │    │
│  │ p. 16                       │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ [Again]  [Hard]  [Good]  [Easy]     │
│   1m      5m      2d      6d        │
│                                     │
└─────────────────────────────────────┘
```

**Swipe Gestures:**

```
              ┌───────────────┐
              │               │
      ←───────│     Card      │───────→
    Again     │               │     Good
              └───────┬───────┘
                      │
                      ↓
                 See context
                 (scrollable)
```

**Swipe Implementation:**

```svelte
<!-- src/lib/components/review/ReviewCard.svelte -->

<script lang="ts">
  import { spring } from 'svelte/motion';
  import { createEventDispatcher } from 'svelte';
  import type { Card, Rating } from '$lib/types';
  
  export let card: Card;
  export let schedulingInfo: SchedulingResult;
  
  const dispatch = createEventDispatcher<{
    answer: { rating: Rating };
    skip: void;
  }>();
  
  let revealed = false;
  let startX = 0;
  let startY = 0;
  
  const position = spring({ x: 0, y: 0 }, {
    stiffness: 0.2,
    damping: 0.8
  });
  
  const SWIPE_THRESHOLD = 100;
  const VELOCITY_THRESHOLD = 500;
  
  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
  
  function handleTouchMove(e: TouchEvent) {
    if (!revealed) return;
    
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    
    // Only allow horizontal swipe if predominantly horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      position.set({ x: deltaX * 0.6, y: 0 });
    }
  }
  
  function handleTouchEnd(e: TouchEvent) {
    if (!revealed) {
      revealed = true;
      return;
    }
    
    const deltaX = e.changedTouches[0].clientX - startX;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        dispatch('answer', { rating: 'good' });
      } else {
        dispatch('answer', { rating: 'again' });
      }
    } else {
      position.set({ x: 0, y: 0 });
    }
  }
  
  function handleRatingClick(rating: Rating) {
    dispatch('answer', { rating });
  }
</script>

<div
  class="review-card"
  style="transform: translateX({$position.x}px)"
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
>
  <!-- Card content -->
  <div class="card-header">
    <span class="source-title">{card.highlight?.collection?.title}</span>
    {#if card.highlight?.chapter}
      <span class="chapter">{card.highlight.chapter}</span>
    {/if}
  </div>
  
  <div class="card-body">
    <span class="question-type">{card.questionType}</span>
    
    {#if card.questionType === 'cloze'}
      <p class="question cloze">
        {#if revealed}
          {@html card.clozeText?.replace(
            /\{\{c1::(.+?)\}\}/,
            '<mark>$1</mark>'
          )}
        {:else}
          {@html card.clozeText?.replace(
            /\{\{c1::.+?\}\}/,
            '<span class="blank">_____</span>'
          )}
        {/if}
      </p>
    {:else}
      <p class="question">{card.question}</p>
      {#if revealed}
        <p class="answer">{card.answer}</p>
      {/if}
    {/if}
  </div>
  
  {#if revealed && card.highlight}
    <div class="context">
      <div class="context-header">
        <span>📖 Original Highlight</span>
      </div>
      <p class="highlight-text">{card.highlight.text}</p>
      {#if card.highlight.pageNumber}
        <span class="page">p. {card.highlight.pageNumber}</span>
      {/if}
    </div>
  {/if}
  
  <div class="card-actions">
    {#if !revealed}
      <button class="reveal-btn" on:click={() => revealed = true}>
        Tap to Reveal
      </button>
    {:else}
      <div class="rating-buttons">
        {#each ['again', 'hard', 'good', 'easy'] as rating}
          <button
            class="rating-btn rating-{rating}"
            on:click={() => handleRatingClick(rating)}
          >
            <span class="rating-label">{rating}</span>
            <span class="rating-interval">
              {formatInterval(schedulingInfo[rating].due)}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
```

#### Session Complete Screen

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            ✓                        │
│                                     │
│      Session Complete!              │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  20 cards reviewed                  │
│  12 min 34 sec                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Again     ████░░░░░░   4    │    │
│  │ Hard      ██░░░░░░░░   2    │    │
│  │ Good      ████████░░  10    │    │
│  │ Easy      ████░░░░░░   4    │    │
│  └─────────────────────────────┘    │
│                                     │
│  Retention: 70% (14/20)             │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🔥 5 day streak!                   │
│                                     │
│  [Review More]    [Done]            │
│                                     │
└─────────────────────────────────────┘
```

---

### 5.5 Dashboard & Analytics

#### Main Dashboard

```
┌─────────────────────────────────────┐
│  ≡  Marginalia              [👤]    │
├─────────────────────────────────────┤
│                                     │
│  Good morning, Sarah                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔥 5 day streak            │    │
│  │                             │    │
│  │  23 cards due today         │    │
│  │  ~8 min estimated           │    │
│  │                             │    │
│  │  [Start Review →]           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  This Week                          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ▁▃▅▇▅▃▁                     │    │
│  │ M T W T F S S               │    │
│  │                             │    │
│  │ 87 cards · 42 min total     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Recent Collections                 │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📚 Atomic Habits            │    │
│  │    47 highlights · 156 cards│    │
│  │    Last reviewed: Today     │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 📰 The Art of Focus         │    │
│  │    12 highlights · 34 cards │    │
│  │    Last reviewed: 2 days    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [See All Collections →]            │
│                                     │
└─────────────────────────────────────┘

───────────────────────────────────────
  [🏠]      [📚]      [➕]      [⚙️]
  Home     Library   Import   Settings
───────────────────────────────────────
```

#### Collection Detail Screen

```
┌─────────────────────────────────────┐
│  ← Library                    [⋮]   │
├─────────────────────────────────────┤
│                                     │
│  📚 Atomic Habits                   │
│  James Clear                        │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Stats                              │
│  ┌─────────────────────────────┐    │
│  │ Highlights    47            │    │
│  │ Cards         156           │    │
│  │ Retention     87%           │    │
│  │ Last Review   Today         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [Highlights]  [Cards]  [Stats]     │
│      ▔▔▔▔▔▔                         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ "Habits are the compound    │    │
│  │ interest of self-           │    │
│  │ improvement."               │    │
│  │                             │    │
│  │ Ch. 1 · p. 16 · 3 cards     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ "You do not rise to the     │    │
│  │ level of your goals. You    │    │
│  │ fall to the level of your   │    │
│  │ systems."                   │    │
│  │                             │    │
│  │ Ch. 1 · p. 27 · 2 cards     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ...                                │
│                                     │
└─────────────────────────────────────┘
```

---

### 5.6 Settings

```
┌─────────────────────────────────────┐
│  ← Settings                         │
├─────────────────────────────────────┤
│                                     │
│  Account                            │
│  ├── Email: sarah@example.com       │
│  └── [Sign Out]                     │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  AI Provider                        │
│  ├── Claude (Anthropic)    [Active] │
│  │   └── claude-3-5-sonnet          │
│  └── [Manage API Keys →]            │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Review Settings                    │
│  ├── Daily goal          [20 cards] │
│  ├── Question types                 │
│  │   ├── [✓] Cloze                  │
│  │   ├── [✓] Definition             │
│  │   └── [ ] Conceptual             │
│  └── Auto-approve high   [Off]      │
│      confidence questions           │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Appearance                         │
│  └── Theme              [Light ▼]   │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Data                               │
│  ├── [Export All Data]              │
│  └── [Delete Account]               │
│                                     │
└─────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Basic auth, data layer, and manual import working.

```
Week 1: Project Setup
├── SvelteKit project with Tailwind
├── Supabase project + migrations
├── Basic auth (magic link)
├── Design system tokens in CSS
└── Base UI components (Button, Input, Card)

Week 2: Core Data & Import
├── Collections CRUD
├── Highlights CRUD
├── Manual paste import flow
├── Basic library view
└── Collection detail view

Week 3: Polish & Deploy
├── Responsive layout shell
├── Navigation (mobile bottom bar, desktop sidebar)
├── PWA manifest + basic service worker
├── Deploy to Cloudflare Pages
└── Connect Supabase (hosted or self-hosted)
```

**Deliverable:** User can sign up, paste highlights, view them in library.

---

### Phase 2: AI Generation (Weeks 4-6)

**Goal:** Generate questions from highlights using user's API key.

```
Week 4: API Key Management
├── API key encrypted storage
├── Key input/test UI in settings
├── Edge function for AI proxy
└── Provider abstraction layer

Week 5: Question Generation
├── Generation prompts (cloze, definition)
├── Streaming response handling
├── Pending questions table
├── Generation modal + progress UI

Week 6: Review Queue
├── Approval/rejection flow
├── Edit question inline
├── Bulk actions (approve all high-confidence)
├── Convert approved → cards
└── Update highlight.has_cards flag
```

**Deliverable:** User can generate questions, review them, create cards.

---

### Phase 3: Spaced Repetition (Weeks 7-9)

**Goal:** Full review session with FSRS scheduling.

```
Week 7: FSRS Implementation
├── FSRS algorithm (TypeScript)
├── Card state management
├── Due card queries
├── Review event logging

Week 8: Review UI
├── Session setup screen
├── Review card component
├── Swipe gestures (Svelte)
├── Rating buttons with intervals
├── Answer reveal animation

Week 9: Session Flow
├── Card queue management
├── Session progress tracking
├── Session complete summary
├── Streak tracking
└── Due cards on dashboard
```

**Deliverable:** Complete review loop with spaced repetition.

---

### Phase 4: Web Import & Polish (Weeks 10-12)

**Goal:** Web article import, analytics, and production polish.

```
Week 10: Web Article Import
├── URL scraping edge function
├── Article rendering view
├── Touch-based highlighting
├── Save highlights to collection

Week 11: Analytics & Stats
├── Dashboard statistics
├── Weekly review chart
├── Per-collection stats
├── Retention calculations

Week 12: Polish & Launch Prep
├── Error handling & toasts
├── Loading states
├── Empty states
├── Onboarding flow refinement
├── Performance optimization
└── Production deployment checklist
```

**Deliverable:** Feature-complete MVP ready for users.

---

## 7. API Design

### Supabase Edge Functions

#### `POST /functions/v1/scrape-url`

Scrapes article content from URL.

```typescript
// Request
{
  url: string;
}

// Response
{
  title: string;
  author: string | null;
  content: string;  // Clean HTML
  textContent: string;
  excerpt: string;
  siteName: string | null;
}
```

#### `POST /functions/v1/generate-questions`

Generates questions from highlights.

```typescript
// Request
{
  highlightIds: string[];
  questionTypes: ('cloze' | 'definition' | 'conceptual')[];
  apiKey: string;  // User's key, not stored
  provider: 'anthropic' | 'openai';
  model: string;
}

// Response (streamed)
{
  questions: Array<{
    highlightId: string;
    questionType: string;
    question: string;
    answer: string;
    clozeText?: string;
    confidence: number;
  }>;
}
```

### Client-Side Stores

```typescript
// src/lib/stores/review.ts

import { writable, derived } from 'svelte/store';
import type { Card, Rating } from '$lib/types';
import { getNextStates } from '$lib/services/spaced-repetition/fsrs';

interface ReviewSession {
  cards: Card[];
  currentIndex: number;
  startedAt: Date;
  results: Array<{ cardId: string; rating: Rating; duration: number }>;
}

function createReviewStore() {
  const { subscribe, set, update } = writable<ReviewSession | null>(null);
  
  return {
    subscribe,
    
    startSession(cards: Card[]) {
      set({
        cards,
        currentIndex: 0,
        startedAt: new Date(),
        results: []
      });
    },
    
    answerCard(rating: Rating, durationMs: number) {
      update(session => {
        if (!session) return null;
        
        const card = session.cards[session.currentIndex];
        
        return {
          ...session,
          currentIndex: session.currentIndex + 1,
          results: [
            ...session.results,
            { cardId: card.id, rating, duration: durationMs }
          ]
        };
      });
    },
    
    endSession() {
      set(null);
    }
  };
}

export const reviewSession = createReviewStore();

export const currentCard = derived(
  reviewSession,
  $session => $session?.cards[$session.currentIndex] ?? null
);

export const sessionProgress = derived(
  reviewSession,
  $session => $session ? {
    current: $session.currentIndex + 1,
    total: $session.cards.length,
    percent: (($session.currentIndex) / $session.cards.length) * 100
  } : null
);
```

---

## 8. Future Considerations

### Collaboration Features (v2)

- Share collections with friends
- Public "study packs" marketplace
- Study groups with shared progress

**Architecture implications:**
- Add `visibility` field to collections (private/shared/public)
- Junction table for collection sharing
- Separate "original" vs "copy" concept for cards

### Kindle Integration (v2)

- OAuth with Amazon
- Sync highlights via unofficial API
- Periodic background sync

**Challenges:**
- Amazon doesn't have official highlights API
- May need to scrape kindle.amazon.com
- Rate limiting and reliability concerns

### Additional Import Sources (v2+)

- Readwise import
- Apple Books
- Kobo
- Pocket/Instapaper
- PDF annotation extraction

### Offline Support (v2)

- Service worker for static assets
- IndexedDB for card data
- Sync queue for reviews when back online
- Conflict resolution strategy

### Mobile Apps (v3)

If PWA limitations become blocking:
- React Native with shared business logic
- Or Capacitor wrapping the SvelteKit app

---

## Appendix: Key Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | SvelteKit | Best PWA support, Cloudflare adapter, smaller bundles |
| Database | Supabase Postgres | Managed, RLS built-in, good DX |
| SR Algorithm | FSRS | State-of-the-art, better than SM-2 |
| AI Model | User's choice (BYOK) | Avoids cost management, user controls quality/cost |
| Styling | Tailwind + custom | Fast iteration, design system tokens |
| State Management | Svelte stores | Simple, built-in, sufficient for this scale |
| Question approval | Review queue | Balance between quality and friction |
| MVP import | Manual paste + Web URL | Fastest to validate core loop |

---
