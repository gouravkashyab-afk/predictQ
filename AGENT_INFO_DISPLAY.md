# Agent Information Display (Like Cobot)

## Overview

This document explains how our agents provide trading information similar to Cobot's platform, but with additional autonomous execution capabilities.

---

## What Cobot Provides

Cobot's platform shows:
1. **AI Predictions** - YES/NO with confidence
2. **Confidence Score** - 0-100%
3. **Reasoning** - Why the AI made this prediction
4. **Market Data** - Current prices, volume
5. **Expected Value (EV)** - Potential profit
6. **Manual Trade Button** - User clicks to execute

---

## What Our Agents Provide

### 1. **Signal Generation** (Like Cobot's Predictions)

Our agents generate signals with all the information Cobot provides:

```typescript
{
  id: "sig-123",
  conditionId: "0x123...",
  question: "Will BTC hit $100K by Dec 2024?",
  direction: "YES",              // ← Prediction
  confidence: 85,                // ← 0-100% confidence
  reasoning: "Strong upward momentum...", // ← AI explanation
  
  // Market data (like Cobot)
  yesPrice: 0.65,
  noPrice: 0.35,
  volume: 1250000,
  
  // Enhanced metrics (beyond Cobot)
  metadata: {
    expectedValue: 12.5,         // ← EV% (like Cobot)
    edgePercentage: 8.2,         // ← Edge vs market
    kellyFraction: 0.15,         // ← Optimal bet size
    sentiment: "bullish",        // ← Market sentiment
    technicalSignal: "BUY",      // ← TA indicator
    priceTarget: 0.75,           // ← Predicted price
    riskLevel: "medium"          // ← Risk assessment
  },
  
  source: "gpt4o",              // ← Which AI (gpt4o|allora|hybrid)
  model: "gpt-4o",
  createdAt: "2024-01-15T10:30:00Z"
}
```

### 2. **Agent Decision Display**

When an agent evaluates a signal, it logs its decision (like Cobot's reasoning):

```typescript
// Agent log entry
{
  level: "info",
  message: "Signal: YES on 'Will BTC hit $100K?'",
  metadata: {
    confidence: 85,
    amount: 42.50,              // ← Position size
    ev: 12.5,                   // ← Expected value
    edge: 8.2,                  // ← Market edge
    conditionId: "0x123...",
    strategy: "signal_follower" // ← Which agent strategy
  }
}
```

### 3. **Trade Information Display**

After executing a trade, agents store comprehensive data:

```typescript
{
  id: "trade-456",
  agentId: "agent-789",
  conditionId: "0x123...",
  question: "Will BTC hit $100K?",
  direction: "YES",
  amountUsdc: 42.50,
  confidence: 85,
  
  // Additional info (beyond Cobot)
  signalId: "sig-123",         // ← Link to original signal
  status: "pending",           // ← pending|filled|simulated
  orderHash: "0xabc...",       // ← Polymarket order ID
  
  createdAt: "2024-01-15T10:35:00Z"
}
```

---

## UI Display Components

### Component 1: Signal Card (Like Cobot's Prediction Card)

```tsx
function SignalCard({ signal }: { signal: Signal }) {
  const metadata = signal.metadata as any;
  
  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Question */}
      <h3 className="font-semibold text-lg">{signal.question}</h3>
      
      {/* Prediction (like Cobot) */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`px-3 py-1 rounded-full font-bold ${
          signal.direction === "YES" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {signal.direction}
        </span>
        <span className="text-2xl font-bold">{signal.confidence}%</span>
        <span className="text-sm text-muted-foreground">confidence</span>
      </div>
      
      {/* Reasoning (like Cobot) */}
      <p className="mt-3 text-sm text-muted-foreground">
        {signal.reasoning}
      </p>
      
      {/* Market Data */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div>
          <p className="text-muted-foreground">YES Price</p>
          <p className="font-semibold">${(signal.yesPrice * 100).toFixed(0)}¢</p>
        </div>
        <div>
          <p className="text-muted-foreground">NO Price</p>
          <p className="font-semibold">${(signal.noPrice * 100).toFixed(0)}¢</p>
        </div>
        <div>
          <p className="text-muted-foreground">Volume</p>
          <p className="font-semibold">${(signal.volume / 1000).toFixed(0)}K</p>
        </div>
      </div>
      
      {/* Enhanced Metrics (beyond Cobot) */}
      {metadata?.expectedValue && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-muted-foreground text-xs">Expected Value</p>
            <p className="font-bold text-green-600">+{metadata.expectedValue.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Market Edge</p>
            <p className="font-bold text-blue-600">{metadata.edgePercentage.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Risk Level</p>
            <p className="font-semibold capitalize">{metadata.riskLevel || "medium"}</p>
          </div>
        </div>
      )}
      
      {/* AI Source Badge */}
      <div className="mt-4 flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
          {signal.source === "allora" ? "🔮 Allora Network" : 
           signal.source === "hybrid" ? "🤖 Hybrid AI" : 
           "🧠 GPT-4o"}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(signal.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
```

### Component 2: Agent Trade Card (Shows Execution)

```tsx
function AgentTradeCard({ trade }: { trade: AgentTrade }) {
  const statusColors = {
    simulated: "bg-gray-500",
    pending: "bg-yellow-500",
    filled: "bg-green-500",
    failed: "bg-red-500",
    cancelled: "bg-gray-400"
  };
  
  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Trade Status */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{trade.question}</h3>
        <span className={`px-2 py-1 rounded text-white text-xs ${statusColors[trade.status]}`}>
          {trade.status.toUpperCase()}
        </span>
      </div>
      
      {/* Direction & Confidence (like Cobot) */}
      <div className="flex items-center gap-3 mt-2">
        <span className={`px-3 py-1 rounded-full font-bold ${
          trade.direction === "YES" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {trade.direction}
        </span>
        <span className="text-xl font-bold">{trade.confidence}%</span>
        <span className="text-sm text-muted-foreground">confident</span>
      </div>
      
      {/* Trade Amount */}
      <div className="mt-4 p-3 rounded bg-blue-50 dark:bg-blue-950">
        <p className="text-sm text-muted-foreground">Amount</p>
        <p className="text-2xl font-bold text-blue-600">${trade.amountUsdc.toFixed(2)}</p>
      </div>
      
      {/* Real Trade Indicator */}
      {trade.orderHash && (
        <div className="mt-4 p-3 rounded bg-green-50 dark:bg-green-950 border border-green-200">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            ✅ Real Trade Executed
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
            Order: {trade.orderHash.slice(0, 8)}...{trade.orderHash.slice(-6)}
          </p>
        </div>
      )}
      
      {/* Simulation Indicator */}
      {trade.status === "simulated" && (
        <div className="mt-4 p-3 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🧪 Simulated Trade (Paper Trading)
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            No real money was spent
          </p>
        </div>
      )}
      
      {/* Timestamp */}
      <p className="text-xs text-muted-foreground mt-4">
        {new Date(trade.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
```

### Component 3: Agent Dashboard (Overview)

```tsx
function AgentDashboard({ agent, recentTrades }: { agent: Agent, recentTrades: AgentTrade[] }) {
  const config = agent.config as AgentConfig;
  
  return (
    <div className="space-y-6">
      {/* Agent Info Header */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{agent.name}</h2>
            <p className="text-muted-foreground capitalize">{agent.strategy.replace("_", " ")}</p>
          </div>
          <span className={`px-3 py-1 rounded-full font-semibold ${
            agent.status === "active" ? "bg-green-500 text-white" :
            agent.status === "paused" ? "bg-yellow-500 text-white" :
            "bg-gray-500 text-white"
          }`}>
            {agent.status.toUpperCase()}
          </span>
        </div>
        
        {/* Stats (like Cobot's performance) */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{agent.totalTrades}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={`text-2xl font-bold ${
              agent.totalPnl >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {agent.totalPnl >= 0 ? "+" : ""}${agent.totalPnl.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Position</p>
            <p className="text-2xl font-bold">${config.maxPositionSize}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min Confidence</p>
            <p className="text-2xl font-bold">{config.minConfidence}%</p>
          </div>
        </div>
        
        {/* Real Trading Status */}
        <div className="mt-6 pt-6 border-t">
          <RealTradingToggle
            agentId={agent.id}
            agentName={agent.name}
            isEnabled={!config.simulateOnly}
          />
        </div>
      </div>
      
      {/* Recent Trades */}
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Trades</h3>
        <div className="space-y-4">
          {recentTrades.map(trade => (
            <AgentTradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## API Endpoints for UI

### Get Agent with Trades
```typescript
// GET /api/agents/[id]?includeTrades=true
{
  agent: {
    id: "agent-123",
    name: "BTC Signal Follower",
    strategy: "signal_follower",
    status: "active",
    config: {
      maxPositionSize: 50,
      minConfidence: 75,
      simulateOnly: false  // Real trading enabled
    },
    totalTrades: 42,
    totalPnl: 125.50,
    lastRunAt: "2024-01-15T10:30:00Z"
  },
  trades: [
    {
      id: "trade-1",
      question: "Will BTC hit $100K?",
      direction: "YES",
      amountUsdc: 45.00,
      confidence: 85,
      status: "pending",
      orderHash: "0xabc...",
      createdAt: "2024-01-15T10:35:00Z"
    }
    // ... more trades
  ]
}
```

### Get Agent Logs (Reasoning)
```typescript
// GET /api/agents/[id]/logs
{
  logs: [
    {
      level: "info",
      message: "Running signal_follower strategy",
      metadata: { config: {...} },
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      level: "info",
      message: "Found 5 signals to evaluate",
      metadata: { sources: { gpt4o: 3, allora: 2 } },
      createdAt: "2024-01-15T10:30:05Z"
    },
    {
      level: "info",
      message: "Signal: YES on 'Will BTC hit $100K?'",
      metadata: {
        confidence: 85,
        amount: 45.00,
        ev: 12.5,
        edge: 8.2
      },
      createdAt: "2024-01-15T10:30:10Z"
    },
    {
      level: "info",
      message: "✅ REAL TRADE executed: YES",
      metadata: {
        amount: 45.00,
        orderHash: "0xabc...",
        question: "Will BTC hit $100K?"
      },
      createdAt: "2024-01-15T10:35:15Z"
    }
  ]
}
```

---

## Key Differences: Our System vs Cobot

| Feature | Cobot | Our Agents |
|---------|-------|------------|
| **Display AI Predictions** | ✅ YES | ✅ YES |
| **Show Confidence** | ✅ YES | ✅ YES |
| **Explain Reasoning** | ✅ YES | ✅ YES |
| **Show EV/Edge** | ✅ YES | ✅ YES (plus more metrics) |
| **Manual Trade Button** | ✅ YES | ✅ YES (plus auto-execute) |
| **Autonomous Execution** | ❌ NO | ✅ YES |
| **Multiple Strategies** | ❌ NO | ✅ YES (5 strategies) |
| **Real Trading Mode** | ❌ NO | ✅ YES |
| **Simulation Mode** | ❌ NO | ✅ YES |
| **Spending Limits** | ❌ NO | ✅ YES |
| **Trade History** | ❌ NO | ✅ YES |
| **Performance Tracking** | ❌ NO | ✅ YES |
| **Agent Logs** | ❌ NO | ✅ YES |

---

## Summary

**Cobot provides:** AI predictions with reasoning that users can manually execute.

**Our agents provide:** Everything Cobot does PLUS:
1. ✅ Autonomous execution (no clicking required)
2. ✅ Multiple AI strategies (GPT-4o, Allora, Hybrid, Whale tracking, Contrarian)
3. ✅ Real wallet signing (actual trades on Polymarket)
4. ✅ Simulation mode (test risk-free)
5. ✅ Spending limits (safety controls)
6. ✅ Trade history (all decisions tracked)
7. ✅ Performance metrics (P&L, win rate)
8. ✅ Agent logs (full reasoning trail)

**Our UI shows the same information as Cobot, but with:**
- Real-time trade execution status
- Order hash tracking
- Simulation vs Real mode indicators
- Agent logs with detailed reasoning
- Performance analytics
- Emergency controls

---

## Next Steps

1. **Implement UI pages:**
   - `/agents` - List all agents
   - `/agents/[id]` - Agent dashboard with trades
   - `/signals` - Recent AI predictions (like Cobot)
   - `/trades` - Trade history

2. **Add real-time updates:**
   - WebSocket for live trade updates
   - Order status changes
   - New signal notifications

3. **Performance analytics:**
   - Win rate charts
   - P&L over time
   - Strategy comparison

---

That's how our agents provide information just like Cobot does, but with the added benefit of autonomous execution and comprehensive safety features! 🚀
