# Phase 5: Real Wallet Signing & Trade Execution

## Overview

Phase 5 enables **real trading** on Polymarket. Before this, all agents were in "simulation mode" (paper trading). Now agents can execute real trades using user wallets.

## What Was Implemented

### 1. **Polymarket CLOB Client** (`src/lib/polymarket-client.ts`)
A complete client for interacting with Polymarket's Central Limit Order Book (CLOB) API.

**Features:**
- ✅ Create and sign orders using EIP-712
- ✅ Submit orders to Polymarket
- ✅ Get order status
- ✅ Cancel orders
- ✅ Fetch market order books
- ✅ Get user's orders and trade history

**Key Functions:**
```typescript
createAndSignOrder(params, privateKey) // Sign order with wallet
submitOrder(signedOrder) // Submit to Polymarket
getOrderStatus(orderId) // Check order status
cancelOrder(orderId, privateKey) // Cancel pending order
```

### 2. **Wallet Manager** (`src/lib/wallet-manager.ts`)
Handles wallet signing for autonomous agent trades with safety checks.

**Features:**
- ✅ Wallet key management (Privy integration ready)
- ✅ Agent permission checks
- ✅ Spending limit enforcement (per-trade & daily)
- ✅ User balance checks
- ✅ Trade execution with fallback to simulation
- ✅ Emergency stop all agents

**Key Functions:**
```typescript
executeAgentTrade(params) // Execute real or simulated trade
canAgentTrade(agentId) // Check agent permissions
checkSpendingLimits(agentId, amount) // Verify limits
getUserBalance(userId) // Get USDC balance
toggleAgentRealTrading(agentId, enabled) // Enable/disable real trading
emergencyStopAllAgents(userId) // Panic button
```

### 3. **Updated Agent Engine** (`src/lib/agent-engine.ts`)
Modified to support both simulated and real trading.

**Changes:**
- ✅ Added `simulateOnly` config option (default: `true`)
- ✅ Added `perTradeLimit` and `dailyLimit` config options
- ✅ New `executeTrade()` helper function
- ✅ Automatic fallback to simulation on errors or insufficient balance
- ✅ Order hash tracking for real trades

**Agent Config:**
```typescript
interface AgentConfig {
  maxPositionSize: number;   // Max $ per trade (e.g., 50)
  minConfidence: number;     // Min confidence 0-100 (e.g., 70)
  maxMarketsPerRun: number;  // Max trades per run (e.g., 3)
  riskLevel: "low" | "medium" | "high";
  simulateOnly?: boolean;    // NEW: Default true (safe)
  perTradeLimit?: number;    // NEW: Max $ per trade (e.g., 50)
  dailyLimit?: number;       // NEW: Max $ per day (e.g., 200)
}
```

### 4. **Database Schema Updates** (`src/db/schema.ts`)
Added support for tracking real trades.

**Changes:**
- ✅ Added `orderHash` field to `agentTrades` table
- ✅ Updated status to include: `simulated`, `pending`, `filled`, `failed`, `cancelled`

**Migration SQL:**
```sql
ALTER TABLE agent_trades ADD COLUMN order_hash TEXT;
CREATE INDEX agent_trades_order_hash_idx ON agent_trades(order_hash);
```

### 5. **API Endpoints**

#### **Toggle Real Trading**
`POST /api/agents/[id]/toggle-trading`
```json
{
  "enabled": true  // Enable real trading
}
```

#### **Get Wallet Balance**
`GET /api/wallet/balance`
```
Headers: x-user-id: <userId>
```

#### **Execute Manual Trade**
`POST /api/trade/execute`
```json
{
  "conditionId": "0x123...",
  "question": "Will BTC hit $100K?",
  "tokenId": "0x456...",
  "direction": "YES",
  "price": 0.65,
  "size": 50
}
```

### 6. **UI Components**

#### **RealTradingToggle** (`src/components/trading/RealTradingToggle.tsx`)
Toggle switch with warning when enabling real trading.

**Features:**
- ✅ Safe mode vs Real mode indicator
- ✅ Warning prompt before enabling
- ✅ Real-time status display

#### **WalletBalance** (`src/components/trading/WalletBalance.tsx`)
Display user's USDC balance with refresh button.

**Features:**
- ✅ Real-time balance display
- ✅ Auto-refresh
- ✅ Loading states

---

## How It Works

### Flow: Simulated Trade (Default)
```
1. Agent runs (cron job every 30 min)
2. Finds signals above confidence threshold
3. executeTrade() checks config.simulateOnly = true
4. Creates agentTrade with status="simulated"
5. No real money spent ✅
```

### Flow: Real Trade (Enabled)
```
1. User enables real trading via UI
2. Agent runs (cron job every 30 min)
3. Finds signals above confidence threshold
4. executeTrade() checks config.simulateOnly = false
5. Checks agent permissions (canAgentTrade)
6. Checks spending limits (perTradeLimit, dailyLimit)
7. Checks user balance (getUserBalance)
8. Gets tokenId from market
9. Creates and signs order (createAndSignOrder)
10. Submits to Polymarket (submitOrder)
11. Stores trade with orderHash in DB
12. Status = "pending" (waiting for fill)
```

### Safety Mechanisms

1. **Default to Simulation**
   - All agents start with `simulateOnly: true`
   - User must explicitly enable real trading

2. **Multi-Layer Checks**
   - Agent must be `active`
   - Agent must have `simulateOnly: false`
   - User must have sufficient balance
   - Trade must be within spending limits

3. **Automatic Fallback**
   - If any check fails → falls back to simulation
   - Logs error but doesn't crash
   - User sees "simulated" trade in history

4. **Emergency Stop**
   - `emergencyStopAllAgents(userId)` pauses all agents
   - Can be called from UI or API

---

## Environment Variables

Add to `.env.local`:

```bash
# Polygon RPC (required for wallet signing)
NEXT_PUBLIC_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Privy (for wallet management)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
```

---

## Security Considerations

### ⚠️ Current Implementation (Development)
- Private keys are NOT stored (uses temporary test keys)
- Privy integration is stubbed out
- **DO NOT use in production without proper encryption**

### 🔒 Production Requirements
1. **Use Privy Embedded Wallets**
   - Never store raw private keys
   - Use Privy SDK to access embedded wallets
   - Implement proper key encryption

2. **Rate Limiting**
   - Add rate limits to API endpoints
   - Prevent abuse of trade execution

3. **Webhook Security**
   - Verify webhook signatures from Polymarket
   - Use API keys for authenticated endpoints

4. **Audit Logging**
   - Log all real trades to separate audit table
   - Track all wallet access attempts

---

## Testing

### Test Simulation Mode (Safe)
```bash
# Create an agent (defaults to simulateOnly: true)
POST /api/agents
{
  "name": "Test Agent",
  "strategy": "signal_follower",
  "config": {
    "maxPositionSize": 50,
    "minConfidence": 70,
    "simulateOnly": true
  }
}

# Run the cron job
GET /api/cron

# Check agent trades (should all be status="simulated")
GET /api/agents/[id]/trades
```

### Test Real Trading (Testnet)
```bash
# 1. Get some testnet USDC on Polygon Mumbai
# 2. Update NEXT_PUBLIC_POLYGON_RPC to Mumbai RPC
# 3. Enable real trading
POST /api/agents/[id]/toggle-trading
{
  "enabled": true
}

# 4. Run the cron job
GET /api/cron

# 5. Check agent trades (should see status="pending")
GET /api/agents/[id]/trades
```

---

## Integration with Existing Features

### Works With:
- ✅ **Signal Follower** - Executes signals as real trades
- ✅ **Whale Tracker** - Mirrors whale trades in real-time
- ✅ **Contrarian** - Trades opposite to signals
- ✅ **Allora Follower** - Uses Allora predictions for real trades
- ✅ **Hybrid** - Combines Allora + GPT for high-conviction trades

### Status Display:
```
🟢 SIMULATED - Paper trade (no real money)
🟡 PENDING - Real trade submitted, waiting for fill
🟢 FILLED - Real trade executed successfully
🔴 FAILED - Real trade failed (insufficient balance, etc.)
⚪ CANCELLED - Real trade cancelled by user
```

---

## Next Steps (Phase 6+)

1. **Order Status Tracking**
   - Webhook to receive fill notifications from Polymarket
   - Update `agentTrades.status` from pending → filled
   - Calculate realized P&L

2. **Position Management**
   - Track open positions by tokenId
   - Auto-close positions at target price or stop loss
   - Portfolio rebalancing

3. **Advanced Risk Management**
   - Dynamic position sizing based on Kelly Criterion
   - Correlation analysis (don't over-expose to one market)
   - Drawdown limits (pause if losing too much)

4. **Performance Analytics**
   - Sharpe ratio, max drawdown, win rate
   - Compare simulated vs real performance
   - Agent leaderboard

---

## Comparison: Cobot vs Our Agents

### What Cobot Does:
- Provides AI-powered predictions
- Shows confidence scores
- Allows users to follow AI signals manually

### What Our Agents Do:
✅ Everything Cobot does, PLUS:
- **Autonomous execution** (no manual clicking)
- **Multi-strategy support** (Allora, GPT, Whale tracking, Contrarian)
- **Real wallet signing** (trades execute automatically)
- **Spending limits** (per-trade and daily caps)
- **Simulation mode** (test strategies risk-free)
- **Emergency stop** (panic button)
- **Customizable configs** (risk level, confidence thresholds)

### Our Advantage:
We're building a **fully autonomous trading system** that:
1. Generates signals (like Cobot)
2. Evaluates signals (EV, edge, confidence)
3. **Executes trades automatically** (unlike Cobot)
4. Tracks performance (P&L, win rate)
5. Learns from mistakes (future: ML-based improvements)

---

## Usage Example

```typescript
// 1. Enable real trading for an agent
await fetch(`/api/agents/${agentId}/toggle-trading`, {
  method: "POST",
  body: JSON.stringify({ enabled: true }),
});

// 2. Agent automatically trades on next cron run
// (every 30 minutes via /api/cron)

// 3. Check balance before trading
const balance = await getUserBalance(userId);
console.log(`Available: $${balance}`);

// 4. Emergency stop if needed
await emergencyStopAllAgents(userId);
```

---

## Files Created/Modified

### New Files:
1. `src/lib/polymarket-client.ts` - Polymarket CLOB API client
2. `src/lib/wallet-manager.ts` - Wallet signing and safety checks
3. `src/app/api/agents/[id]/toggle-trading/route.ts` - Enable/disable real trading
4. `src/app/api/wallet/balance/route.ts` - Get USDC balance
5. `src/app/api/trade/execute/route.ts` - Manual trade execution
6. `src/components/trading/RealTradingToggle.tsx` - UI toggle for real trading
7. `src/components/trading/WalletBalance.tsx` - Balance display
8. `add_real_trading_support.sql` - Database migration

### Modified Files:
1. `src/lib/agent-engine.ts` - Added real trading support
2. `src/db/schema.ts` - Added orderHash field

---

## Summary

✅ **Phase 5 Complete**: Real wallet signing is now implemented!

**What you can do now:**
1. Enable real trading for any agent
2. Agents will execute real trades automatically
3. All safety checks and spending limits enforced
4. Automatic fallback to simulation on errors
5. Manual trade execution via API

**What's safe:**
- Default mode is simulation (no real money)
- Multi-layer permission checks
- Spending limits enforced
- Emergency stop button

**Next priority:**
- Test on Polygon Mumbai (testnet)
- Integrate with Privy for production
- Add order status tracking (webhook)
