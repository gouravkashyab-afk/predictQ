/**
 * Generate Allora-Powered AI Signals
 * GET /api/allora/signals
 * 
 * Generates trading signals using Allora Network predictions
 * Exactly like Cobot's signal generation system
 */

import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { signals, alloraInferences, markets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  getAllCryptoPredictions,
  convertPriceToProbability,
} from '@/lib/allora-client';

export async function GET() {
  try {
    console.log('🤖 Generating Allora-powered signals...');

    // Fetch Allora predictions for crypto assets
    const predictions = await getAllCryptoPredictions();

    const generatedSignals = [];

    // Store Allora inferences in database
    const btcInference = await db
      .insert(alloraInferences)
      .values({
        id: crypto.randomUUID(),
        topicId: parseInt(predictions.btc.topicId),
        topicName: 'BTC 8h Prediction',
        asset: 'BTC',
        timeframe: predictions.btc.timeframe,
        networkInference: predictions.btc.price,
        networkInferenceNormalized: predictions.btc.normalizedPrice,
        confidenceScore: predictions.btc.confidence,
        confidenceIntervalMin: predictions.btc.confidenceInterval.min,
        confidenceIntervalMax: predictions.btc.confidenceInterval.max,
        timestamp: predictions.btc.timestamp,
      })
      .returning();

    const ethInference = await db
      .insert(alloraInferences)
      .values({
        id: crypto.randomUUID(),
        topicId: parseInt(predictions.eth.mediumTerm.topicId),
        topicName: 'ETH 8h Prediction',
        asset: 'ETH',
        timeframe: predictions.eth.mediumTerm.timeframe,
        networkInference: predictions.eth.mediumTerm.price,
        networkInferenceNormalized: predictions.eth.mediumTerm.normalizedPrice,
        confidenceScore: predictions.eth.mediumTerm.confidence,
        confidenceIntervalMin: predictions.eth.mediumTerm.confidenceInterval.min,
        confidenceIntervalMax: predictions.eth.mediumTerm.confidenceInterval.max,
        timestamp: predictions.eth.mediumTerm.timestamp,
      })
      .returning();

    // Find matching Polymarket crypto markets
    const cryptoMarkets = await db
      .select()
      .from(markets)
      .where(eq(markets.active, true))
      .orderBy(desc(markets.volume))
      .limit(100);

    // Look for BTC-related markets
    const btcMarkets = cryptoMarkets.filter(
      (m) =>
        m.question.toLowerCase().includes('bitcoin') ||
        m.question.toLowerCase().includes('btc')
    );

    // Look for ETH-related markets
    const ethMarkets = cryptoMarkets.filter(
      (m) =>
        m.question.toLowerCase().includes('ethereum') ||
        m.question.toLowerCase().includes('eth')
    );

    // Generate signals for BTC markets
    for (const market of btcMarkets.slice(0, 3)) {
      // Limit to 3 markets
      const signal = await generateAlloraSignal(
        market,
        predictions.btc,
        btcInference[0].id,
        'BTC'
      );
      if (signal) {
        generatedSignals.push(signal);
      }
    }

    // Generate signals for ETH markets
    for (const market of ethMarkets.slice(0, 3)) {
      // Limit to 3 markets
      const signal = await generateAlloraSignal(
        market,
        predictions.eth.mediumTerm,
        ethInference[0].id,
        'ETH'
      );
      if (signal) {
        generatedSignals.push(signal);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedSignals.length} Allora-powered signals`,
      data: {
        signals: generatedSignals,
        predictions: {
          btc: {
            price: predictions.btc.price,
            confidence: predictions.btc.confidence,
            range: predictions.btc.confidenceInterval,
          },
          eth: {
            price: predictions.eth.mediumTerm.price,
            confidence: predictions.eth.mediumTerm.confidence,
            range: predictions.eth.mediumTerm.confidenceInterval,
          },
        },
        stats: {
          totalMarkets: cryptoMarkets.length,
          btcMarkets: btcMarkets.length,
          ethMarkets: ethMarkets.length,
          signalsGenerated: generatedSignals.length,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error generating Allora signals:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate Allora signals',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a signal from Allora prediction for a specific market
 */
async function generateAlloraSignal(
  market: any,
  prediction: any,
  alloraInferenceId: string,
  asset: 'BTC' | 'ETH'
) {
  try {
    // Extract threshold from question if possible
    // Examples:
    // "Will Bitcoin hit $100k by end of 2024?" → threshold: 100000
    // "Will ETH reach $5000?" → threshold: 5000
    const thresholdMatch = market.question.match(/\$?([\d,]+)k?/i);
    if (!thresholdMatch) {
      console.log(`⚠️ No threshold found in question: ${market.question}`);
      return null;
    }

    let threshold = parseFloat(thresholdMatch[1].replace(/,/g, ''));
    if (market.question.toLowerCase().includes('k')) {
      threshold *= 1000;
    }

    // Determine direction from question
    const direction = market.question.toLowerCase().includes('above') ||
      market.question.toLowerCase().includes('hit') ||
      market.question.toLowerCase().includes('reach')
      ? 'above'
      : market.question.toLowerCase().includes('below') ||
        market.question.toLowerCase().includes('drop') ||
        market.question.toLowerCase().includes('fall')
      ? 'below'
      : 'above'; // default

    // Convert Allora price prediction to probability
    const probability = convertPriceToProbability(
      prediction.price,
      threshold,
      direction
    );

    // Determine YES/NO direction
    const tradeDirection = probability > 0.5 ? 'YES' : 'NO';

    // Calculate confidence (combine Allora confidence with probability)
    const confidence = Math.round(
      prediction.confidence * Math.abs(probability - 0.5) * 2
    );

    // Only generate signal if confidence is reasonable
    if (confidence < 60) {
      console.log(`⚠️ Confidence too low (${confidence}%) for ${market.question}`);
      return null;
    }

    // Calculate Expected Value (EV)
    const marketPrice = tradeDirection === 'YES' ? market.yesPrice : market.noPrice;
    const ev = calculateEV(probability, marketPrice, tradeDirection);

    // Calculate Edge
    const edge = Math.abs(probability - marketPrice) * 100;

    // Determine sentiment
    const sentiment =
      edge > 15 ? 'Strong' : edge > 10 ? 'Bullish' : edge > 5 ? 'Neutral' : 'Weak';

    // Determine technical signal
    const technicalSignal =
      ev > 20 && edge > 15
        ? 'Strong Buy'
        : ev > 10 && edge > 10
        ? 'Buy'
        : ev > 5
        ? 'Hold'
        : 'Skip';

    // Create signal in database
    const [signal] = await db
      .insert(signals)
      .values({
        id: crypto.randomUUID(),
        conditionId: market.conditionId,
        question: market.question,
        direction: tradeDirection,
        confidence,
        reasoning: `Allora Network predicts ${asset} at $${prediction.price.toFixed(2)} (${prediction.confidence}% confidence). Question threshold: $${threshold}. Implied probability: ${(probability * 100).toFixed(1)}%. Market price: ${(marketPrice * 100).toFixed(1)}¢. Edge: ${edge.toFixed(1)}%. ${technicalSignal}.`,
        model: 'allora-network',
        source: 'allora',
        alloraInferenceId,
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        volume: market.volume,
        category: market.category || 'Crypto',
        metadata: {
          alloraPrediction: prediction.price,
          threshold,
          probability,
          ev,
          edge,
          sentiment,
          technicalSignal,
          confidenceInterval: prediction.confidenceInterval,
          asset,
          timeframe: prediction.timeframe,
        },
      })
      .returning();

    console.log(`✅ Generated Allora signal for ${market.question}: ${tradeDirection} @ ${confidence}%`);

    return signal;
  } catch (error) {
    console.error(`Error generating signal for ${market.question}:`, error);
    return null;
  }
}

/**
 * Calculate Expected Value (EV)
 */
function calculateEV(
  probability: number,
  marketPrice: number,
  direction: 'YES' | 'NO'
): number {
  if (direction === 'YES') {
    const winAmount = 1 - marketPrice; // If you buy YES at 65¢, you win 35¢
    const loseAmount = marketPrice; // You lose 65¢
    const ev = probability * winAmount - (1 - probability) * loseAmount;
    return (ev / marketPrice) * 100; // Return as percentage
  } else {
    const winAmount = 1 - marketPrice;
    const loseAmount = marketPrice;
    const ev = (1 - probability) * winAmount - probability * loseAmount;
    return (ev / marketPrice) * 100;
  }
}
