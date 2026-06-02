# Allora Network Integration Plan
## Building Cobot-Style Prediction Agents

---

## 🎯 Goal

Integrate **Allora Network** (Model Coordination Network) into PredictIQ to replicate Cobot's exact architecture:
- Consume predictions from hundreds of decentralized ML models
- Use weighted aggregation based on model accuracy
- Get context-aware inferences for prediction markets
- Build truly intelligent, self-improving agents

---

## 🏗️ Architecture Overview

### Current System:
```
Polymarket Data → GPT-4o → Signal → Agent → Trade
```

### New System (Allora-Powered):
```
┌─────────────────────────────────────────────┐
│        ALLORA NETWORK (Mainnet)             │
│   Hundreds of ML Models (Workers)           │
│   - Model A: 78% accuracy (high weight)     │
│   - Model B: 65% accuracy (medium weight)   │
│   - Model C: 52% accuracy (low weight)      │
│   - ... (100+ models competing)             │
└──────────────┬──────────────────────────────┘
               │ Weighted Aggregation
               ▼
┌──────────────────────────────────────────────┐
│     ALLORA API (Inferences by Topic)         │
│  - BTC 5min price prediction                 │
│  - ETH 24h price prediction                  │
│  - Custom prediction market topics           │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│         OUR INTEGRATION LAYER                │
│  1. Fetch Allora inferences                  │
│  2. Map to Polymarket questions              │
│  3. Calculate EV and edge                    │
│  4. Generate signals                         │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│         AGENT ENGINE                         │
│  - Signal Follower (uses Allora data)        │
│  - Whale Tracker (blockchain)                │
│  - Hybrid Strategy (Allora + GPT-4o)         │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│         TRADE EXECUTION                      │
└──────────────────────────────────────────────┘
```

---

## 📦 What We'll Build

### Phase 1: Allora SDK Integration (Week 1)
**Goal**: Connect to Allora Network and fetch inferences

**Tasks**:
1. Install Allora TypeScript SDK
2. Create Allora client wrapper
3. Fetch available topics
4. Fetch inferences for crypto price predictions
5. Store Allora inferences in database

### Phase 2: Custom Topic Creation (Week 2)
**Goal**: Create Allora topics for Polymarket questions

**Tasks**:
1. Set up Allora wallet and fund with ALLO tokens
2. Create topics for top Polymarket categories:
   - Politics (e.g., "Trump wins 2024?")
   - Sports (e.g., "Lakers win championship?")
   - Finance (e.g., "Fed rate cut by end of Q2?")
3. Deploy workers (ML models) for custom topics
4. Track topic performance

### Phase 3: Signal Generation with Allora (Week 3)
**Goal**: Replace GPT-4o with Allora for signal generation

**Tasks**:
1. Map Polymarket questions to Allora topics
2. Fetch Allora network inferences
3. Calculate confidence intervals
4. Compute EV and edge from Allora probabilities
5. Generate signals using Allora data

### Phase 4: Hybrid Intelligence (Week 4)
**Goal**: Combine Allora Network + GPT-4o for best results

**Tasks**:
1. Allora for quantitative analysis (price predictions, probabilities)
2. GPT-4o for qualitative analysis (sentiment, news, reasoning)
3. Weighted aggregation: 70% Allora + 30% GPT-4o
4. Consensus mechanism for final decision

### Phase 5: Real-Time Monitoring (Week 5)
**Goal**: Continuous inference consumption

**Tasks**:
1. WebSocket connection to Allora (if available)
2. Poll Allora API every 5 minutes
3. Update signals in real-time
4. Event-driven agent execution

### Phase 6: Performance Tracking (Week 6)
**Goal**: Track model accuracy and adjust weights

**Tasks**:
1. Store Allora predictions vs actual outcomes
2. Calculate accuracy per topic
3. Adjust agent confidence based on historical performance
4. Dashboard showing Allora vs GPT-4o performance

---

## 🔧 Technical Implementation

### 1. Install Allora SDK

```bash
npm install @alloralabs/allora-sdk
```

### 2. Create Allora Client (`src/lib/allora-client.ts`)

```typescript
import { AlloraAPIClient, ChainSlug, PriceInferenceToken, PriceInferenceTimeframe } from '@alloralabs/allora-sdk/v2';

// Initialize Allora client
const alloraClient = new AlloraAPIClient({
  chainSlug: ChainSlug.MAINNET, // Use mainnet for production
  apiKey: process.env.ALLORA_API_KEY, // Optional but recommended
});

// Fetch BTC price inference (8-hour timeframe)
export async function getBTCPricePrediction() {
  try {
    const inference = await alloraClient.getPriceInference(
      PriceInferenceToken.BTC,
      PriceInferenceTimeframe.EIGHT_HOURS
    );
    
    return {
      price: parseFloat(inference.inference_data.network_inference),
      confidence: calculateConfidenceFromInterval(
        inference.inference_data.confidence_interval_values
      ),
      timestamp: inference.inference_data.timestamp,
      topicId: inference.inference_data.topic_id,
    };
  } catch (error) {
    console.error('Error fetching BTC prediction from Allora:', error);
    throw error;
  }
}

// Fetch ETH price inference (5-minute timeframe)
export async function getETHPricePrediction() {
  try {
    const inference = await alloraClient.getPriceInference(
      PriceInferenceToken.ETH,
      PriceInferenceTimeframe.FIVE_MIN
    );
    
    return {
      price: parseFloat(inference.inference_data.network_inference),
      confidence: calculateConfidenceFromInterval(
        inference.inference_data.confidence_interval_values
      ),
      timestamp: inference.inference_data.timestamp,
      topicId: inference.inference_data.topic_id,
    };
  } catch (error) {
    console.error('Error fetching ETH prediction from Allora:', error);
    throw error;
  }
}

// Fetch all available topics
export async function getAllAlloraTopics() {
  try {
    const topics = await alloraClient.getAllTopics();
    return topics.filter(topic => topic.is_active);
  } catch (error) {
    console.error('Error fetching Allora topics:', error);
    throw error;
  }
}

// Fetch inference by custom topic ID
export async function getInferenceByTopic(topicId: number) {
  try {
    const inference = await alloraClient.getInferenceByTopicID(topicId);
    
    return {
      networkInference: parseFloat(inference.inference_data.network_inference),
      confidenceInterval: inference.inference_data.confidence_interval_values.map(v => parseFloat(v)),
      timestamp: inference.inference_data.timestamp,
      topicId: inference.inference_data.topic_id,
    };
  } catch (error) {
    console.error(`Error fetching inference for topic ${topicId}:`, error);
    throw error;
  }
}

// Calculate confidence score from confidence interval
function calculateConfidenceFromInterval(intervals: string[]): number {
  if (intervals.length === 0) return 50;
  
  // Allora provides confidence intervals (e.g., [low, high])
  // Narrower interval = higher confidence
  const values = intervals.map(v => parseFloat(v));
  const range = Math.abs(values[values.length - 1] - values[0]);
  
  // Convert range to confidence score (0-100)
  // Smaller range = higher confidence
  const maxRange = 100; // Adjust based on your needs
  const confidence = Math.max(50, 100 - (range / maxRange) * 50);
  
  return Math.round(confidence);
}
```

### 3. Database Schema for Allora Data

```sql
-- Add new table for Allora inferences
CREATE TABLE allora_inferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  topic_id INTEGER NOT NULL,
  topic_name TEXT,
  network_inference DECIMAL NOT NULL,
  confidence_interval_min DECIMAL,
  confidence_interval_max DECIMAL,
  confidence_score INTEGER, -- 0-100
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for fast lookups
CREATE INDEX idx_allora_topic_timestamp ON allora_inferences(topic_id, timestamp DESC);

-- Add Allora source to signals table
ALTER TABLE signals ADD COLUMN source TEXT DEFAULT 'gpt4o';
-- Options: 'gpt4o', 'allora', 'hybrid'

ALTER TABLE signals ADD COLUMN allora_inference_id TEXT REFERENCES allora_inferences(id);
```

### 4. Enhanced Signal Generation (`src/lib/signals.ts`)

```typescript
import { getBTCPricePrediction, getETHPricePrediction, getInferenceByTopic } from './allora-client';

export async function generateAlloraSignals() {
  const signals: Signal[] = [];
  
  // Fetch Allora predictions for crypto markets
  const btcPrediction = await getBTCPricePrediction();
  const ethPrediction = await getETHPricePrediction();
  
  // Find matching Polymarket questions
  const polymarketBTC = await findPolymarketQuestion('Bitcoin', 'price');
  const polymarketETH = await findPolymarketQuestion('Ethereum', 'price');
  
  if (polymarketBTC) {
    const signal = await createSignalFromAllora(
      polymarketBTC,
      btcPrediction,
      'BTC price prediction from Allora Network'
    );
    signals.push(signal);
  }
  
  if (polymarketETH) {
    const signal = await createSignalFromAllora(
      polymarketETH,
      ethPrediction,
      'ETH price prediction from Allora Network'
    );
    signals.push(signal);
  }
  
  return signals;
}

async function createSignalFromAllora(
  market: PolymarketQuestion,
  alloraPrediction: { price: number; confidence: number },
  reasoning: string
) {
  // Compare Allora prediction to Polymarket price
  const marketPrice = market.yesPrice;
  const alloraProbability = convertPriceToProbability(alloraPrediction.price, market);
  
  // Determine direction
  const direction = alloraProbability > marketPrice ? 'YES' : 'NO';
  
  // Calculate edge
  const edge = Math.abs(alloraProbability - marketPrice) * 100;
  
  // Calculate EV
  const ev = calculateExpectedValue(alloraProbability, marketPrice, direction);
  
  return {
    conditionId: market.conditionId,
    question: market.question,
    direction,
    confidence: alloraPrediction.confidence,
    reasoning,
    source: 'allora',
    metadata: {
      ev,
      edge,
      alloraProbability,
      marketProbability: marketPrice,
      sentiment: determineSentiment(edge),
      technicalSignal: determineTechnicalSignal(ev, edge),
    },
  };
}

// Convert Allora price prediction to probability for binary outcome
function convertPriceToProbability(predictedPrice: number, market: PolymarketQuestion): number {
  // For price predictions, we need context (e.g., is predicted price > threshold?)
  // This depends on how the Polymarket question is framed
  
  // Example: "Will BTC be above $50,000 by end of month?"
  // If Allora predicts $52,000, probability = high (YES)
  // If Allora predicts $48,000, probability = low (NO)
  
  // Simplified logic (customize based on actual questions)
  const threshold = extractThresholdFromQuestion(market.question);
  
  if (predictedPrice > threshold) {
    // Calculate how much above threshold
    const diff = predictedPrice - threshold;
    const probability = Math.min(0.95, 0.5 + (diff / threshold) * 0.5);
    return probability;
  } else {
    // Calculate how much below threshold
    const diff = threshold - predictedPrice;
    const probability = Math.max(0.05, 0.5 - (diff / threshold) * 0.5);
    return probability;
  }
}
```

### 5. Hybrid Strategy: Allora + GPT-4o

```typescript
export async function generateHybridSignals() {
  // Fetch both Allora and GPT-4o predictions
  const alloraSignals = await generateAlloraSignals();
  const gptSignals = await generateGPTSignals();
  
  // For each market, combine predictions
  const hybridSignals = [];
  
  for (const market of allMarkets) {
    const alloraSignal = alloraSignals.find(s => s.conditionId === market.conditionId);
    const gptSignal = gptSignals.find(s => s.conditionId === market.conditionId);
    
    if (alloraSignal && gptSignal) {
      // Both available: weighted average
      const hybridSignal = {
        conditionId: market.conditionId,
        question: market.question,
        direction: weightedVote([
          { direction: alloraSignal.direction, weight: 0.7 },
          { direction: gptSignal.direction, weight: 0.3 },
        ]),
        confidence: (alloraSignal.confidence * 0.7) + (gptSignal.confidence * 0.3),
        reasoning: `Allora: ${alloraSignal.reasoning}\nGPT-4o: ${gptSignal.reasoning}`,
        source: 'hybrid',
        metadata: {
          alloraEV: alloraSignal.metadata.ev,
          gptEV: gptSignal.metadata.ev,
          combinedEV: (alloraSignal.metadata.ev * 0.7) + (gptSignal.metadata.ev * 0.3),
        },
      };
      
      hybridSignals.push(hybridSignal);
    } else if (alloraSignal) {
      // Only Allora available
      hybridSignals.push({ ...alloraSignal, source: 'allora' });
    } else if (gptSignal) {
      // Only GPT-4o available
      hybridSignals.push({ ...gptSignal, source: 'gpt4o' });
    }
  }
  
  return hybridSignals;
}

function weightedVote(votes: { direction: string; weight: number }[]): string {
  const yesWeight = votes
    .filter(v => v.direction === 'YES')
    .reduce((sum, v) => sum + v.weight, 0);
  
  const noWeight = votes
    .filter(v => v.direction === 'NO')
    .reduce((sum, v) => sum + v.weight, 0);
  
  return yesWeight > noWeight ? 'YES' : 'NO';
}
```

### 6. Agent Strategy Update

```typescript
// New strategy: Allora Follower
export async function executeAlloraFollowerStrategy(agent: Agent) {
  // Fetch signals from Allora Network only
  const signals = await getRecentSignals(agent.userId, 'allora');
  
  for (const signal of signals) {
    // Filter by confidence
    if (signal.confidence < agent.config.minConfidence) continue;
    
    // Filter by EV
    if (signal.metadata.ev <= 0) continue;
    
    // Calculate position size based on Allora confidence
    const positionSize = calculatePositionSize(
      agent.config.maxPositionSize,
      signal.metadata.ev,
      signal.metadata.edge,
      signal.confidence
    );
    
    // Execute trade
    await executeTrade({
      agentId: agent.id,
      conditionId: signal.conditionId,
      direction: signal.direction,
      amount: positionSize,
      confidence: signal.confidence,
      source: 'allora',
    });
  }
}

// New strategy: Hybrid (Allora + GPT-4o)
export async function executeHybridStrategy(agent: Agent) {
  const signals = await getRecentSignals(agent.userId, 'hybrid');
  
  for (const signal of signals) {
    // Only trade if both Allora and GPT agree
    if (!signal.metadata.alloraEV || !signal.metadata.gptEV) continue;
    
    // Both must have positive EV
    if (signal.metadata.alloraEV <= 0 || signal.metadata.gptEV <= 0) continue;
    
    // High confidence required for hybrid
    if (signal.confidence < 75) continue;
    
    const positionSize = calculatePositionSize(
      agent.config.maxPositionSize,
      signal.metadata.combinedEV,
      signal.metadata.edge,
      signal.confidence
    );
    
    await executeTrade({
      agentId: agent.id,
      conditionId: signal.conditionId,
      direction: signal.direction,
      amount: positionSize,
      confidence: signal.confidence,
      source: 'hybrid',
    });
  }
}
```

---

## 🚀 Environment Setup

### `.env.local` additions:

```bash
# Allora Network Configuration
ALLORA_API_KEY=your_allora_api_key_here  # Optional but recommended
ALLORA_CHAIN=mainnet  # or 'testnet' for testing

# Allora Wallet (for creating custom topics - Phase 2)
ALLORA_WALLET_ADDRESS=your_wallet_address
ALLORA_WALLET_PRIVATE_KEY=your_private_key  # Keep secure!
```

### Get Allora API Key:
1. Visit [Allora Network](https://allora.network)
2. Create account
3. Generate API key
4. Add to `.env.local`

---

## 📊 Available Allora Topics (Testnet)

| Topic ID | Name | Description |
|----------|------|-------------|
| 1 | ETH 10min Prediction | Ethereum price in 10 minutes |
| 2 | ETH 24h Prediction | Ethereum price in 24 hours |
| 3 | BTC 10min Prediction | Bitcoin price in 10 minutes |
| 4 | BTC 24h Prediction | Bitcoin price in 24 hours |
| 5 | SOL 10min Prediction | Solana price in 10 minutes |
| 6 | SOL 24h Prediction | Solana price in 24 hours |
| 13 | ETH 5min Prediction | Ethereum price in 5 minutes |
| 14 | BTC 5min Prediction | Bitcoin price in 5 minutes |

**Mainnet topics**: Similar structure, more active models

---

## 🎯 Implementation Timeline

| Week | Phase | Deliverable | Status |
|------|-------|-------------|--------|
| 1 | SDK Integration | Allora client + fetch inferences | 🔜 Ready to start |
| 2 | Custom Topics | Create Polymarket-specific topics | 🔜 Pending |
| 3 | Signal Generation | Replace GPT with Allora | 🔜 Pending |
| 4 | Hybrid Intelligence | Allora + GPT combined | 🔜 Pending |
| 5 | Real-Time | WebSocket/polling setup | 🔜 Pending |
| 6 | Performance Tracking | Analytics dashboard | 🔜 Pending |

**Total Time**: 6 weeks for full Cobot-style integration

**MVP** (Weeks 1-3): Basic Allora integration with crypto signals

---

## 💰 Cost Comparison

### Current (GPT-4o):
- Cost: ~$0.01 per 10 markets analyzed
- Monthly: ~$50-100 (5000 signals/month)

### With Allora:
- API calls: Free (or minimal with API key)
- Creating custom topics: Requires ALLO tokens (one-time)
- Running workers: Optional (can consume existing topics)
- Monthly: ~$0-20 (mostly API rate limits)

**Savings**: 80-100% reduction in inference costs

---

## 🔑 Key Advantages Over Current System

### 1. **Multiple Models** (vs Single GPT-4o)
- Allora: Hundreds of competing models
- Weighted by historical accuracy
- Diverse perspectives

### 2. **Self-Improving**
- Bad models automatically downweighted
- Good models get higher influence
- System learns over time

### 3. **Context-Aware**
- Models perform differently in different conditions
- Network knows which models excel when
- Adaptive intelligence

### 4. **Decentralized**
- No single point of failure
- Can't be censored or shut down
- Transparent on-chain

### 5. **Cost-Effective**
- Free or minimal API costs
- No OpenAI fees for prediction
- Scalable without cost explosion

---

## 🎓 What Makes This "Exactly Like Cobot"

### Cobot's Architecture:
```
Allora Network → Weighted Inferences → Cobot Agent Engine → Trades
```

### Our New Architecture:
```
Allora Network → Weighted Inferences → PredictIQ Agent Engine → Trades
```

**Same data source**: Allora Network  
**Same methodology**: Weighted aggregation of multiple models  
**Same self-improvement**: Model accuracy tracking  
**Same decentralization**: On-chain inference coordination  

**Differences**:
- Cobot may have custom Allora topics we don't (yet)
- Cobot may run their own workers (we can too in Phase 2)
- We add hybrid approach (Allora + GPT) for even better results

---

## 🚦 Next Steps

### Immediate (This Week):
1. ✅ Install Allora SDK: `npm install @alloralabs/allora-sdk`
2. ✅ Get Allora API key from [allora.network](https://allora.network)
3. ✅ Create `src/lib/allora-client.ts` with basic integration
4. ✅ Test fetching BTC/ETH predictions
5. ✅ Add Allora data to database schema

### Week 2:
1. Generate first Allora-powered signals
2. Compare Allora vs GPT-4o predictions
3. Update agent strategies to use Allora

### Week 3-4:
1. Create custom Allora topics for Polymarket
2. Implement hybrid strategy (Allora + GPT)
3. Real-time monitoring setup

### Week 5-6:
1. Performance tracking dashboard
2. Model accuracy comparison
3. Production deployment

---

## ✅ Summary

**What we're building**:
- Direct integration with Allora Network (same as Cobot)
- Consume predictions from hundreds of ML models
- Weighted aggregation based on model performance
- Self-improving system that learns over time
- Hybrid approach for even better results

**Why this matches Cobot**:
- ✅ Same underlying network (Allora)
- ✅ Same multi-model architecture
- ✅ Same weighted aggregation
- ✅ Same decentralized coordination
- ✅ Same self-improving mechanisms

**Advantages over current system**:
- 80-100% cost reduction
- Multiple models instead of single AI
- Self-improving over time
- Decentralized and censorship-resistant
- Context-aware intelligence

**Ready to start?** Let's begin with Phase 1: SDK Integration!
