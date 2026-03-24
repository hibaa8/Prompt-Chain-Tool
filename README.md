# Humor Flavor Manager

A Next.js admin dashboard for managing humor flavor configurations and testing caption generation via the REST API.

## Features

- Create, read, update, delete humor flavors
- Manage humor flavor steps with ordering
- Test flavors with image selection
- Dark/light/system theme support
- Role-based access control (superadmin/matrix_admin only)
- Real-time caption generation using api.almostcrackd.ai

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (already configured)
- Google OAuth credentials (in .env)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=https://secure.almostcrackd.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_PROJECT_ID=qihsgnfjqmkjmoowyfbn
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=388960353527-fh4grc6mla425lg0e3g1hh67omtrdihd.apps.googleusercontent.com
```

## Vercel Deployment

This project is configured for Vercel deployment:

1. Push to your GitHub repository
2. Import the repository in Vercel
3. Vercel will auto-detect Next.js and configure build settings
4. Add environment variables in Vercel project settings
5. Deploy

For detailed architecture and implementation notes, see [CLAUDE.md](./CLAUDE.md).

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

- `/src/app` - Next.js App Router pages and API routes
- `/src/lib` - Utility functions and API clients
- `/src/app/components` - Reusable React components

## Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend and authentication
- **Zod** - Request validation
- **next-themes** - Dark mode support

## Notes

- Auth is protected by middleware - unauthenticated users redirected to login
- Only superadmins and matrix admins can access the dashboard
- All database modifications are tracked with created_by_user_id and modified_by_user_id
