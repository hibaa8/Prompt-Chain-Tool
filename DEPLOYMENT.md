# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. GitHub Repository
- [x] Code pushed to GitHub (https://github.com/hibaa8/Prompt-Chain-Tool)
- [x] vercel.json configured
- [x] .vercelignore configured
- [x] README.md created

### 2. Environment Variables
Prepare these values from your .env file. You'll need to add them to Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://secure.almostcrackd.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-.env>
SUPABASE_PROJECT_ID=qihsgnfjqmkjmoowyfbn
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=388960353527-fh4grc6mla425lg0e3g1hh67omtrdihd.apps.googleusercontent.com
```

### 3. Google OAuth Configuration
After deploying to Vercel, you'll need to update your Google OAuth app:
- Go to Google Cloud Console
- In your OAuth app credentials, add your Vercel domain to **Authorized JavaScript origins**
- Add your Vercel deployment URL + `/auth/callback` to **Authorized redirect URIs**

Example (after deployment):
- **Origin**: `https://your-app.vercel.app`
- **Redirect URI**: `https://your-app.vercel.app/auth/callback`

## Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your account
3. Click "Add New" → "Project"
4. Select your GitHub repository (hibaa8/Prompt-Chain-Tool)
5. Click "Import"

### 2. Configure Build Settings
Vercel should auto-detect Next.js. Verify:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Add Environment Variables
In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_PROJECT_ID
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
```

Copy values from your `.env` file.

### 4. Deploy
Click "Deploy" and wait for build to complete.

## Post-Deployment

### 1. Update Google OAuth Redirect URLs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 credentials
3. Edit the credentials and add your Vercel domain:
   - **Authorized JavaScript origins**: `https://your-app.vercel.app`
   - **Authorized redirect URIs**: `https://your-app.vercel.app/auth/callback`
4. Save

### 2. Test Login Flow
1. Visit your Vercel deployment URL
2. Should redirect to login page
3. Click "Sign in with Google"
4. Should authenticate and redirect to dashboard
5. If not logged in as superadmin → should show "Access Denied" page

### 3. Test Functionality
- [ ] Can create new humor flavor
- [ ] Can edit flavor description/slug
- [ ] Can view flavor steps
- [ ] Can delete flavor
- [ ] Can test flavor (generates captions from image)
- [ ] Dark/light theme toggle works
- [ ] Logout works

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all env vars are set
- Verify `npm run build` works locally

### Login Redirects to Unauthorized Page
- User account must have `is_superadmin` OR `is_matrix_admin` = true in profiles table
- Check Supabase dashboard to verify your profile has correct flags

### "Failed to generate captions"
- Verify Supabase auth session is valid
- Check that api.almostcrackd.ai is reachable
- Verify imageId passed to API is valid (exists in images table)

### Google OAuth Fails
- Verify redirect URIs in Google Cloud Console match your Vercel domain
- Check NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID is correct

## Continuous Deployment

After initial deployment:
- Push changes to GitHub
- Vercel auto-deploys on push to main
- Preview deployments for pull requests

## Rollback

If deployment has issues:
- Go to Vercel dashboard
- Go to "Deployments" tab
- Click "Promote" on a previous successful deployment

---

**Deployment Status**: Ready for Vercel
**Last Updated**: 2026-03-24
**GitHub**: https://github.com/hibaa8/Prompt-Chain-Tool
