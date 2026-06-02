# Agent Decision-Making Source: Complete Flow

## 🧠 Where Do Agent Decisions Come From?

Agents make decisions based on **3 primary data sources**:

1. **AI Signals** (GPT-4o analysis)
2. **Whale Events** (Large wallet movements)
3. **Market Data** (Prices, volume, technical indicators)

---

## 📊 Complete Decision Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐    ┌──────────────┐
│  POLYMARKET   │    │   WHALE EVENTS  │    │  NEWS/SOCIAL │
│   Markets     │    │   (Blockchain)  │    │   Sentiment  │
└───────┬───────┘    └────────┬────────┘    └──────┬───────┘
        │                     │                     │
        │  Top 10 markets     │  Transactions       │  Headlines
        │  by volume          │  > $100K           │  & keywords
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   GPT-4o MODEL   │
                    │  (AI Analysis)   │
                    └─────────┬────────┘
                              │
                              │ Generates
                              ▼
                    ┌──────────────────┐
                    │   AI SIGNALS     │
                    │   (Database)     │
                    └─────────┬────────┘
                              │
                              │ Stored signals:
                              │ - Direction (YES/NO)
                              │ - Confidence (0-100)
                              │ - EV & Edge
                              │ - Reasoning
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌───────────────┐          ┌──────────────┐
        │ AGENT ENGINE  │          │ WHALE TRACKER│
        │ (Every 30min) │          │   (Live)     │
        └───────┬───────┘          └──────┬───────┘
                │                         │
                │ Reads signals           │ Reads events
                │ Applies filters         │ Checks size
                │                         │
                ▼                         ▼
        ┌───────────────────────────────────────┐
        │        AGENT STRATEGIES               │
        │                                       │
        │  1. Signal Follower → Follows AI     │
        │  2. Whale Tracker → Copies whales    │
        │  3. Contrarian → Opposite of AI      │
        └───────────────┬───────────────────────┘
                        │
                        │ Decision criteria:
                        │ - EV > 0
                        │ - Confidence > threshold
                        │ - Edge > 5%
                        │
                        ▼
                ┌────────────────┐
                │  TRADE DECISION│
                │  (Place order) │
                └────────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │  DATABASE       │
                │  agent_trades   │
                └─────────────────┘
```

---

## 🔍 Detailed Breakdown by Strategy

### Strategy 1: Signal Follower 🤖

**Data Source**: AI-generated signals

**Flow**:
```
1. Polymarket → Fetch top 10 markets by volume
   ↓
2. GPT-4o → Analyze markets:
   - Question text
   - Current prices (YES/NO)
   - Volume & liquidity
   - Category (Politics, Sports, etc.)
   - Historical patterns
   ↓
3. GPT-4o outputs:
   - Direction: YES or NO
   - Confidence: 55-95%
   - Reasoning: Why this trade makes sense
   - AI Probability: 0-1 (AI's estimated outcome probability)
   ↓
4. Our System calculates:
   - Expected Value (EV) = (AI_Prob × Win) - ((1-AI_Prob) × Loss)
   - Edge = |AI_Prob - Market_Prob|
   - Sentiment = Bullish/Bearish/Neutral
   - Technical Signal = Strong_Buy/Buy/Neutral/Sell
   ↓
5. Signal stored in database
   ↓
6. Agent reads signals (every 30 min)
   ↓
7. Agent filters:
   ✅ Confidence > config.minConfidence (default: 70%)
   ✅ EV > 0 (positive expected value)
   ✅ Created in last 2 hours (fresh signals only)
   ↓
8. Agent calculates position size:
   Base = config.maxPositionSize ($50)
   EV Multiplier = min(1.5, EV / 10)
   Edge Multiplier = min(1.2, Edge / 15)
   Final = Base × EV_Mult × Edge_Mult × (Confidence / 100)
   ↓
9. Agent places trade (currently simulated)
```

**Example**:
```
Market: "Will Trump win 2024?"
YES: 65¢, NO: 35¢

GPT-4o Analysis:
"Recent polls show Trump leading swing states. 
Market may be underpricing his chances."

Output:
- Direction: YES
- Confidence: 78%
- AI Probability: 75%
- Market Implied: 65%

Calculations:
- EV = (0.75 × 35¢) - (0.25 × 65¢) = 26.25¢ - 16.25¢ = +10¢
- EV% = (10¢ / 65¢) × 100 = +15.4%
- Edge = |0.75 - 0.65| × 100 = 10%

Agent Decision:
✅ TRADE (positive EV, good edge, high confidence)
Position = $50 × 1.54 (EV mult) × 1.2 (edge mult) × 0.78 = $72
```

---

### Strategy 2: Whale Tracker 🐋

**Data Source**: Blockchain whale events

**Flow**:
```
1. Monitor Polymarket smart contracts (Polygon blockchain)
   ↓
2. Detect large transactions:
   - Size > $100,000
   - Recent (last 1 hour)
   ↓
3. Parse transaction:
   - Wallet address
   - Amount (USD)
   - Direction (IN = buying, OUT = selling)
   - Token (YES or NO)
   ↓
4. Store in whale_events table
   ↓
5. Agent reads whale events (every 30 min)
   ↓
6. Agent mirrors whale:
   - If whale buys YES ($200K) → Agent buys YES ($50)
   - If whale sells YES → Agent buys NO ($50)
   ↓
7. Agent places trade
```

**Rationale**: 
- Whales often have insider info or superior analysis
- Large trades indicate high conviction
- Copy-trading proven successful strategy

**Example**:
```
Whale Event:
- Wallet: 0x1234...abcd (known smart money)
- Market: "Will Fed cut rates?"
- Action: Buy YES
- Amount: $250,000
- Timestamp: 10 minutes ago

Agent Decision:
✅ TRADE (mirror whale)
Direction: YES
Position: $50 (agent's configured max)
Reasoning: "Large whale ($250K) betting YES with conviction"
```

---

### Strategy 3: Contrarian 🔄

**Data Source**: AI signals (but trades OPPOSITE)

**Flow**:
```
1. Read AI signals (same as Signal Follower)
   ↓
2. Agent inverts the direction:
   - If AI says YES → Agent buys NO
   - If AI says NO → Agent buys YES
   ↓
3. Inverse confidence:
   - If AI confidence = 80% → Agent confidence = 20%
   ↓
4. Agent places contrarian trade
```

**Rationale**:
- Markets can be irrational
- Crowded trades (high AI confidence) = potential overpricing
- Mean reversion strategy
- Works well in sideways/uncertain markets

**Example**:
```
AI Signal:
- Direction: YES
- Confidence: 85%
- Market: "Team A will win championship"
- Reasoning: "Team A heavily favored by all models"

Contrarian Agent:
✅ TRADE OPPOSITE
Direction: NO
Position: $30 (reduced for contrarian)
Reasoning: "High confidence indicates crowded trade. 
           Market may have overpriced YES. 
           NO offers value."
```

---

## 🎯 Decision Criteria Summary

### Signal Follower:
| Criteria | Threshold | Purpose |
|----------|-----------|---------|
| **Confidence** | >70% | Only trade high-confidence signals |
| **EV** | >0% | Only positive expected value |
| **Edge** | >5% | Need meaningful difference from market |
| **Freshness** | <2 hours | Recent signals only |
| **Position Size** | $10-$75 | Scales with EV and edge |

### Whale Tracker:
| Criteria | Threshold | Purpose |
|----------|-----------|---------|
| **Transaction Size** | >$100K | Only follow large whales |
| **Recency** | <1 hour | Recent moves only |
| **Direction** | IN or OUT | Copy whale's direction |
| **Position Size** | Fixed $50 | Conservative copy |

### Contrarian:
| Criteria | Threshold | Purpose |
|----------|-----------|---------|
| **Confidence** | >70% | Only fade high-confidence signals |
| **Direction** | Opposite | Bet against AI |
| **Position Size** | Fixed $30 | Conservative (risky strategy) |

---

## 📝 What Data AI Analyzes

When GPT-4o generates signals, it receives:

### Input Data:
```typescript
{
  question: "Will Trump win 2024 election?",
  category: "Politics",
  yesPrice: 0.65,  // 65¢
  noPrice: 0.35,   // 35¢
  volume: 5_234_567, // $5.2M
}
```

### AI Considers:
1. **Question Text**
   - Keywords (Trump, election, 2024)
   - Event type (political, sports, crypto)
   - Time frame (days, weeks, months)

2. **Current Prices**
   - YES: 65¢ (market thinks 65% chance)
   - NO: 35¢ (market thinks 35% chance)
   - Is market mispriced?

3. **Volume**
   - High volume = liquid market
   - Low volume = risky, wide spreads

4. **Category Fundamentals**
   - Politics: polls, news, historical patterns
   - Sports: team stats, injuries, momentum
   - Crypto: on-chain data, sentiment
   - Finance: macro indicators, Fed signals

5. **Market Efficiency**
   - Is this market rational?
   - Any behavioral biases?
   - Contrarian opportunity?

### AI Output:
```json
{
  "direction": "YES",
  "confidence": 78,
  "reasoning": "Recent polls show Trump leading in swing states. 
                Market at 65¢ appears undervalued given 
                current momentum and historical patterns.",
  "aiProbability": 0.75
}
```

---

## 🔄 When Decisions Are Made

### Signal Generation:
- **Frequency**: On-demand (when user visits /app/signals or cron runs)
- **Trigger**: API call to `/api/signals`
- **Cost**: ~$0.01 per GPT-4o call (10 markets analyzed)

### Agent Execution:
- **Frequency**: Every 30 minutes
- **Trigger**: Cron job hits `/api/cron`
- **Process**:
  1. Fetch active agents
  2. Run each agent's strategy
  3. Place trades (currently simulated)
  4. Log activity

---

## 🎓 Key Insights

### 1. **Agents Don't Think - They Execute**
- Agents don't do real-time analysis
- They **follow pre-generated signals**
- Signals come from GPT-4o (the "brain")

### 2. **GPT-4o Is The Intelligence**
- Analyzes market fundamentals
- Generates trade signals
- Calculates probabilities
- Provides reasoning

### 3. **Agents Add Strategy**
- **Signal Follower**: Trust AI
- **Whale Tracker**: Trust smart money
- **Contrarian**: Fade the crowd

### 4. **Position Sizing Is Smart**
- Not fixed amounts
- Scales with edge and EV
- Risk-adjusted

---

## 🚀 Future Enhancements (Phase 2+)

### Multi-Agent Collaboration:
```
Current:
GPT-4o → Signal → Agent → Trade

Future:
Sentiment Agent → Vote
Technical Agent → Vote
Whale Agent → Vote
Research Agent → Vote
    ↓
Orchestrator → Aggregate → Consensus → Trade
```

### Real-Time Monitoring:
```
Current: 30-minute cron

Future: WebSocket + Event-driven
- Price change >5% → Instant analysis
- Whale move detected → Instant copy
- News alert → Instant GPT analysis
```

---

## ✅ Summary

**Agent decisions come from**:
1. 🤖 **GPT-4o analysis** (primary intelligence)
2. 🐋 **Whale blockchain data** (smart money signals)
3. 📊 **Market prices & volume** (technical indicators)
4. 🧮 **Math calculations** (EV, edge, position sizing)

**The flow**:
```
Real Data → AI Analysis → Signals → Agent Strategy → Trade Decision
```

**Current limitation**:
- Agents execute **simulated trades** (not real)
- Need Phase 5 (Wallet Integration) for real trading

**Next upgrade (Phase 2)**:
- Multiple specialized agents debate
- Consensus-based decision making
- More sophisticated than single AI call
