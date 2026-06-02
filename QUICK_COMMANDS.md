# Quick Command Reference 🚀

Essential commands for tomorrow's deployment.

---

## Pre-Deployment Commands

### 1. Generate New CRON_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and update in Vercel environment variables.

### 2. Test Build
```bash
npm run build
```
Should complete without errors.

### 3. Test Locally
```bash
npm run dev
```
Open http://localhost:3000 and test all features.

---

## Git Commands

### Check Status
```bash
git status
```

### Stage All Changes
```bash
git add .
```

### Commit
```bash
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

### Add Remote (Replace YOUR_USERNAME)
```bash
git remote add origin https://github.com/YOUR_USERNAME/predictiq.git
```

### Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---

## Database Commands

### Push Schema Changes
```bash
npm run db:push
```

### Open Drizzle Studio
```bash
npm run db:studio
```

### Sync Markets Manually
```bash
curl http://localhost:3000/api/markets/sync
```

---

## Development Commands

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Run Linter
```bash
npm run lint
```

---

## Vercel CLI Commands (Optional)

### Install Vercel CLI
```bash
npm i -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Deploy from CLI
```bash
vercel --prod
```

### View Logs
```bash
vercel logs
```

---

## Useful One-Liners

### Check Node Version
```bash
node --version
```
Should be 18.x or higher.

### Check npm Version
```bash
npm --version
```

### Clear Next.js Cache
```bash
rm -rf .next
```

### Clear node_modules
```bash
rm -rf node_modules
npm install
```

### Check Port 3000
```bash
# Windows
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### View Environment Variables (Local)
```bash
cat .env.local
```

### Count Lines of Code
```bash
# Windows PowerShell
(Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Get-Content | Measure-Object -Line).Lines
```

---

## GitHub Repository Setup

### 1. Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `predictiq`
3. Description: `Prediction market platform powered by Polymarket`
4. Public or Private (your choice)
5. **DO NOT** initialize with README
6. Click "Create repository"

### 2. Copy Remote URL
```
https://github.com/YOUR_USERNAME/predictiq.git
```

### 3. Add Remote and Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/predictiq.git
git branch -M main
git push -u origin main
```

---

## Vercel Deployment Steps

### 1. Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"

### 2. Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 3. Add Environment Variables
Click "Environment Variables" and add:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_NAME=PredictIQ
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_PRIVY_APP_ID=cmpur8liy01330cktghj1puai
ALCHEMY_API_KEY=Lwx35hjwSWWN91Wke4Qpk
NEXT_PUBLIC_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/Lwx35hjwSWWN91Wke4Qpk
CRON_SECRET=<your-new-secret>
NEWS_API_KEY=428d7a29e49c457888f40ad755452a48
```

### 4. Deploy
Click "Deploy" and wait 2-3 minutes.

---

## Post-Deployment Commands

### Test Live API
```bash
# Replace with your Vercel URL
curl https://your-app.vercel.app/api/markets
```

### Trigger Cron Job Manually
```bash
# Replace with your Vercel URL and CRON_SECRET
curl -X POST https://your-app.vercel.app/api/cron/sync-markets \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check Vercel Logs
```bash
vercel logs --follow
```

---

## Troubleshooting Commands

### If Build Fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### If Database Connection Fails
```bash
# Test connection
node -e "const { drizzle } = require('drizzle-orm/neon-http'); const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); const db = drizzle(sql); console.log('Connected!');"
```

### If Port 3000 is Busy
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### View All Environment Variables
```bash
# Local
cat .env.local

# Vercel (via CLI)
vercel env ls
```

---

## Quick Reference URLs

### Development
- Local: http://localhost:3000
- Drizzle Studio: http://localhost:4983

### Services
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub: https://github.com
- Neon Dashboard: https://console.neon.tech
- Privy Dashboard: https://dashboard.privy.io
- Alchemy Dashboard: https://dashboard.alchemy.com

### Documentation
- Next.js: https://nextjs.org/docs
- Drizzle: https://orm.drizzle.team/docs
- Privy: https://docs.privy.io
- Polymarket: https://docs.polymarket.com

---

## Emergency Commands

### Rollback Deployment
```bash
# Revert last commit
git revert HEAD

# Push
git push origin main

# Vercel auto-deploys previous version
```

### Stop Dev Server
```
Ctrl + C
```

### Force Kill Process
```bash
# Windows
taskkill /F /IM node.exe
```

### Clear All Caches
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

## Checklist Format

Copy this for tomorrow:

```
[ ] Generate new CRON_SECRET
[ ] Test build: npm run build
[ ] Test locally: npm run dev
[ ] Commit changes: git add . && git commit -m "..."
[ ] Create GitHub repo
[ ] Push to GitHub: git push origin main
[ ] Import to Vercel
[ ] Add environment variables
[ ] Deploy
[ ] Add Vercel domain to Privy
[ ] Test live site
[ ] Verify cron job
```

---

**Pro Tip**: Keep this file open in a separate tab tomorrow for quick reference! 📌
