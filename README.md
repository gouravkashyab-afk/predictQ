# 🚀 PredictIQ - Prediction Market Trading Platform

A modern, Cobot.gg-inspired platform for trading prediction markets powered by Polymarket. Built with Next.js 16, TypeScript, and Privy authentication.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**🌐 Live Demo:** [Coming Soon]

---

## ✨ Features

### Core Features (Implemented ✅)
- 🔐 **Multi-Auth System** - Email, Social (Google, Twitter, Discord), and Wallet login via Privy
- 📊 **Live Markets** - Real-time market data from Polymarket Gamma API
- 🎯 **Event Grouping** - Markets grouped by events (like Polymarket/Cobot)
- 🏷️ **Smart Categories** - Trending, New, Politics, Sports, Finance, Crypto
- 💰 **Gasless Trading** - EIP-712 signatures via Polymarket CLOB, no gas fees
- 🔄 **Auto Network Switching** - Automatically switches wallet to Polygon network
- 📈 **Real-time Updates** - 30-second polling + 15-minute background sync
- 🎨 **Cobot-style UI** - Clean, modern interface inspired by Cobot.gg

### Coming Soon 🚧
- 🤖 **AI Signals** - GPT-4 powered trade recommendations
- 🐋 **Whale Tracking** - Monitor large trades on Polygon
- 📰 **News Feed** - Real-time news with sentiment analysis
- 📊 **Portfolio** - Track positions and P&L

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - App Router with Turbopack
- **React 19** - Latest features
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Privy** - Authentication (Email + Social + Wallet)

### Backend
- **Next.js API Routes** - Serverless functions
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL (Neon)** - Serverless database
- **Vercel Cron** - Scheduled market sync

### Web3 & Trading
- **Polymarket Gamma API** - Market data
- **Polymarket CLOB API** - Order execution
- **EIP-712** - Gasless order signing
- **Polygon (MATIC)** - Blockchain network
- **Alchemy** - RPC provider

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)
- Privy account (free at https://dashboard.privy.io)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/predictiq.git
cd predictiq
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required variables:

```env
# Database (Get from Neon: https://neon.tech)
DATABASE_URL="postgresql://..."

# App
NEXT_PUBLIC_APP_NAME="PredictIQ"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth (Get from Privy: https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"

# Blockchain (Get from Alchemy: https://alchemy.com)
ALCHEMY_API_KEY="your-alchemy-key"
NEXT_PUBLIC_POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Cron (Generate random string)
CRON_SECRET="your-random-secret"

# Optional
NEWS_API_KEY=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
OPENAI_API_KEY=""
```

**📖 See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed setup.**

### 4. Setup Database

```bash
npm run db:push
```

### 5. Sync Markets (Optional)

```bash
# Sync 200 markets from Polymarket
curl http://localhost:3000/api/markets/sync
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📖 Documentation

- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[NETWORK_SWITCHING_FIXED.md](./NETWORK_SWITCHING_FIXED.md)** - Network switching details
- **[WEBSOCKET_MEMORY_LEAK_FIXED.md](./WEBSOCKET_MEMORY_LEAK_FIXED.md)** - WebSocket implementation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[AGENTS.md](./AGENTS.md)** - Next.js version notes

---

## 🎯 How It Works

### Market Browsing
1. Markets synced from Polymarket every 15 minutes
2. Grouped by events (e.g., "2026 FIFA World Cup" with 56+ markets)
3. Filtered by categories using keyword matching
4. Real-time price updates via 30-second polling

### Trading Flow
1. User browses markets and selects YES or NO
2. Enters amount in USDC
3. App checks wallet network → Auto-switches to Polygon if needed
4. User signs EIP-712 order (no gas fees)
5. Order submitted to Polymarket CLOB
6. Order matched and filled
7. Trade recorded in database

### Authentication
1. User clicks "Sign In"
2. Chooses Email, Social (Google/Twitter/Discord), or Wallet
3. Privy handles authentication
4. Embedded wallet created automatically
5. User can trade immediately

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── markets/      # Market data & sync
│   │   ├── trades/       # Trade execution
│   │   └── cron/         # Scheduled jobs
│   ├── app/              # Protected app pages
│   │   ├── markets/     # Market browser & detail
│   │   │   ├── page.tsx           # Markets list
│   │   │   ├── [id]/page.tsx     # Market detail
│   │   │   └── event/[id]/page.tsx  # Event page
│   │   ├── dashboard/   # Dashboard
│   │   └── portfolio/   # Portfolio (coming soon)
│   └── page.tsx         # Landing page
├── components/
│   ├── app/            # App components
│   │   ├── CobotMarketCard.tsx  # Market card
│   │   ├── TradePanel.tsx       # Trading interface
│   │   ├── PriceChart.tsx       # Price chart
│   │   └── Orderbook.tsx        # Orderbook display
│   └── providers/      # Context providers
├── lib/                # Core libraries
│   ├── polymarket.ts           # Polymarket API client
│   ├── polymarket-trading.ts   # Trading logic
│   ├── polymarket-websocket.ts # WebSocket client
│   └── db/
│       ├── schema.ts   # Database schema
│       └── client.ts   # Drizzle client
└── hooks/
    └── usePolymarketWebSocket.ts  # WebSocket hook
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to DB
npm run db:studio    # Open Drizzle Studio
```

---

## 🌐 API Endpoints

### Markets
- `GET /api/markets` - List markets with filtering
- `GET /api/markets/[id]` - Get market details + orderbook
- `GET /api/markets/[id]/history` - Price history
- `POST /api/markets/sync` - Sync markets from Polymarket
- `GET /api/markets/event/[id]` - Get all markets in an event

### Trading
- `POST /api/trades` - Record trade in database

### Cron Jobs
- `POST /api/cron/sync-markets` - Background market sync (every 15 min)

---

## 🚀 Deployment

### Vercel (Recommended)

**📖 See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete guide.**

#### Quick Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**
   - Copy from `.env.local`
   - Paste into Vercel dashboard
   - **Important**: Change `CRON_SECRET` to new value

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Visit your live URL! 🎉

5. **Post-Deployment**
   - Add Vercel domain to Privy dashboard
   - Verify cron job is running
   - Test trading on live site

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_NAME="PredictIQ"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_PRIVY_APP_ID="..."
ALCHEMY_API_KEY="..."
NEXT_PUBLIC_POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/..."
CRON_SECRET="..."
NEWS_API_KEY="..."
```

### Cron Jobs

The `vercel.json` file is already configured:

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

This syncs markets every 15 minutes automatically.

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Sign in with email
- [ ] Sign in with Google
- [ ] Sign in with wallet (MetaMask, Coinbase Wallet)
- [ ] Embedded wallet created automatically

**Markets:**
- [ ] Markets page loads with data
- [ ] Category tabs work (Trending, Politics, Sports, etc.)
- [ ] Search works
- [ ] Click market title → Opens detail page
- [ ] Event grouping shows "+X more markets"
- [ ] Click "+X more markets" → Opens event page

**Trading:**
- [ ] Enter amount and click "Buy YES"
- [ ] Wallet switches to Polygon automatically
- [ ] Sign order (no gas fees)
- [ ] Trade executes successfully
- [ ] Success message shows with transaction link

**Real-time Updates:**
- [ ] Prices update every 30 seconds
- [ ] Markets sync in background (check after 15 min)

### Test on Polygon Mainnet

**Important**: This uses real USDC on Polygon mainnet. Start with small amounts ($1-5) for testing.

1. Get USDC on Polygon:
   - Bridge from Ethereum: https://wallet.polygon.technology/polygon/bridge
   - Or buy directly on Polygon via on-ramp

2. Test trade with $1-5 to verify everything works

3. Monitor transaction on PolygonScan

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- [Polymarket](https://polymarket.com) - Market data & trading infrastructure
- [Cobot.gg](https://cobot.gg) - Design inspiration
- [Privy](https://privy.io) - Authentication solution
- [Drizzle ORM](https://orm.drizzle.team) - Database toolkit
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Vercel](https://vercel.com) - Hosting platform

---

## 📞 Support

- 📧 Email: support@predictiq.app
- 🐦 Twitter: [@predictiq](https://twitter.com/predictiq)
- 💬 Discord: [Join our server](https://discord.gg/predictiq)

---

## 🗺️ Roadmap

### Phase 1: Core Platform ✅ (Current)
- [x] Market browsing with event grouping
- [x] Category filtering
- [x] Trading integration
- [x] Privy authentication
- [x] Automatic network switching
- [x] Real-time price updates

### Phase 2: Enhanced Features 🚧 (Next)
- [ ] WebSocket for real-time prices
- [ ] Portfolio tracking
- [ ] Trade history
- [ ] Market search improvements
- [ ] Mobile responsive design

### Phase 3: Advanced Features 🔮 (Future)
- [ ] AI-powered market insights
- [ ] Whale tracking
- [ ] Social features (comments, sharing)
- [ ] Market creation
- [ ] Trading bots/agents
- [ ] News feed integration

---

Built with ❤️ for the prediction market community
