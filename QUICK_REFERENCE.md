# ⚡ Quick Reference - PredictIQ

Fast reference for common tasks and commands.

---

## 🚀 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Database commands
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
```

---

## 🔧 Environment Variables

### Minimum Required
```env
DATABASE_URL="postgresql://..."
SESSION_SECRET="32-char-secret"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."
```

### Full Setup
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
SESSION_SECRET="..."
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."

# AI & Data
OPENAI_API_KEY="sk-..."
ALCHEMY_API_KEY="..."
NEWS_API_KEY="..."

# Redis (optional)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Security
CRON_SECRET="..."
SYNC_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🔗 Important URLs

### Local Development
- **App:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/app/dashboard
- **Markets:** http://localhost:3000/app/markets
- **Signals:** http://localhost:3000/app/signals
- **Agents:** http://localhost:3000/app/agents
- **DB Studio:** https://local.drizzle.studio

### External Services
- **Neon Console:** https://console.neon.tech
- **WalletConnect:** https://cloud.walletconnect.com
- **OpenAI:** https://platform.openai.com
- **Alchemy:** https://dashboard.alchemy.com
- **NewsAPI:** https://newsapi.org/account
- **Upstash:** https://console.upstash.com
- **Vercel:** https://vercel.com/dashboard

---

## 🧪 Testing Commands

### Test API Endpoints

```bash
# Generate AI signals
curl http://localhost:3000/api/signals/generate -X POST

# Sync markets from Polymarket
curl http://localhost:3000/api/markets/sync -X POST

# Sync whale events
curl http://localhost:3000/api/whales/sync -X POST

# Sync news
curl http://localhost:3000/api/news/sync -X POST

# Run cron job (execute agents)
curl http://localhost:3000/api/cron -X POST

# Get current session
curl http://localhost:3000/api/auth/session

# Get markets
curl http://localhost:3000/api/markets?limit=10

# Get signals
curl http://localhost:3000/api/signals?limit=10

# Get whale events
curl http://localhost:3000/api/whales?limit=10
```

---

## 🔐 Authentication Flow

```
1. User → /login
2. Click "Connect Wallet"
3. RainbowKit modal opens
4. Select wallet & connect
5. GET /api/auth/nonce → returns nonce
6. Sign SIWE message (no gas)
7. POST /api/auth/verify → creates session
8. Redirect to /app/dashboard
```

---

## 💰 Trading Flow

```
1. User → /app/markets/[id]
2. Select YES or NO
3. Enter amount
4. Click "Buy"
5. Sign EIP-712 message (no gas)
6. Order → Polymarket CLOB
7. Order matched & filled
8. POST /api/trades → record in DB
9. Success message
```

---

## 🤖 Agent Execution Flow

```
1. Cron triggers /api/cron every 30 min
2. Fetch all active agents
3. For each agent:
   - Check strategy (signal_follower, whale_tracker, contrarian)
   - Fetch relevant data (signals, whale events)
   - Filter by config (minConfidence, maxPositionSize)
   - Place trades (simulated or real)
   - Log activity
4. Update agent stats
```

---

## 📊 Database Schema Quick Reference

### Key Tables
- **users** - User accounts
- **sessions** - Auth sessions
- **markets** - Prediction markets
- **signals** - AI signals
- **trades** - User trades
- **agents** - Trading agents
- **agentTrades** - Agent trades
- **agentLogs** - Agent logs
- **whaleEvents** - Large trades
- **newsArticles** - News feed

---

## 🔑 Smart Contract Addresses (Polygon)

```
CTF Exchange: 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E
USDC: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
NegRisk CTF: 0xd91e80cf2e7be2e162c6513ced06f1dd0da35296
```

---

## 🐛 Common Issues & Fixes

### "Insufficient USDC"
```bash
# Get USDC on Polygon:
# 1. Bridge from Ethereum: polygon.technology/bridge
# 2. Buy on exchange and withdraw to Polygon
# 3. Swap MATIC → USDC on Uniswap
```

### "Please switch to Polygon network"
```bash
# Click the button in the trade panel
# Or manually switch in your wallet
```

### "Verification failed"
```bash
# Check SESSION_SECRET is set in .env.local
# Restart dev server
```

### "Failed to fetch markets"
```bash
# Polymarket API might be down
# Check: https://status.polymarket.com
# Try again in a few minutes
```

### Database connection error
```bash
# Check DATABASE_URL is correct
# Test connection: npm run db:studio
# Check Neon dashboard for issues
```

### Signals show "mock" model
```bash
# Add OPENAI_API_KEY to .env.local
# Restart dev server
```

### Whale events show mock data
```bash
# Add ALCHEMY_API_KEY to .env.local
# Restart dev server
```

---

## 📦 Key Dependencies

```json
{
  "next": "16.2.6",
  "react": "19.2.4",
  "typescript": "^5",
  "drizzle-orm": "^0.45.2",
  "@rainbow-me/rainbowkit": "^2.2.11",
  "wagmi": "^2.19.5",
  "viem": "^2.51.3",
  "siwe": "^3.0.0",
  "iron-session": "^8.0.4",
  "openai": "^6.39.1",
  "tailwindcss": "^4"
}
```

---

## 🎨 Color Palette

```css
Primary: #5542ff (Purple)
Accent: #f59e0b (Amber)
Success: #22c55e (Green)
Error: #ef4444 (Red)
Info: #06b6d4 (Cyan)
Warning: #f59e0b (Amber)

Background: #0a0a0f
Surface: #13131a
Border: #1f1f28
Text: #e4e4e7
Text Muted: #71717a
```

---

## 🔗 Useful Links

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [RainbowKit](https://rainbowkit.com)
- [wagmi](https://wagmi.sh)
- [Polymarket Docs](https://docs.polymarket.com)

### Tools
- [Polygon Bridge](https://wallet.polygon.technology/polygon/bridge)
- [PolygonScan](https://polygonscan.com)
- [Uniswap](https://app.uniswap.org)
- [Polymarket](https://polymarket.com)

---

## 📞 Support Checklist

When asking for help, provide:
- [ ] Error message (full text)
- [ ] Browser console logs
- [ ] Server logs (from terminal)
- [ ] Steps to reproduce
- [ ] Environment (local/production)
- [ ] Node version: `node -v`
- [ ] npm version: `npm -v`

---

## ✅ Pre-Launch Checklist

- [ ] All environment variables set
- [ ] Database schema pushed
- [ ] Login works
- [ ] Trading works (test with $1)
- [ ] AI signals generate
- [ ] Whale tracking shows data
- [ ] Agents execute
- [ ] UI is polished
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance is good
- [ ] Analytics setup
- [ ] Error tracking setup

---

## 🚀 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Production URL set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Cron jobs configured
- [ ] Database backups enabled
- [ ] Monitoring setup
- [ ] Error alerts configured

---

**Keep this file handy for quick reference!** 📌
