# Deployment Checklist - Ready for Tomorrow 🚀

## Pre-Deployment Checklist

### 1. Environment Variables ✅

**Current `.env.local` (DO NOT COMMIT THIS FILE):**
```env
DATABASE_URL="postgresql://..." ✅
NEXT_PUBLIC_PRIVY_APP_ID="cmpur8liy01330cktghj1puai" ✅
NEXT_PUBLIC_POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/Lwx35hjwSWWN91Wke4Qpk" ✅
NEWS_API_KEY="428d7a29e49c457888f40ad755452a48" ✅
ALCHEMY_API_KEY="Lwx35hjwSWWN91Wke4Qpk" ✅
CRON_SECRET="predictiq-cron-secret-change-me" ⚠️ CHANGE THIS
```

**Action Items:**
- [ ] Change `CRON_SECRET` to a strong random string
- [ ] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (optional, for rate limiting)
- [ ] Add `OPENAI_API_KEY` (optional, for AI features)

### 2. Vercel Deployment Setup

#### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub account
3. Install Vercel GitHub app

#### Step 2: Import Project
1. Click "Add New Project"
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

#### Step 3: Configure Environment Variables
Add these in Vercel dashboard (Settings → Environment Variables):

**Required:**
```
DATABASE_URL=postgresql://neondb_owner:npg_4XCeRqZ8Hpgk@ep-fragrant-surf-apwrn83w-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXT_PUBLIC_PRIVY_APP_ID=cmpur8liy01330cktghj1puai
NEXT_PUBLIC_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/Lwx35hjwSWWN91Wke4Qpk
ALCHEMY_API_KEY=Lwx35hjwSWWN91Wke4Qpk
CRON_SECRET=<generate-new-strong-secret>
NEXT_PUBLIC_APP_NAME=PredictIQ
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Optional:**
```
NEWS_API_KEY=428d7a29e49c457888f40ad755452a48
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
OPENAI_API_KEY=
SYNC_SECRET=
```

#### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Visit your live URL!

### 3. GitHub Repository Setup

#### Step 1: Create `.gitignore` (Already exists ✅)
Verify it includes:
```
.env.local
.env
node_modules/
.next/
```

#### Step 2: Initialize Git (If not already done)
```bash
git init
git add .
git commit -m "Initial commit - PredictIQ prediction market platform"
```

#### Step 3: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `predictiq` (or your choice)
3. Description: "Prediction market platform powered by Polymarket"
4. Public or Private (your choice)
5. **DO NOT** initialize with README (we already have one)

#### Step 4: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/predictiq.git
git branch -M main
git push -u origin main
```

### 4. Database Setup (Already Done ✅)

- [x] Neon PostgreSQL database created
- [x] Tables created and migrated
- [x] Markets synced (200+ markets)
- [x] Event grouping columns added

**No action needed** - Database is ready!

### 5. Privy Authentication (Already Configured ✅)

- [x] Privy App ID configured
- [x] Email + Social + Wallet login enabled
- [x] Embedded wallets enabled

**Action Items:**
- [ ] Add production domain to Privy dashboard (after deployment)
  1. Go to https://dashboard.privy.io
  2. Select your app
  3. Settings → Domains
  4. Add: `https://your-domain.vercel.app`

### 6. Cron Jobs (Vercel)

**File**: `vercel.json` (Already configured ✅)

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-markets",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Action Items:**
- [ ] After deployment, verify cron job is running:
  - Vercel Dashboard → Your Project → Cron Jobs
  - Should see: "sync-markets" running every 15 minutes

### 7. Code Quality Checks

#### Run Before Pushing:
```bash
# Check for TypeScript errors
npm run build

# Check for linting issues (optional)
npm run lint

# Test the app locally
npm run dev
```

### 8. Documentation Files to Review

**Already Created:**
- [x] `README.md` - Project overview
- [x] `DEPLOYMENT_GUIDE.md` - Deployment instructions
- [x] `ARCHITECTURE.md` - System architecture
- [x] `WEBSOCKET_MEMORY_LEAK_FIXED.md` - WebSocket fix details
- [x] `NETWORK_SWITCHING_FIXED.md` - Network switching fix
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

**Action Items:**
- [ ] Update `README.md` with live demo URL (after deployment)
- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel env vars with actual domain

### 9. Security Checklist

- [x] `.env.local` in `.gitignore`
- [x] No API keys in code
- [x] Database connection uses SSL
- [x] Cron endpoints protected with `CRON_SECRET`
- [ ] Change `CRON_SECRET` to strong random value
- [x] Privy handles authentication securely
- [x] No sensitive data in client-side code

### 10. Performance Optimizations (Already Done ✅)

- [x] 30-second polling for market updates
- [x] Cron job for background sync (every 15 minutes)
- [x] Database indexes on frequently queried columns
- [x] Event-based market grouping
- [x] Client-side category filtering

### 11. Known Issues & Future Improvements

**Current State:**
- ✅ Navigation working (market cards → detail pages)
- ✅ Network switching automatic (Polygon)
- ✅ Event grouping working
- ✅ Category tabs working
- ⏸️ WebSocket disabled (memory leak fixed, ready to re-enable)

**Future Improvements:**
- [ ] Re-enable WebSocket for real-time prices (after testing)
- [ ] Add Redis caching (Upstash)
- [ ] Add AI-powered market insights (OpenAI)
- [ ] Add portfolio tracking
- [ ] Add market creation
- [ ] Add social features (comments, sharing)

---

## Tomorrow's Deployment Steps

### Morning (Preparation)

1. **Test Locally One More Time**
   ```bash
   npm run build
   npm run dev
   ```
   - Test navigation
   - Test trading (with network switching)
   - Test all category tabs
   - Test search

2. **Update Environment Variables**
   - Generate new `CRON_SECRET`:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Update `.env.local` with new secret
   - **DO NOT COMMIT `.env.local`**

3. **Clean Up Temporary Files**
   ```bash
   # Remove any test files or logs
   rm -f *.log
   rm -f test-*.js
   ```

### Afternoon (GitHub Push)

1. **Review Changes**
   ```bash
   git status
   git diff
   ```

2. **Commit All Changes**
   ```bash
   git add .
   git commit -m "feat: Complete prediction market platform with Polymarket integration

   Features:
   - Real-time market data from Polymarket Gamma API
   - Event-based market grouping
   - Category filtering (Trending, Politics, Sports, Finance, Crypto)
   - Automatic network switching to Polygon
   - Trading integration with Polymarket CLOB
   - Privy authentication (Email + Social + Wallet)
   - 30-second polling + 15-minute background sync
   - Responsive Cobot-style UI

   Fixes:
   - WebSocket memory leak fixed (currently disabled)
   - Network switching for Polygon blockchain
   - Market detail page navigation
   - Event page grouping
   - Price parsing from Gamma API"
   ```

3. **Create GitHub Repository**
   - Go to https://github.com/new
   - Create repository
   - Copy the remote URL

4. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/predictiq.git
   git branch -M main
   git push -u origin main
   ```

### Evening (Vercel Deployment)

1. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel auto-detects Next.js

2. **Configure Environment Variables**
   - Copy all variables from `.env.local`
   - Paste into Vercel dashboard
   - **Change `CRON_SECRET`** to new value
   - Update `NEXT_PUBLIC_APP_URL` to Vercel domain

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Visit live URL!

4. **Post-Deployment**
   - Add Vercel domain to Privy dashboard
   - Test the live site
   - Verify cron job is running
   - Test trading on live site

---

## Quick Reference Commands

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
```

### Database
```bash
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

### Git
```bash
git status           # Check status
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to GitHub
```

### Generate Secrets
```bash
# Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SYNC_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Environment Variables Template (For Vercel)

Copy this and fill in the values in Vercel dashboard:

```env
# Database
DATABASE_URL=

# App
NEXT_PUBLIC_APP_NAME=PredictIQ
NEXT_PUBLIC_APP_URL=

# Auth
NEXT_PUBLIC_PRIVY_APP_ID=

# Blockchain
ALCHEMY_API_KEY=
NEXT_PUBLIC_POLYGON_RPC=

# Cron
CRON_SECRET=

# Optional
NEWS_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
OPENAI_API_KEY=
SYNC_SECRET=
```

---

## Troubleshooting

### Build Fails on Vercel
- Check TypeScript errors: `npm run build`
- Check environment variables are set
- Check Node.js version (should be 18.x or higher)

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Verify SSL mode is enabled

### Cron Job Not Running
- Check `CRON_SECRET` is set in Vercel
- Verify `vercel.json` is in root directory
- Check Vercel dashboard → Cron Jobs

### Authentication Not Working
- Add production domain to Privy dashboard
- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is correct
- Check browser console for errors

---

## Success Criteria ✅

Your deployment is successful when:

- [ ] GitHub repository created and pushed
- [ ] Vercel deployment successful (green checkmark)
- [ ] Live URL accessible
- [ ] Markets page loads with data
- [ ] Can click on markets and see detail pages
- [ ] Can sign in with Privy
- [ ] Can place trades (with network switching)
- [ ] Cron job running (check Vercel dashboard)
- [ ] No console errors in browser

---

**Status**: Ready for deployment tomorrow! 🚀
**Estimated Time**: 1-2 hours total
**Difficulty**: Easy (mostly point-and-click)

Good luck with the deployment! Let me know if you need any help tomorrow.
