# 🚀 Setup Guide - PredictIQ

Complete setup instructions to get your Cobot.gg clone running with full trading functionality.

---

## ✅ Prerequisites

- Node.js 18+ installed
- A crypto wallet (MetaMask, Coinbase Wallet, etc.)
- Some USDC on Polygon network for testing trades

---

## 📦 Step 1: Install Dependencies

```bash
npm install
```

---

## 🔑 Step 2: Environment Variables

### Required (Minimum to Run)

1. **Database** - Get free PostgreSQL from [Neon](https://neon.tech)
   ```env
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   ```

2. **Session Secret** - Generate a random 32+ character string
   ```bash
   # Generate on Mac/Linux:
   openssl rand -base64 32
   
   # Or use any random string:
   SESSION_SECRET="your-super-secret-32-char-minimum-string-here"
   ```

3. **WalletConnect Project ID** - Get free at [cloud.walletconnect.com](https://cloud.walletconnect.com)
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
   ```

### Recommended (For Full Features)

4. **OpenAI API Key** - For AI signal generation
   - Get from [platform.openai.com](https://platform.openai.com)
   ```env
   OPENAI_API_KEY="sk-..."
   ```

5. **Alchemy API Key** - For whale tracking on Polygon
   - Get free at [alchemy.com](https://www.alchemy.com)
   ```env
   ALCHEMY_API_KEY="your-alchemy-key"
   ```

6. **NewsAPI Key** - For news feed
   - Get free at [newsapi.org](https://newsapi.org)
   ```env
   NEWS_API_KEY="your-newsapi-key"
   ```

7. **Upstash Redis** - For caching (optional but recommended)
   - Get free at [upstash.com](https://upstash.com)
   ```env
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="your-token"
   ```

### Your Complete `.env.local` File

```env
# ── Required ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require"
SESSION_SECRET="your-32-char-minimum-secret-here!"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"

# ── App Config ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="PredictIQ"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── AI & Intelligence ─────────────────────────────────────────────────────────
OPENAI_API_KEY="sk-..."
NEWS_API_KEY="your-newsapi-key"
ALCHEMY_API_KEY="your-alchemy-key"

# ── Redis (Optional) ──────────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="your-token"

# ── Security ──────────────────────────────────────────────────────────────────
CRON_SECRET="your-cron-secret-change-me"
SYNC_SECRET="your-sync-secret-change-me"
```

---

## 🗄️ Step 3: Database Setup

1. **Push schema to database:**
   ```bash
   npm run db:push
   ```

2. **Verify tables created:**
   ```bash
   npm run db:studio
   ```
   This opens Drizzle Studio at `https://local.drizzle.studio`

---

## 🏃 Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Step 5: Test Authentication

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Connect Wallet"
3. Select your wallet (MetaMask, Coinbase, etc.)
4. Sign the message (no gas required)
5. You should be redirected to `/app/dashboard`

**Troubleshooting:**
- If signature fails, check that `SESSION_SECRET` is set
- If redirect fails, check browser console for errors
- Make sure you're on a supported network (Polygon or Mumbai)

---

## 💰 Step 6: Get Test USDC on Polygon

To test trading, you need USDC on Polygon mainnet:

### Option 1: Bridge from Ethereum
1. Go to [polygon.technology/bridge](https://wallet.polygon.technology/polygon/bridge)
2. Bridge USDC from Ethereum to Polygon

### Option 2: Buy on Exchange
1. Buy USDC on Coinbase/Binance
2. Withdraw to Polygon network

### Option 3: Swap on Polygon
1. Bridge MATIC to Polygon
2. Swap MATIC → USDC on [Uniswap](https://app.uniswap.org)

**Minimum for testing:** $10 USDC

---

## 📊 Step 7: Test Trading

1. Go to [http://localhost:3000/app/markets](http://localhost:3000/app/markets)
2. Click on any market
3. Select YES or NO
4. Enter amount (minimum $1)
5. Click "Buy YES" or "Buy NO"
6. Sign the order (no gas required)
7. Order submits to Polymarket CLOB

**What happens:**
- Your wallet signs an EIP-712 typed message (free, no gas)
- Order is submitted to Polymarket's CLOB (Central Limit Order Book)
- Trade is recorded in your database
- You can view your position on Polymarket

---

## 🤖 Step 8: Test AI Signals

1. Go to [http://localhost:3000/app/signals](http://localhost:3000/app/signals)
2. If `OPENAI_API_KEY` is set, you'll see GPT-4 generated signals
3. If not set, you'll see mock signals (demo mode)

**To generate fresh signals:**
```bash
curl http://localhost:3000/api/signals/generate -X POST
```

---

## 🐋 Step 9: Test Whale Tracking

1. Go to [http://localhost:3000/app/whales](http://localhost:3000/app/whales)
2. If `ALCHEMY_API_KEY` is set, you'll see real whale events
3. If not set, you'll see mock whale data

**To sync whale events:**
```bash
curl http://localhost:3000/api/whales/sync -X POST
```

---

## 🤖 Step 10: Create Trading Agent

1. Go to [http://localhost:3000/app/agents](http://localhost:3000/app/agents)
2. Click "Create Agent"
3. Choose strategy:
   - **Signal Follower** - Follows AI signals
   - **Whale Tracker** - Mirrors whale trades
   - **Contrarian** - Trades opposite to signals
4. Configure risk settings
5. Start agent

**Agent runs automatically via cron every 30 minutes**

---

## ⏰ Step 11: Setup Cron Jobs (Production)

For production deployment on Vercel:

1. **Add Vercel Cron:**
   Create `vercel.json`:
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

2. **Protect cron endpoint:**
   Set `CRON_SECRET` in Vercel environment variables

3. **What cron does:**
   - Runs active agents every 30 min
   - Syncs markets every 5 min
   - Syncs whale events every 10 min
   - Generates AI signals every hour

---

## 🚀 Step 12: Deploy to Production

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/predictiq.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Add all environment variables
   - Deploy

3. **Update environment variables:**
   ```env
   NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
   ```

4. **Enable Vercel Cron:**
   - Cron jobs automatically work on Vercel Pro plan
   - Free plan: Use external cron service like [cron-job.org](https://cron-job.org)

---

## 🧪 Testing Checklist

- [ ] Login with wallet works
- [ ] Can view markets
- [ ] Can see AI signals
- [ ] Can see whale events
- [ ] Can place a trade (test with $1)
- [ ] Trade appears in portfolio
- [ ] Can create an agent
- [ ] Agent logs show activity
- [ ] Dashboard shows stats

---

## 🐛 Common Issues

### "Insufficient USDC" Error
- **Solution:** Get USDC on Polygon network (see Step 6)

### "Please switch to Polygon network"
- **Solution:** Click the button to switch networks in your wallet

### "Verification failed" on login
- **Solution:** Check `SESSION_SECRET` is set in `.env.local`

### "Failed to fetch markets"
- **Solution:** Polymarket API might be down, try again in a few minutes

### AI Signals show "mock" model
- **Solution:** Add `OPENAI_API_KEY` to `.env.local`

### Whale events show mock data
- **Solution:** Add `ALCHEMY_API_KEY` to `.env.local`

### Database connection error
- **Solution:** Check `DATABASE_URL` is correct and database is accessible

---

## 📚 Next Steps

Once everything is working:

1. **Customize branding** - Update logo, colors, copy
2. **Add more markets** - Integrate Kalshi and Limitless APIs
3. **Improve UI** - Match Cobot.gg design more closely
4. **Add analytics** - Track user behavior with PostHog/Mixpanel
5. **Add notifications** - Telegram/Discord alerts for signals
6. **Mobile optimization** - Improve responsive design
7. **Add tests** - Write unit and E2E tests

---

## 🆘 Need Help?

- Check browser console for errors
- Check server logs: `npm run dev`
- Check database: `npm run db:studio`
- Review API responses in Network tab

---

## 🎉 You're Ready!

Your Cobot.gg clone is now fully functional with:
- ✅ Wallet authentication (SIWE)
- ✅ Real Polymarket trading
- ✅ AI-powered signals
- ✅ Whale tracking
- ✅ Autonomous agents
- ✅ Portfolio tracking

Happy trading! 🚀
