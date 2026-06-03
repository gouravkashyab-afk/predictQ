# User Isolation & Privacy Explained

## Overview

The system is designed with **two-level performance tracking**:
1. **User-Specific P&L** (Private, Isolated)
2. **Global Strategy Performance** (Public, Collective)

---

## 🔒 What's ISOLATED Per User (Private)

### Your Personal P&L
Each user only sees their OWN profits and losses:

```
User A sees:
  ├─ My Total P&L: +$245.50
  ├─ My Agent 1: +$180.00
  ├─ My Agent 2: +$65.50
  └─ My Win Rate: 66.7%

User B sees:
  ├─ My Total P&L: +$120.30
  ├─ My Agent 1: +$90.00
  ├─ My Agent 2: +$30.30
  └─ My Win Rate: 58.5%
```

**User A cannot see User B's P&L and vice versa!**

### API Endpoint: `/api/user/performance`
```typescript
GET /api/user/performance
Headers: { "x-user-id": "user-123" }

Response:
{
  "userId": "user-123",
  "summary": {
    "totalPnL": 245.50,        // ← YOUR P&L only
    "realizedPnL": 180.00,
    "unrealizedPnL": 65.50,
    "totalTrades": 42,
    "wins": 28,
    "losses": 14,
    "winRate": 66.7
  },
  "agents": [
    {
      "agentId": "agent-456",
      "agentName": "My BTC Agent",    // ← YOUR agents only
      "metrics": { ... }
    }
  ]
}
```

---

## 🌍 What's GLOBAL (Public, Collective)

### Strategy Performance (Aggregate)
Shows how each strategy performs **across ALL users combined**:

```
Strategy Leaderboard (Public):
  1. Signal Follower Strategy
     ├─ Total P&L: +$12,450 (all users combined)
     ├─ Win Rate: 62.5% (average)
     ├─ Total Trades: 1,234 (all users)
     └─ Used by: 45 agents (all users)

  2. Whale Tracker Strategy
     ├─ Total P&L: +$9,320 (all users combined)
     ├─ Win Rate: 58.2% (average)
     ├─ Total Trades: 892 (all users)
     └─ Used by: 32 agents (all users)

  3. Allora Follower Strategy
     ├─ Total P&L: +$7,150 (all users combined)
     ├─ Win Rate: 65.3% (average)
     ├─ Total Trades: 567 (all users)
     └─ Used by: 28 agents (all users)
```

**Purpose:** Help users choose which strategy to use based on collective performance.

**Privacy:** Individual user P&L is NOT shown, only aggregate stats.

### API Endpoint: `/api/performance/leaderboard`
```typescript
GET /api/performance/leaderboard

Response:
{
  "strategies": [
    {
      "strategy": "signal_follower",
      "totalTrades": 1234,        // ← ALL users combined
      "winRate": 62.5,            // ← Average across all users
      "totalPnL": 12450,          // ← SUM of all users
      "sharpeRatio": 1.52,
      "roi": 11.2
    },
    {
      "strategy": "whale_tracker",
      "totalTrades": 892,
      "winRate": 58.2,
      "totalPnL": 9320,
      ...
    }
  ],
  "summary": {
    "totalAgents": 105,           // ← All agents across all users
    "activeAgents": 82,
    "bestStrategy": "signal_follower"
  }
}
```

**Note:** Individual user data is NOT exposed!

---

## Database Structure

### User-Specific Tables
```sql
-- Each agent belongs to ONE user
agents
  ├─ id
  ├─ userId        ← Links to specific user
  ├─ name
  ├─ strategy
  └─ ...

-- Each trade belongs to ONE agent (and thus ONE user)
agent_trades
  ├─ id
  ├─ agentId       ← Links to agent (which links to user)
  ├─ status
  ├─ amountUsdc
  └─ ...

-- Each position belongs to ONE agent
positions
  ├─ id
  ├─ agentId       ← Links to agent (which links to user)
  ├─ entryPrice
  ├─ unrealizedPnl
  └─ ...
```

### Query Isolation
```typescript
// Get ONLY user's agents
const userAgents = await db
  .select()
  .from(agents)
  .where(eq(agents.userId, userId));  // ← Filter by user!

// Get ONLY user's trades (via their agents)
const userTrades = await db
  .select()
  .from(agentTrades)
  .where(eq(agentTrades.agentId, userAgentId));  // ← Agent belongs to user

// User cannot query other users' data!
```

---

## How It Works in Practice

### Scenario 1: User Views Their Dashboard
```
User A logs in
   ↓
Dashboard loads
   ↓
Call: GET /api/user/performance
   Headers: { "x-user-id": "user-a-123" }
   ↓
Query filters by userId
   ↓
Returns ONLY User A's data:
   • User A's agents
   • User A's trades
   • User A's P&L
   ↓
Display: "Your Total P&L: +$245.50"
```

**User A CANNOT see User B's P&L!**

### Scenario 2: User Views Strategy Performance
```
User A visits "Strategy Leaderboard"
   ↓
Call: GET /api/performance/leaderboard
   (No user-specific filter)
   ↓
Query aggregates ALL users:
   • Signal Follower: +$12,450 (all users)
   • Whale Tracker: +$9,320 (all users)
   ↓
Display: "Signal Follower strategy has 62.5% win rate across all users"
```

**Purpose:** Help User A choose which strategy to use based on global performance.

**Privacy:** User A's individual P&L is NOT shown in this view.

---

## Privacy Protection

### What Users CAN See:
✅ Their own P&L
✅ Their own agents' performance
✅ Their own trades
✅ Global strategy statistics (aggregate, no individual data)

### What Users CANNOT See:
❌ Other users' P&L
❌ Other users' agents
❌ Other users' trades
❌ Which user is behind which agent

---

## UI Components

### 1. User Performance Dashboard (Private)
```tsx
<UserPerformanceDashboard userId={currentUser.id} />
```

**Shows:**
- Your Total P&L: +$245.50
- Your Win Rate: 66.7%
- Your Agents:
  - Agent 1: +$180.00
  - Agent 2: +$65.50

**Does NOT show:**
- Other users' data

### 2. Strategy Leaderboard (Public)
```tsx
<AgentLeaderboard />
```

**Shows:**
- Signal Follower: 62.5% win rate (collective)
- Whale Tracker: 58.2% win rate (collective)
- Allora: 65.3% win rate (collective)

**Does NOT show:**
- Individual user P&L
- Which user uses which strategy

---

## Security

### Authentication Required
All user-specific endpoints require authentication:

```typescript
// User must be authenticated
const userId = req.headers.get("x-user-id");
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Query only returns data for THIS user
const userAgents = await db
  .select()
  .from(agents)
  .where(eq(agents.userId, userId));  // ← Security!
```

### Authorization Checks
Users can only access their own data:

```typescript
// Check agent belongs to user
const agent = await db.select().from(agents).where(eq(agents.id, agentId));
if (agent.userId !== currentUserId) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## Example Flows

### Flow 1: User A Checks Their P&L
```
1. User A logs in (userId: "user-a-123")
2. Visit dashboard
3. API: GET /api/user/performance
   Headers: { "x-user-id": "user-a-123" }
4. Backend:
   - Queries agents WHERE userId = "user-a-123"
   - Calculates P&L for User A's agents only
5. Returns:
   - Your P&L: +$245.50
   - Your agents: [Agent 1, Agent 2]
6. Display in UI
```

**Result:** User A sees ONLY their data.

### Flow 2: User A Checks Strategy Performance
```
1. User A visits "Strategy Leaderboard"
2. API: GET /api/performance/leaderboard
   (No user filter - global view)
3. Backend:
   - Queries ALL agents from ALL users
   - Groups by strategy
   - Aggregates: SUM(P&L), AVG(win rate)
4. Returns:
   - Signal Follower: +$12,450 total (all users)
   - Whale Tracker: +$9,320 total (all users)
5. Display in UI
```

**Result:** User A sees global stats to help choose strategy, but NOT individual user P&L.

---

## Summary

### 🔒 ISOLATED (Private):
- **User P&L** - Each user only sees their own profits
- **User Agents** - Each user only sees their own agents
- **User Trades** - Each user only sees their own trades

### 🌍 GLOBAL (Public):
- **Strategy Performance** - Collective stats across all users
- **Win Rates** - Average across all users
- **Total Trades** - Sum across all users

### 🎯 Purpose:
- **Isolated P&L** - Privacy and personal tracking
- **Global Stats** - Help users choose best strategies
- **No Individual Exposure** - Users don't see each other's profits

---

## API Summary

| Endpoint | Scope | Returns | Privacy |
|----------|-------|---------|---------|
| `GET /api/user/performance` | **User-Specific** | Your P&L, your agents | 🔒 Private |
| `GET /api/agents/[id]/performance` | **Agent-Specific** | One agent's metrics | 🔒 Private (if user owns agent) |
| `GET /api/performance/leaderboard` | **Global** | Strategy stats (collective) | 🌍 Public (no individual P&L) |

---

**Bottom Line:**

✅ **Your P&L is private** - Only you see your profits
✅ **Strategy performance is public** - Everyone sees which strategies work best (collectively)
✅ **No cross-user visibility** - You can't see other users' money
✅ **Best of both worlds** - Privacy + helpful global insights

This is how platforms like Robinhood, eToro, etc. handle it! 🚀
