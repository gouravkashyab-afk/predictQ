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

  const reasoningTemplates = {
    YES: [
      `Current YES price of ${(yesPrice * 100).toFixed(0)}¢ appears undervalued given recent market momentum. Historical patterns suggest upward mean-reversion.`,
      `Market participants may be underpricing this outcome. At ${(yesPrice * 100).toFixed(0)}¢, the risk/reward favors a YES position.`,
      `Sentiment analysis indicates positive momentum. ${(yesPrice * 100).toFixed(0)}¢ entry provides ${confidence}% confidence upside.`,
    ],
    NO: [
      `At ${(yesPrice * 100).toFixed(0)}¢, YES appears overbought. Mean reversion signals favor a NO position with ${confidence}% confidence.`,
      `Recent price action shows exhaustion near current levels. NO position at ${(100 - yesPrice * 100).toFixed(0)}¢ offers favorable risk profile.`,
      `Contrarian indicator triggered — high YES pricing creates opportunity for NO at ${(100 - yesPrice * 100).toFixed(0)}¢.`,
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

  const prompt = `You are an expert prediction market analyst. Analyze these markets and provide trade signals.

Markets:
${marketList}

For each market, respond with a JSON array of objects:
{
  "conditionId": "...",
  "direction": "YES" or "NO",
  "confidence": <integer 55-95>,
  "reasoning": "<1-2 sentence analysis>"
}

Base your analysis on:
- Current price relative to fair value
- Market category fundamentals
- Volume and liquidity indicators
- Contrarian vs momentum signals

Return ONLY the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let parsed: Array<{ conditionId: string; direction: string; confidence: number; reasoning: string }>;

  try {
    const obj = JSON.parse(content);
    parsed = Array.isArray(obj) ? obj : (obj.signals ?? obj.results ?? []);
  } catch {
    console.error("[signals] Failed to parse GPT response:", content);
    return markets.map(mockSignal);
  }

  return parsed.map((p) => {
    const market = markets.find((m) => m.conditionId === p.conditionId) ?? markets[0];
    return {
      conditionId: p.conditionId,
      question: market?.question ?? "",
      direction: p.direction === "NO" ? "NO" : "YES",
      confidence: Math.min(95, Math.max(50, p.confidence ?? 65)),
      reasoning: p.reasoning ?? "",
      model: "gpt-4o",
      yesPrice: market?.yesPrice ?? 0,
      noPrice: market?.noPrice ?? 0,
      volume: market?.volume ?? 0,
      category: market?.category ?? "Other",
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
