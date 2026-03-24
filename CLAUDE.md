# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server — http://localhost:3000
npm run build      # Production build (must pass before pushing)
npm run lint       # ESLint
npm start          # Run production build
```

**Always run `npm run build` locally and confirm it succeeds before committing or pushing.**

## Architecture

**Next.js 15 admin dashboard** for managing humor flavor configurations. Superadmins and matrix admins only.

### Stack
- **Next.js 15** with App Router, TypeScript
- **Supabase** — auth (Google OAuth) + database (PostgreSQL)
- **@supabase/ssr** — server-side Supabase with cookie-based sessions
- **Tailwind CSS** + **next-themes** (dark/light/system)
- **Zod** — request validation
- **react-hot-toast** — notifications
- **api.almostcrackd.ai** — external REST API for caption generation

### Environment Variables

The app reads from `.env` (already present, not committed). Both prefixed and unprefixed names are supported:

```
SUPABASE_URL  (or NEXT_PUBLIC_SUPABASE_URL)
SUPABASE_ANON_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_PROJECT_ID
GOOGLE_OAUTH_CLIENT_ID  (or NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID)
```

### Auth Flow

1. `/login` → link to `/auth/signin`
2. `/auth/signin` — calls `supabase.auth.signInWithOAuth({ provider: "google" })` → redirects to Google
3. `/auth/callback` — `exchangeCodeForSession(code)`, checks `profiles.is_superadmin || profiles.is_matrix_admin`, redirects to `/` or `/unauthorized`
4. `middleware.ts` — runs on every non-static request; calls `supabase.auth.getUser()` and checks profile flags; redirects to `/login` or `/unauthorized`
5. `/auth/logout` — signs out, redirects to `/`

**Access control:** `profiles.is_superadmin` OR `profiles.is_matrix_admin` must be `true`. Checked in both middleware and `/auth/callback`.

### Key File Relationships

```
middleware.ts                    # Auth gate for all routes
src/lib/
  supabaseServer.ts             # createSupabaseServerClient() — used in API routes + server pages
  supabaseClient.ts             # Client-side supabase instance (browser)
  almostCrackdClient.ts         # almostCrackdFetch() — wraps fetch with Bearer token
  auth.ts                       # isAdmin() helper for API route guards
  validators.ts                 # Zod schemas (createHumorFlavorSchema uses `name` field, maps to `slug` column)
src/app/
  layout.tsx                    # Server layout (exports metadata)
  layout-client.tsx             # "use client" — ThemeProvider + Navbar + Toaster
  page.tsx                      # Dashboard: lists all humor_flavors
  humor-flavors/
    new/page.tsx                # Create flavor (POSTs `name` + `description`)
    [id]/page.tsx               # Edit flavor + list/reorder steps
    [id]/steps/new/page.tsx     # Add step — fetches /api/humor-flavor-steps/options for dropdowns
    [id]/steps/[stepId]/edit/   # Edit existing step
    [id]/test/page.tsx          # Test flavor: pick image → generate captions via API
  api/
    humor-flavors/route.ts      # GET all, POST create
    humor-flavors/[id]/route.ts # GET (with steps), PUT, DELETE
    humor-flavor-steps/route.ts # POST create step
    humor-flavor-steps/[id]/route.ts  # GET, PUT (update or reorder), DELETE
    humor-flavor-steps/options/route.ts  # GET llm_models, llm_input_types, llm_output_types, step_types
    pipeline/generate-captions/route.ts  # POST → almostCrackdFetch → /pipeline/generate-captions
    images/route.ts             # GET images where is_common_use=true
    captions/route.ts           # GET captions, optional ?humor_flavor_id=
```

### Database Schema (relevant tables — read-only, never modify schema)

Only INSERT/UPDATE/DELETE rows. Never CREATE/DROP/ALTER tables.

- **humor_flavors** — `id`, `slug` (unique), `description`, `created_by_user_id`, `modified_by_user_id`, timestamps
- **humor_flavor_steps** — `id`, `humor_flavor_id`, `order_by` (smallint), `llm_system_prompt`, `llm_user_prompt`, `llm_temperature`, `llm_model_id`, `llm_input_type_id`, `llm_output_type_id`, `humor_flavor_step_type_id`, `description`
- **profiles** — `id` (= auth.users.id), `is_superadmin` (bool), `is_matrix_admin` (bool)
- **images** — `id` (uuid), `url`, `image_description`, `is_common_use`
- **captions** — `id`, `content`, `humor_flavor_id`, `image_id`
- **llm_models**, **llm_input_types**, **llm_output_types**, **humor_flavor_step_types** — lookup tables for step config

### `humor_flavors` name vs slug

The DB column is `slug`. The UI/validator uses `name`. API routes try inserting with `name` first, then fall back to `slug` if the column doesn't exist. Keep this fallback pattern when updating those routes.

### Step Reorder Logic

`PUT /api/humor-flavor-steps/[id]` with `{ from_order, to_order }` triggers reorder. It shifts all intermediate steps' `order_by` values and sets the target step's new position. All other PUT calls are treated as regular field updates.

### Caption Generation

`POST /api/pipeline/generate-captions` accepts `{ imageId, humorFlavorId? }`. Calls `almostCrackdFetch("/pipeline/generate-captions", ...)` with the user's Supabase Bearer token. If `humorFlavorId` causes a 400/422, it retries without it. The test page uses `normalizeGeneratedCaptions()` to handle varying response shapes from the API.

### Important Patterns

- All API routes that mutate data call `isAdmin()` first (from `src/lib/auth.ts`)
- `supabaseServer.ts` reads both `SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*` env names — don't change this
- Dynamic client pages (with hooks) export `export const dynamic = "force-dynamic"` to prevent static generation errors
- The root layout is split: `layout.tsx` (server, exports `metadata`) imports `layout-client.tsx` (`"use client"`, wraps children in ThemeProvider)
- API routes use Next.js 15 `params: Promise<{ id: string }>` — always `await params` before using `id`

### Vercel Deployment

Set these env vars in Vercel project settings (copy from `.env`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PROJECT_ID`
- `GOOGLE_OAUTH_CLIENT_ID`

After deploy, add the Vercel domain to Google OAuth authorized redirect URIs: `https://<your-app>.vercel.app/auth/callback`
