// ─── AI Signals Engine ────────────────────────────────────────────────────────
// Uses GPT-4o to analyze top prediction markets and generate trade signals.
// Falls back to deterministic mock signals when OPENAI_API_KEY is not set.

import { fetchMarkets, normalizeMarkets } from "./polymarket";

export interface SignalResult {
  conditionId: string;
  question: string;
  direction: "YES" | "NO";
  confidence: number; // 0-100
  reasoning: string;
  model: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  category: string;
  // Enhanced fields (Phase 1)
  expectedValue?: number; // EV percentage (-100 to +100)
  impliedProbability?: number; // Market's implied probability (0-1)
  aiProbability?: number; // AI's estimated probability (0-1)
  sentiment?: "bullish" | "bearish" | "neutral"; // Market sentiment
  technicalSignal?: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  volumeMomentum?: "increasing" | "stable" | "decreasing";
  edgePercentage?: number; // Percentage edge over market (0-100)
}

// ─── Helper: Calculate Expected Value (EV) ───────────────────────────────────

/**
 * Calculate Expected Value for a trade
 * EV = (ProbabilityWin × AmountWon) - (ProbabilityLose × AmountLost)
 * 
 * Example:
 * - Market price: 60¢ (implied prob: 60%)
 * - AI believes: 70% chance
 * - If AI is right: EV = (0.7 × 40¢) - (0.3 × 60¢) = 28¢ - 18¢ = +10¢ (16.7% ROI)
 */
function calculateExpectedValue(
  aiProbability: number, // AI's estimated probability (0-1)
  marketPrice: number     // Current market price (0-1)
): { ev: number; edgePercentage: number } {
  // EV for buying YES at marketPrice
  const potentialWin = 1 - marketPrice; // If win, get 1 - price
  const potentialLoss = marketPrice;     // If lose, lose the price paid
  
  const ev = (aiProbability * potentialWin) - ((1 - aiProbability) * potentialLoss);
  const evPercentage = (ev / marketPrice) * 100; // ROI percentage
  
  // Edge = difference between AI probability and market probability
  const marketProbability = marketPrice;
  const edgePercentage = Math.abs((aiProbability - marketProbability) * 100);
  
  return {
    ev: evPercentage,
    edgePercentage
  };
}

// ─── Helper: Analyze Sentiment ───────────────────────────────────────────────

/**
 * Analyze market sentiment based on price action
 * - Bullish: Price < 50% but AI thinks > 50%
 * - Bearish: Price > 50% but AI thinks < 50%
 * - Neutral: Agreement between market and AI
 */
function analyzeSentiment(
  aiProbability: number,
  marketPrice: number,
  direction: "YES" | "NO"
): "bullish" | "bearish" | "neutral" {
  if (direction === "YES" && marketPrice < 0.5 && aiProbability > marketPrice) {
    return "bullish"; // AI more optimistic than market
  }
  if (direction === "NO" && marketPrice > 0.5 && aiProbability < marketPrice) {
    return "bearish"; // AI more pessimistic than market
  }
  if (Math.abs(aiProbability - marketPrice) < 0.1) {
    return "neutral"; // Close agreement
  }
  return direction === "YES" ? "bullish" : "bearish";
}

// ─── Helper: Technical Signal ────────────────────────────────────────────────

/**
 * Generate technical trading signal based on:
 * - Price extremes (oversold/overbought)
 * - Edge percentage
 * - Confidence level
 */
function generateTechnicalSignal(
  marketPrice: number,
  edgePercentage: number,
  confidence: number
): "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell" {
  // Strong signals: edge > 15% and confidence > 80%
  if (edgePercentage > 15 && confidence > 80) {
    return marketPrice < 0.3 ? "strong_buy" : marketPrice > 0.7 ? "strong_sell" : "buy";
  }
  
  // Good signals: edge > 10% and confidence > 70%
  if (edgePercentage > 10 && confidence > 70) {
    return marketPrice < 0.4 ? "buy" : marketPrice > 0.6 ? "sell" : "neutral";
  }
  
  // Moderate signals
  if (edgePercentage > 5 && confidence > 60) {
    return marketPrice < 0.5 ? "buy" : "sell";
  }
  
  return "neutral";
}

// ─── Helper: Analyze Volume Momentum ─────────────────────────────────────────

/**
 * Determine volume momentum
 * (Simplified version - in production, compare to historical average)
 */
function analyzeVolumeMomentum(volume: number): "increasing" | "stable" | "decreasing" {
  // Simple heuristic: above $100K = increasing, $50K-$100K = stable, below = decreasing
  if (volume > 100_000) return "increasing";
  if (volume > 50_000) return "stable";
  return "decreasing";
}

// ─── Mock signal generator (deterministic, no API key needed) ─────────────────

function mockSignal(market: {
  conditionId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  category: string;
}): SignalResult {
  // Deterministic "signal" based on price levels — purely illustrative
  const yesPrice = market.yesPrice;
  const direction: "YES" | "NO" = yesPrice > 0.5 ? "NO" : "YES";
  const confidence = Math.min(
    95,
    Math.max(55, Math.round(60 + Math.abs(yesPrice - 0.5) * 70))
  );

  // Calculate AI probability (slightly different from market)
  const aiProbability = direction === "YES" 
    ? Math.min(0.95, yesPrice + 0.15) // AI thinks YES is more likely
    : Math.max(0.05, yesPrice - 0.15); // AI thinks NO is more likely

  // Calculate EV and edge
  const { ev, edgePercentage } = calculateExpectedValue(
    direction === "YES" ? aiProbability : (1 - aiProbability),
    direction === "YES" ? yesPrice : (1 - yesPrice)
  );

  // Analyze sentiment and technicals
  const sentiment = analyzeSentiment(aiProbability, yesPrice, direction);
  const technicalSignal = generateTechnicalSignal(yesPrice, edgePercentage, confidence);
  const volumeMomentum = analyzeVolumeMomentum(market.volume);

  const reasoningTemplates = {
    YES: [
      `Current YES price of ${(yesPrice * 100).toFixed(0)}¢ appears undervalued. EV: ${ev.toFixed(1)}%. Edge: ${edgePercentage.toFixed(1)}%. ${sentiment === 'bullish' ? 'Bullish momentum detected.' : ''}`,
      `Market participants may be underpricing this outcome. At ${(yesPrice * 100).toFixed(0)}¢, expected value is ${ev > 0 ? '+' : ''}${ev.toFixed(1)}% with ${edgePercentage.toFixed(0)}% edge.`,
      `Sentiment analysis indicates ${sentiment} trend. ${(yesPrice * 100).toFixed(0)}¢ entry provides ${confidence}% confidence with ${ev > 0 ? 'positive' : 'negative'} EV.`,
    ],
    NO: [
      `At ${(yesPrice * 100).toFixed(0)}¢, YES appears overbought. NO position offers ${Math.abs(ev).toFixed(1)}% EV with ${edgePercentage.toFixed(0)}% edge over market.`,
      `Recent price action shows ${sentiment} sentiment. NO position at ${(100 - yesPrice * 100).toFixed(0)}¢ offers ${technicalSignal} signal.`,
      `Contrarian indicator triggered with ${edgePercentage.toFixed(0)}% edge. NO at ${(100 - yesPrice * 100).toFixed(0)}¢ provides ${confidence}% confidence.`,
    ],
  };

  const templates = reasoningTemplates[direction];
  const reasoning = templates[Math.floor(market.volume % templates.length)];

  return {
    conditionId: market.conditionId,
    question: market.question,
    direction,
    confidence,
    reasoning,
    model: "mock",
    yesPrice: market.yesPrice,
    noPrice: market.noPrice,
    volume: market.volume,
    category: market.category,
    // Enhanced fields
    expectedValue: ev,
    impliedProbability: yesPrice,
    aiProbability,
    sentiment,
    technicalSignal,
    volumeMomentum,
    edgePercentage,
  };
}

// ─── GPT-4o signal generator ──────────────────────────────────────────────────

async function generateWithGPT(
  markets: Array<{
    conditionId: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    volume: number;
    category: string;
  }>
): Promise<SignalResult[]> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const marketList = markets
    .map(
      (m, i) =>
        `${i + 1}. [${m.conditionId}] ${m.question}\n   Category: ${m.category} | YES: ${(m.yesPrice * 100).toFixed(1)}¢ | NO: ${(m.noPrice * 100).toFixed(1)}¢ | Volume: $${(m.volume / 1000).toFixed(0)}K`
    )
    .join("\n\n");

  const prompt = `You are an expert prediction market analyst. Analyze these markets and provide trade signals with Expected Value (EV) calculations.

Markets:
${marketList}

For each market, respond with a JSON array of objects:
{
  "conditionId": "...",
  "direction": "YES" or "NO",
  "confidence": <integer 55-95>,
  "reasoning": "<1-2 sentence analysis with EV mention>",
  "aiProbability": <float 0-1, your estimated probability of the direction winning>,
  "sentiment": "bullish" or "bearish" or "neutral",
  "edgePercentage": <integer 0-100, how much edge you have over market price>
}

Base your analysis on:
- Expected Value: Compare your probability estimate to market price
- Edge calculation: aiProbability vs impliedProbability (market price)
- Market category fundamentals and recent news
- Volume and liquidity indicators
- Technical signals (oversold/overbought)
- Contrarian vs momentum opportunities

Return ONLY the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let parsed: Array<{ 
    conditionId: string; 
    direction: string; 
    confidence: number; 
    reasoning: string;
    aiProbability?: number;
    sentiment?: string;
    edgePercentage?: number;
  }>;

  try {
    const obj = JSON.parse(content);
    parsed = Array.isArray(obj) ? obj : (obj.signals ?? obj.results ?? []);
  } catch {
    console.error("[signals] Failed to parse GPT response:", content);
    return markets.map(mockSignal);
  }

  return parsed.map((p) => {
    const market = markets.find((m) => m.conditionId === p.conditionId) ?? markets[0];
    const direction = p.direction === "NO" ? "NO" : "YES";
    const confidence = Math.min(95, Math.max(50, p.confidence ?? 65));
    
    // Use AI probability from GPT or calculate from confidence
    const aiProbability = p.aiProbability ?? (confidence / 100);
    const marketPrice = direction === "YES" ? market.yesPrice : market.noPrice;
    
    // Calculate EV and technical indicators
    const { ev, edgePercentage } = calculateExpectedValue(aiProbability, marketPrice);
    const sentiment = p.sentiment as any ?? analyzeSentiment(aiProbability, market.yesPrice, direction);
    const technicalSignal = generateTechnicalSignal(marketPrice, p.edgePercentage ?? edgePercentage, confidence);
    const volumeMomentum = analyzeVolumeMomentum(market.volume);
    
    return {
      conditionId: p.conditionId,
      question: market?.question ?? "",
      direction,
      confidence,
      reasoning: p.reasoning ?? "",
      model: "gpt-4o",
      yesPrice: market?.yesPrice ?? 0,
      noPrice: market?.noPrice ?? 0,
      volume: market?.volume ?? 0,
      category: market?.category ?? "Other",
      // Enhanced fields
      expectedValue: ev,
      impliedProbability: marketPrice,
      aiProbability,
      sentiment,
      technicalSignal,
      volumeMomentum,
      edgePercentage: p.edgePercentage ?? edgePercentage,
    };
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate AI trade signals for the top N markets by volume.
 * Uses GPT-4o when OPENAI_API_KEY is set, otherwise uses mock signals.
 */
export async function generateSignals(limit = 10): Promise<SignalResult[]> {
  // Fetch top markets by volume
  const raw = await fetchMarkets({
    limit,
    closed: false,
    order: "volumeNum",
    ascending: false,
  });
  const topMarkets = normalizeMarkets(raw).slice(0, limit);

  if (!process.env.OPENAI_API_KEY) {
    console.log("[signals] No OPENAI_API_KEY — using mock signals");
    return topMarkets.map(mockSignal);
  }

  try {
    return await generateWithGPT(topMarkets);
  } catch (err) {
    console.error("[signals] GPT-4o failed, falling back to mock:", err);
    return topMarkets.map(mockSignal);
  }
}
