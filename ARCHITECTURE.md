# 🏗️ Architecture Overview - PredictIQ

Visual guide to how everything works together.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Landing    │  │    Login     │  │   App Pages  │     │
│  │     Page     │  │     Page     │  │  (Protected) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Proxy.ts                            │  │
│  │  (Route Protection & Session Validation)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │   Auth   │      │ Markets  │      │  Agents  │         │
│  │   APIs   │      │   APIs   │      │   APIs   │         │
│  └──────────┘      └──────────┘      └──────────┘         │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      CORE LIBRARIES                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Session │  │Polymarket│  │ Signals  │  │  Agents  │   │
│  │ Manager  │  │   API    │  │  Engine  │  │  Engine  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │             │             │             │         │
└─────────┼─────────────┼─────────────┼─────────────┼─────────┘
          │             │             │             │
          ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │Polymarket│  │  OpenAI  │  │ Alchemy  │   │
│  │  (Neon)  │  │   CLOB   │  │  GPT-4   │  │ Polygon  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────┐
│  User    │
│ Browser  │
└────┬─────┘
     │
     │ 1. Visit /login
     ▼
┌──────────────────┐
│  Login Page      │
│  (RainbowKit)    │
└────┬─────────────┘
     │
     │ 2. Connect Wallet
     ▼
┌──────────────────┐
│  User's Wallet   │
│  (MetaMask, etc) │
└────┬─────────────┘
     │
     │ 3. Request Nonce
     ▼
┌──────────────────┐
│ GET /api/auth/   │
│     nonce        │
└────┬─────────────┘
     │
     │ 4. Return Nonce
     ▼
┌──────────────────┐
│  Build SIWE      │
│   Message        │
└────┬─────────────┘
     │
     │ 5. Sign Message (no gas)
     ▼
┌──────────────────┐
│  User's Wallet   │
│  Signs Message   │
└────┬─────────────┘
     │
     │ 6. Send Signature
     ▼
┌──────────────────┐
│ POST /api/auth/  │
│     verify       │
└────┬─────────────┘
     │
     │ 7. Verify Signature
     │ 8. Create Session (iron-session)
     │ 9. Upsert User in DB
     ▼
┌──────────────────┐
│  Set Cookie      │
│  (siwe)          │
└────┬─────────────┘
     │
     │ 10. Redirect to /app/dashboard
     ▼
┌──────────────────┐
│  Dashboard       │
│  (Authenticated) │
└──────────────────┘
```

---

## 💰 Trading Flow

```
┌──────────┐
│  User    │
│ Browser  │
└────┬─────┘
     │
     │ 1. Browse Markets
     ▼
┌──────────────────┐
│ GET /api/markets │
└────┬─────────────┘
     │
     │ 2. Fetch from Polymarket CLOB
     ▼
┌──────────────────┐
│  Polymarket API  │
│  (CLOB)          │
└────┬─────────────┘
     │
     │ 3. Return Markets
     ▼
┌──────────────────┐
│  Markets Page    │
│  (Display Cards) │
└────┬─────────────┘
     │
     │ 4. Click Market
     ▼
┌──────────────────┐
│  Market Detail   │
│  + Trade Panel   │
└────┬─────────────┘
     │
     │ 5. Select YES/NO
     │ 6. Enter Amount
     │ 7. Check Balance (wagmi)
     ▼
┌──────────────────┐
│  Read USDC       │
│  Balance         │
│  (Polygon)       │
└────┬─────────────┘
     │
     │ 8. Balance OK?
     ▼
┌──────────────────┐
│  Build Order     │
│  (EIP-712)       │
└────┬─────────────┘
     │
     │ 9. Sign Order (no gas)
     ▼
┌──────────────────┐
│  User's Wallet   │
│  Signs EIP-712   │
└────┬─────────────┘
     │
     │ 10. Submit Order
     ▼
┌──────────────────┐
│  Polymarket CLOB │
│  POST /order     │
└────┬─────────────┘
     │
     │ 11. Match Order
     │ 12. Return Order Hash
     ▼
┌──────────────────┐
│ POST /api/trades │
│ (Record in DB)   │
└────┬─────────────┘
     │
     │ 13. Success!
     ▼
┌──────────────────┐
│  Success Screen  │
│  + PolygonScan   │
│     Link         │
└──────────────────┘
```

---

## 🤖 AI Signals Flow

```
┌──────────────────┐
│  Cron Job        │
│  (Every 1 hour)  │
└────┬─────────────┘
     │
     │ 1. Trigger
     ▼
┌──────────────────┐
│ POST /api/       │
│ signals/generate │
└────┬─────────────┘
     │
     │ 2. Fetch Top Markets
     ▼
┌──────────────────┐
│  Polymarket API  │
│  (Top by Volume) │
└────┬─────────────┘
     │
     │ 3. Return Markets
     ▼
┌──────────────────┐
│  Check OpenAI    │
│  API Key         │
└────┬─────────────┘
     │
     ├─ Yes ─────────────┐
     │                   │
     │ 4. Send to GPT-4  │
     ▼                   │
┌──────────────────┐    │
│  OpenAI API      │    │
│  (GPT-4o)        │    │
└────┬─────────────┘    │
     │                   │
     │ 5. Analyze        │
     │ 6. Generate       │
     │    Signals        │
     ▼                   │
┌──────────────────┐    │
│  Parse Response  │    │
└────┬─────────────┘    │
     │                   │
     └───────────────────┤
                         │
     ├─ No ──────────────┘
     │
     │ 4. Generate Mock Signals
     ▼
┌──────────────────┐
│  Mock Signal     │
│  Generator       │
└────┬─────────────┘
     │
     │ 7. Insert into DB
     ▼
┌──────────────────┐
│  PostgreSQL      │
│  (signals table) │
└────┬─────────────┘
     │
     │ 8. Return Signals
     ▼
┌──────────────────┐
│  Signals Page    │
│  (Display Cards) │
└──────────────────┘
```

---

## 🐋 Whale Tracking Flow

```
┌──────────────────┐
│  Cron Job        │
│  (Every 10 min)  │
└────┬─────────────┘
     │
     │ 1. Trigger
     ▼
┌──────────────────┐
│ POST /api/       │
│ whales/sync      │
└────┬─────────────┘
     │
     │ 2. Check Alchemy Key
     ▼
┌──────────────────┐
│  Alchemy API     │
│  (Polygon)       │
└────┬─────────────┘
     │
     │ 3. Fetch USDC Transfers
     │    TO Polymarket Contracts
     ▼
┌──────────────────┐
│  Filter:         │
│  - Amount > $10K │
│  - USDC Token    │
│  - Known Addrs   │
└────┬─────────────┘
     │
     │ 4. Parse Events
     ▼
┌──────────────────┐
│  Whale Events    │
│  (IN/OUT)        │
└────┬─────────────┘
     │
     │ 5. Insert into DB
     ▼
┌──────────────────┐
│  PostgreSQL      │
│  (whale_events)  │
└────┬─────────────┘
     │
     │ 6. Display
     ▼
┌──────────────────┐
│  Whale Feed Page │
│  (Live Updates)  │
└──────────────────┘
```

---

## 🤖 Agent Execution Flow

```
┌──────────────────┐
│  Cron Job        │
│  (Every 30 min)  │
└────┬─────────────┘
     │
     │ 1. Trigger
     ▼
┌──────────────────┐
│ POST /api/cron   │
└────┬─────────────┘
     │
     │ 2. Fetch Active Agents
     ▼
┌──────────────────┐
│  PostgreSQL      │
│  (agents table)  │
│  WHERE status=   │
│  'active'        │
└────┬─────────────┘
     │
     │ 3. For Each Agent
     ▼
┌──────────────────┐
│  Check Strategy  │
└────┬─────────────┘
     │
     ├─ signal_follower ──┐
     │                    │
     │ 4. Fetch Signals   │
     ▼                    │
┌──────────────────┐     │
│  Filter by       │     │
│  minConfidence   │     │
└────┬─────────────┘     │
     │                    │
     │ 5. Place Trades    │
     ▼                    │
┌──────────────────┐     │
│  Record in       │     │
│  agent_trades    │     │
└────┬─────────────┘     │
     │                    │
     └────────────────────┤
                          │
     ├─ whale_tracker ────┤
     │                    │
     │ 4. Fetch Whales    │
     │ 5. Mirror Trades   │
     │                    │
     └────────────────────┤
                          │
     ├─ contrarian ───────┘
     │
     │ 4. Fetch Signals
     │ 5. Trade Opposite
     ▼
┌──────────────────┐
│  Log Activity    │
│  (agent_logs)    │
└────┬─────────────┘
     │
     │ 6. Update Stats
     ▼
┌──────────────────┐
│  Update Agent    │
│  - lastRunAt     │
│  - totalTrades   │
└──────────────────┘
```

---

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                      USERS & AUTH                            │
│                                                              │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │  users   │────────▶│ sessions │         │  user_   │    │
│  │          │         │          │         │ settings │    │
│  │ id (PK)  │         │ id (PK)  │         │          │    │
│  │ wallet   │         │ userId   │         │ userId   │    │
│  │ email    │         │ token    │         │ riskLevel│    │
│  └──────────┘         │ expires  │         │ maxPos   │    │
│                       └──────────┘         └──────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      MARKETS & DATA                          │
│                                                              │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │ markets  │         │ signals  │         │  whale_  │    │
│  │          │         │          │         │  events  │    │
│  │condition │         │ id (PK)  │         │          │    │
│  │  Id (PK) │         │condition │         │ id (PK)  │    │
│  │ question │         │ direction│         │ txHash   │    │
│  │ yesPrice │         │confidence│         │ wallet   │    │
│  │ noPrice  │         │ reasoning│         │ amountUsd│    │
│  │ volume   │         │ model    │         │ direction│    │
│  └──────────┘         └──────────┘         └──────────┘    │
│                                                              │
│  ┌──────────┐         ┌──────────┐                          │
│  │  news_   │         │  news_   │                          │
│  │ articles │────────▶│ market_  │                          │
│  │          │         │   map    │                          │
│  │ id (PK)  │         │          │                          │
│  │ title    │         │ articleId│                          │
│  │ url      │         │condition │                          │
│  │ sentiment│         │ relevance│                          │
│  └──────────┘         └──────────┘                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TRADING & AGENTS                          │
│                                                              │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │  trades  │         │  agents  │────────▶│  agent_  │    │
│  │          │         │          │         │  trades  │    │
│  │ id (PK)  │         │ id (PK)  │         │          │    │
│  │ userId   │         │ userId   │         │ id (PK)  │    │
│  │condition │         │ strategy │         │ agentId  │    │
│  │ direction│         │ status   │         │ tradeId  │    │
│  │ amountUsd│         │ config   │         │condition │    │
│  │ orderHash│         │totalTrade│         │ direction│    │
│  └──────────┘         │ totalPnl │         └──────────┘    │
│                       └──────────┘                          │
│                              │                              │
│                              ▼                              │
│                       ┌──────────┐                          │
│                       │  agent_  │                          │
│                       │   logs   │                          │
│                       │          │                          │
│                       │ id (PK)  │                          │
│                       │ agentId  │                          │
│                       │ level    │                          │
│                       │ message  │                          │
│                       │ metadata │                          │
│                       └──────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Summary

### User Journey
```
Landing → Login → Connect Wallet → Sign Message → Dashboard
                                                      │
                    ┌─────────────────────────────────┤
                    │                                 │
                    ▼                                 ▼
                 Markets                          Signals
                    │                                 │
                    ▼                                 ▼
              Market Detail                      AI Analysis
                    │                                 │
                    ▼                                 ▼
               Trade Panel                       Trade Action
                    │                                 │
                    └─────────────┬───────────────────┘
                                  ▼
                            Place Trade
                                  │
                                  ▼
                          Polymarket CLOB
                                  │
                                  ▼
                            Order Filled
                                  │
                                  ▼
                          Record in DB
                                  │
                                  ▼
                            Portfolio
```

### Agent Journey
```
Cron Trigger → Fetch Active Agents → For Each Agent:
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            signal_follower        whale_tracker           contrarian
                    │                      │                      │
                    ▼                      ▼                      ▼
            Fetch Signals          Fetch Whales          Fetch Signals
                    │                      │                      │
                    ▼                      ▼                      ▼
            Filter by Config       Mirror Trades         Trade Opposite
                    │                      │                      │
                    └──────────────────────┼──────────────────────┘
                                           ▼
                                    Place Trades
                                           │
                                           ▼
                                    Log Activity
                                           │
                                           ▼
                                    Update Stats
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY STACK                          │
│                                                              │
│  Layer 1: Route Protection (proxy.ts)                       │
│  ├─ Check session cookie                                    │
│  ├─ Redirect if not authenticated                           │
│  └─ Preserve intended destination                           │
│                                                              │
│  Layer 2: Session Management (iron-session)                 │
│  ├─ Encrypted session cookies                               │
│  ├─ Secure, httpOnly, sameSite                              │
│  └─ 7-day expiration                                        │
│                                                              │
│  Layer 3: Authentication (SIWE)                             │
│  ├─ Nonce-based replay protection                           │
│  ├─ Signature verification                                  │
│  └─ Wallet ownership proof                                  │
│                                                              │
│  Layer 4: Trading (EIP-712)                                 │
│  ├─ Typed structured data                                   │
│  ├─ Domain separation                                       │
│  └─ Signature verification                                  │
│                                                              │
│  Layer 5: API Protection                                    │
│  ├─ CRON_SECRET for /api/cron                               │
│  ├─ SYNC_SECRET for sync endpoints                          │
│  └─ Rate limiting (optional, via Redis)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js App (Serverless)                 │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Pages   │  │   API    │  │  Static  │           │  │
│  │  │ (SSR/SSG)│  │  Routes  │  │  Assets  │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Vercel Cron                          │  │
│  │  (Triggers /api/cron every 30 minutes)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │   Upstash    │    │   External   │
│    (Neon)    │    │    Redis     │    │     APIs     │
│              │    │              │    │              │
│ - Serverless │    │ - Caching    │    │ - Polymarket │
│ - Auto-scale │    │ - Rate Limit │    │ - OpenAI     │
│ - Backups    │    │ - Sessions   │    │ - Alchemy    │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 📊 Performance Considerations

### Caching Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                      CACHING LAYERS                          │
│                                                              │
│  Browser Cache (Next.js)                                    │
│  ├─ Static assets: 1 year                                   │
│  ├─ Pages: Revalidate on demand                             │
│  └─ API responses: No cache                                 │
│                                                              │
│  Redis Cache (Upstash)                                      │
│  ├─ Markets: 30 seconds                                     │
│  ├─ Signals: 5 minutes                                      │
│  ├─ Whale events: 1 minute                                  │
│  └─ News: 15 minutes                                        │
│                                                              │
│  Database (Neon)                                            │
│  ├─ Connection pooling                                      │
│  ├─ Query optimization                                      │
│  └─ Indexes on key columns                                  │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture is designed for:
- ✅ **Scalability** - Serverless functions scale automatically
- ✅ **Security** - Multiple layers of protection
- ✅ **Performance** - Caching at every level
- ✅ **Reliability** - Managed services with high uptime
- ✅ **Cost-Efficiency** - Pay only for what you use

---

**Questions about the architecture? Check the other docs!**
