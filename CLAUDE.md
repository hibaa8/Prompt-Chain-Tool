# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Humor Flavor Manager** — A Next.js admin dashboard for superadmins and matrix admins to manage humor flavor configurations and test caption generation via the REST API (api.almostcrackd.ai).

### Key Features
- Create, read, update, delete humor flavors
- Manage humor flavor steps (reorder, edit, delete)
- Test flavor configurations with real images
- Dark/light/system theme support
- Supabase authentication with role-based access control

## Commands

### Development
```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build
npm start          # Run production server
npm run lint       # Run ESLint
```

### Database & Auth
- All data stored in Supabase (project: qihsgnfjqmkjmoowyfbn)
- Auth: Google OAuth with Supabase
- Protected routes: Middleware checks `is_superadmin` OR `is_matrix_admin` from profiles table

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with dark mode (next-themes)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase + Google OAuth
- **API Client**: Custom almostCrackdClient for api.almostcrackd.ai
- **Validation**: Zod for request schemas
- **Notifications**: react-hot-toast

### File Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout with ThemeProvider
│   ├── page.tsx                # Dashboard (list humor flavors)
│   ├── globals.css             # Tailwind styles
│   ├── login/page.tsx          # Google OAuth login
│   ├── unauthorized/page.tsx   # 403 page for non-admins
│   ├── components/
│   │   └── Navbar.tsx          # Top nav with theme toggle + logout
│   ├── auth/
│   │   ├── callback/route.ts   # OAuth callback handler
│   │   └── logout/route.ts     # Sign out endpoint
│   ├── humor-flavors/
│   │   ├── new/page.tsx        # Create new flavor
│   │   ├── [id]/page.tsx       # Edit flavor + list steps
│   │   ├── [id]/test/page.tsx  # Test flavor (generate captions)
│   │   └── [id]/steps/new/page.tsx   # Add step (stub)
│   └── api/
│       ├── humor-flavors/
│       │   ├── route.ts        # GET all, POST create
│       │   └── [id]/route.ts   # GET, PUT, DELETE single flavor
│       ├── humor-flavor-steps/
│       │   ├── route.ts        # POST create step
│       │   └── [id]/route.ts   # PUT (update/reorder), DELETE step
│       ├── pipeline/
│       │   └── generate-captions/route.ts  # POST to almostCrackd API
│       ├── images/route.ts     # GET test images (is_common_use=true)
│       └── captions/route.ts   # GET captions by humor_flavor_id
├── lib/
│   ├── almostCrackdClient.ts   # Fetch wrapper with Bearer auth
│   ├── supabaseClient.ts       # Client-side Supabase instance
│   ├── supabaseServer.ts       # Server-side Supabase (SSR)
│   ├── auth.ts                 # Auth helpers (isAdmin, getCurrentUser)
│   └── validators.ts           # Zod schemas for API requests
└── middleware.ts               # Auth protection + admin check
```

## Key Implementation Details

### Authentication Flow
1. Unauthenticated users → redirected to `/login`
2. Login page → Google OAuth via Supabase
3. Callback handler (`/auth/callback`) → exchanges code for session
4. Middleware checks: Is authenticated? Is admin? If not → redirect
5. Logout endpoint clears session and redirects to `/login`

### Humor Flavor Data Model
- **humor_flavors**: slug (unique), description, created/modified timestamps
- **humor_flavor_steps**: Ordered steps (order_by field) with LLM config
  - Each step references: llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id
  - Contains: system_prompt, user_prompt, temperature
- **captions**: Generated captions linked to humor_flavor_id + image_id

### API Integration with almostCrackd
- All requests use `almostCrackdClient.ts` which:
  - Prepends `https://api.almostcrackd.ai` to path
  - Adds Bearer token from Supabase session
  - Sets `Content-Type: application/json`
- Endpoint `/pipeline/generate-captions` accepts `{imageId: string}`
- Response includes generated captions

### Step Reordering Logic
- Steps stored with `order_by` smallint field
- Reorder endpoint (`PUT /api/humor-flavor-steps/[id]`) handles:
  - Detect move direction (up/down)
  - Shift intermediate steps' order_by values
  - Update target step to new position
  - All updates within same flavor

### Dark Mode
- Uses `next-themes` with `ThemeProvider` in root layout
- Tailwind `darkMode: "class"` in config
- Theme toggle in Navbar (stores preference in localStorage)
- System preference as default

## Database Tables (from database.md)

### Core Tables
- **profiles**: is_superadmin, is_matrix_admin flags
- **humor_flavors**: id, slug (unique), description, created_by_user_id, modified_by_user_id, timestamps
- **humor_flavor_steps**: id, humor_flavor_id, order_by, llm prompts, temperature, model/type references
- **humor_flavor_step_types**: Available step type definitions
- **llm_models**: Available LLM models to choose from
- **llm_input_types**: Input type options (e.g., image, text)
- **llm_output_types**: Output type options (e.g., text, json)
- **images**: Test images (is_common_use=true for admin testing)
- **captions**: Generated captions with humor_flavor_id, image_id, text

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://secure.almostcrackd.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env>
SUPABASE_PROJECT_ID=qihsgnfjqmkjmoowyfbn
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=388960353527-fh4grc6mla425lg0e3g1hh67omtrdihd.apps.googleusercontent.com
```

(VERCEL_URL auto-set by Vercel for production deployment)

## Testing & Development

### Manual Testing
1. **Auth**: `npm run dev` → visit http://localhost:3000 → redirects to login → sign in with Google
2. **Dashboard**: View all flavors, create new, edit, delete
3. **Testing**: Select image → click "Test" → calls `/api/pipeline/generate-captions`
4. **Theme**: Toggle sun/moon icon to test dark/light mode

### API Testing
```bash
# Create flavor
curl -X POST http://localhost:3000/api/humor-flavors \
  -H "Content-Type: application/json" \
  -d '{"slug":"test-flavor","description":"Test"}'

# Get flavor with steps
curl http://localhost:3000/api/humor-flavors/1

# Generate captions
curl -X POST http://localhost:3000/api/pipeline/generate-captions \
  -H "Content-Type: application/json" \
  -d '{"imageId":"<image-uuid>"}'
```

## Known Limitations & TODO

- **Step Creation/Editing**: UI is stubbed. Needs to:
  - Fetch available llm_models, llm_input_types, llm_output_types from Supabase
  - Allow selection of these fields
  - Full CRUD for steps (edit page not yet built)
- **Drag-Drop Reordering**: Step list shows order but no drag UI. Can use arrow buttons or reorder API directly.
- **Captions Display**: Test results show generated captions but no filtering/export yet.

## References from Week1 Project

This project reuses patterns from `/Users/admin/Documents/humor-project/HumorProject-Week1`:
- `almostCrackdClient.ts`: API client with Bearer auth pattern
- `supabaseClient.ts` / `supabaseServer.ts`: Supabase setup for client/server
- Auth callback flow for Google OAuth
- API route patterns for Supabase CRUD
- Middleware auth protection

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Set env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
4. Build & deploy
5. Update OAuth redirect URI in Google Console to Vercel URL

---

**Last Updated**: 2026-03-24
**Author**: Claude Code
**Version**: 0.1.0 (MVP - dashboard, flavor CRUD, caption testing)
