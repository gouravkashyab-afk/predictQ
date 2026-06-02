# Deployment Guide 🚀

Complete guide to deploy your Polymarket trading platform to production.

---

## Prerequisites

- [x] Vercel account (free tier works)
- [x] Neon database (already configured)
- [x] Privy account (already configured)
- [x] Alchemy API key (already configured)

---

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Complete Polymarket trading platform with real trading"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:npg_4XCeRqZ8Hpgk@ep-fragrant-surf-apwrn83w-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# App
NEXT_PUBLIC_APP_NAME="PredictIQ"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Privy (Authentication)
NEXT_PUBLIC_PRIVY_APP_ID="cmpur8liy01330cktghj1puai"

# Alchemy (Blockchain)
ALCHEMY_API_KEY="Lwx35hjwSWWN91Wke4Qpk"
NEXT_PUBLIC_POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/Lwx35hjwSWWN91Wke4Qpk"

# Cron (Security)
CRON_SECRET="your-secure-random-string-here"

# Sync (Security)
SYNC_SECRET="your-secure-random-string-here"
```

### Optional Variables (for future features)

```bash
# Redis (for caching)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# AI (for signal generation)
OPENAI_API_KEY=""

# News (for news sync)
NEWS_API_KEY=""
```

---

## Step 4: Update Privy Configuration

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Select your app: `cmpur8liy01330cktghj1puai`
3. Go to **Settings → Basics**
4. Update **Allowed Origins**:
   - Add your Vercel domain: `https://your-domain.vercel.app`
   - Add your custom domain (if any)
5. Update **Redirect URIs**:
   - Add: `https://your-domain.vercel.app/app/home`
6. Click **Save**

---

## Step 5: Run Database Migrations

```bash
# Install dependencies
npm install

# Generate migration
npm run db:generate

# Push to database
npm run db:push
```

Or manually run:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

---

## Step 6: Configure Vercel Cron

The `vercel.json` file is already configured to run cron every 30 minutes:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**Vercel will automatically:**
- Run `/api/cron` every 30 minutes
- Execute all active agents
- Sync markets, news, whale events
- Generate AI signals

**To verify cron is working:**
1. Go to Vercel Dashboard → Your Project → Cron
2. Check "Last Run" timestamp
3. Check logs for any errors

---

## Step 7: Test Production Deployment

### Test Authentication
1. Visit `https://your-domain.vercel.app`
2. Click "Sign In"
3. Login with Google/Email/Wallet
4. Verify embedded wallet is created

### Test Markets
1. Go to `/app/markets`
2. Verify markets are loading from Polymarket
3. Click on a market
4. Verify market details and chart

### Test Trading
1. Click "Buy YES" or "Buy NO"
2. Enter amount (e.g., $10)
3. Click "Buy"
4. Sign the order in Privy modal
5. Verify success screen shows order ID
6. Check Portfolio for the trade

### Test Agents
1. Go to `/app/agents`
2. Click on an agent
3. Enable the agent
4. Set position size
5. Save settings
6. Wait for cron (30 min) or trigger manually:
   ```bash
   curl -X GET https://your-domain.vercel.app/api/cron \
     -H "Authorization: Bearer your-cron-secret"
   ```
7. Check agent logs

---

## Step 8: Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `predictiq.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-60 minutes)

### Update Environment Variables

```bash
NEXT_PUBLIC_APP_URL="https://predictiq.com"
```

### Update Privy Configuration

1. Go to Privy Dashboard
2. Add your custom domain to Allowed Origins
3. Add redirect URI: `https://predictiq.com/app/home`

---

## Step 9: Monitoring & Logs

### View Logs

```bash
# Via Vercel CLI
vercel logs

# Or in Vercel Dashboard
# Go to: Your Project → Deployments → [Latest] → Logs
```

### Monitor Cron Jobs

1. Go to Vercel Dashboard → Your Project → Cron
2. Check execution history
3. View logs for each run

### Monitor Database

1. Go to [Neon Console](https://console.neon.tech)
2. Check connection count
3. Monitor query performance

---

## Step 10: Security Checklist

- [ ] Change `CRON_SECRET` to a secure random string
- [ ] Change `SYNC_SECRET` to a secure random string
- [ ] Enable Privy MFA for admin accounts
- [ ] Set up rate limiting (Vercel Pro)
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CORS properly
- [ ] Review Privy security settings
- [ ] Enable database connection pooling
- [ ] Set up backup strategy

---

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
vercel --force

# Check build logs
vercel logs --follow
```

### Database Connection Issues

```bash
# Test connection
npm run db:studio

# Check connection string
echo $DATABASE_URL
```

### Cron Not Running

1. Check Vercel Dashboard → Cron
2. Verify `CRON_SECRET` is set
3. Check function logs
4. Ensure function timeout is sufficient (60s default)

### Privy Authentication Issues

1. Check Allowed Origins in Privy Dashboard
2. Verify `NEXT_PUBLIC_PRIVY_APP_ID` is correct
3. Check browser console for errors
4. Clear cookies and try again

---

## Performance Optimization

### Enable Caching

```typescript
// In API routes
export const revalidate = 60; // Cache for 60 seconds
```

### Enable Edge Runtime

```typescript
// In API routes
export const runtime = 'edge';
```

### Optimize Images

```typescript
// Use Next.js Image component
import Image from 'next/image';
```

### Enable Compression

Vercel automatically enables gzip/brotli compression.

---

## Scaling Considerations

### Database
- Neon Free Tier: 0.5 GB storage, 1 compute unit
- Upgrade to Pro for more resources
- Enable connection pooling

### Vercel
- Free Tier: 100 GB bandwidth, 100 GB-hours
- Upgrade to Pro for more resources
- Enable Edge Functions for better performance

### Cron Jobs
- Free Tier: 1 cron job
- Pro Tier: Unlimited cron jobs
- Consider using Upstash QStash for more control

---

## Backup Strategy

### Database Backups

Neon automatically backs up your database daily.

To create manual backup:
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Code Backups

GitHub automatically backs up your code.

---

## Monitoring & Analytics

### Vercel Analytics

1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable Web Analytics
3. View page views, performance, etc.

### Error Monitoring (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

---

## Cost Estimate

### Free Tier (Hobby)
- Vercel: Free (100 GB bandwidth)
- Neon: Free (0.5 GB storage)
- Privy: Free (up to 1,000 MAU)
- Alchemy: Free (300M compute units/month)
- **Total: $0/month**

### Production (Pro)
- Vercel Pro: $20/month
- Neon Pro: $19/month
- Privy Pro: $99/month (up to 10,000 MAU)
- Alchemy Growth: $49/month
- **Total: ~$187/month**

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure environment variables
3. ✅ Update Privy settings
4. ✅ Test all features
5. ✅ Set up monitoring
6. ✅ Configure custom domain
7. ✅ Enable analytics
8. ✅ Set up backups
9. 🚀 Launch!

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io)
- [Polymarket API Docs](https://docs.polymarket.com)
- [Neon Documentation](https://neon.tech/docs)

---

## Summary

Your Polymarket trading platform is now ready for production! 🎉

**What's deployed:**
- ✅ Real trading with Polymarket
- ✅ Privy authentication (email, social, wallet)
- ✅ Embedded wallets (multi-chain)
- ✅ Agent execution system
- ✅ Portfolio tracking
- ✅ Automated cron jobs
- ✅ Market sync
- ✅ News sync
- ✅ Whale tracking
- ✅ AI signal generation

**Ready to scale!** 🚀
