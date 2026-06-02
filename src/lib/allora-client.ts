/**
 * Allora Network Client
 * Connects to Allora's decentralized Model Coordination Network (MCN)
 * to consume predictions from hundreds of competing ML models
 */

import {
  AlloraAPIClient,
  ChainSlug,
  PriceInferenceToken,
  PriceInferenceTimeframe,
  type AlloraTopic,
  type AlloraInference,
} from '@alloralabs/allora-sdk';

// Initialize Allora client
const alloraClient = new AlloraAPIClient({
  chainSlug: process.env.ALLORA_CHAIN === 'testnet' ? ChainSlug.TESTNET : ChainSlug.MAINNET,
  apiKey: process.env.ALLORA_API_KEY, // Optional but recommended for production
});

/**
 * Fetch BTC price prediction from Allora Network
 * Uses 8-hour timeframe for medium-term predictions
 */
export async function getBTCPricePrediction() {
  try {
    const inference = await alloraClient.getPriceInference(
      PriceInferenceToken.BTC,
      PriceInferenceTimeframe.EIGHT_HOURS
    );

    return {
      asset: 'BTC',
      price: parseFloat(inference.inference_data.network_inference),
      normalizedPrice: parseFloat(inference.inference_data.network_inference_normalized),
      confidence: calculateConfidenceFromInterval(
        inference.inference_data.confidence_interval_values
      ),
      confidenceInterval: {
        min: parseFloat(inference.inference_data.confidence_interval_values[0]),
        max: parseFloat(
          inference.inference_data.confidence_interval_values[
            inference.inference_data.confidence_interval_values.length - 1
          ]
        ),
      },
      timestamp: inference.inference_data.timestamp,
      topicId: inference.inference_data.topic_id,
      timeframe: '8h',
    };
  } catch (error) {
    console.error('Error fetching BTC prediction from Allora:', error);
    throw error;
  }
}

/**
 * Fetch ETH price prediction from Allora Network
 * Uses 5-minute timeframe for short-term predictions
 */
export async function getETHPricePrediction(
  timeframe: '5m' | '8h' = '5m'
) {
  try {
    const inference = await alloraClient.getPriceInference(
      PriceInferenceToken.ETH,
      timeframe === '5m'
        ? PriceInferenceTimeframe.FIVE_MIN
        : PriceInferenceTimeframe.EIGHT_HOURS
    );

    return {
      asset: 'ETH',
      price: parseFloat(inference.inference_data.network_inference),
      normalizedPrice: parseFloat(inference.inference_data.network_inference_normalized),
      confidence: calculateConfidenceFromInterval(
        inference.inference_data.confidence_interval_values
      ),
      confidenceInterval: {
        min: parseFloat(inference.inference_data.confidence_interval_values[0]),
        max: parseFloat(
          inference.inference_data.confidence_interval_values[
            inference.inference_data.confidence_interval_values.length - 1
          ]
        ),
      },
      timestamp: inference.inference_data.timestamp,
      topicId: inference.inference_data.topic_id,
      timeframe,
    };
  } catch (error) {
    console.error('Error fetching ETH prediction from Allora:', error);
    throw error;
  }
}

/**
 * Fetch all available topics from Allora Network
 * Returns only active topics
 */
export async function getAllAlloraTopics(): Promise<AlloraTopic[]> {
  try {
    const topics = await alloraClient.getAllTopics();
    return topics.filter((topic) => topic.is_active);
  } catch (error) {
    console.error('Error fetching Allora topics:', error);
    throw error;
  }
}

/**
 * Fetch inference by custom topic ID
 * Useful for custom prediction market topics
 */
export async function getInferenceByTopic(topicId: number) {
  try {
    const inference = await alloraClient.getInferenceByTopicID(topicId);

    return {
      topicId: parseInt(inference.inference_data.topic_id),
      networkInference: parseFloat(inference.inference_data.network_inference),
      normalizedInference: parseFloat(
        inference.inference_data.network_inference_normalized
      ),
      confidence: calculateConfidenceFromInterval(
        inference.inference_data.confidence_interval_values
      ),
      confidenceInterval: {
        values: inference.inference_data.confidence_interval_values.map((v) =>
          parseFloat(v)
        ),
        normalizedValues:
          inference.inference_data.confidence_interval_values_normalized.map((v) =>
            parseFloat(v)
          ),
        percentiles: inference.inference_data.confidence_interval_percentiles,
      },
      timestamp: inference.inference_data.timestamp,
      extraData: inference.inference_data.extra_data,
      signature: inference.signature,
    };
  } catch (error) {
    console.error(`Error fetching inference for topic ${topicId}:`, error);
    throw error;
  }
}

/**
 * Fetch multiple crypto predictions in parallel
 * Efficient way to get all price predictions at once
 */
export async function getAllCryptoPredictions() {
  try {
    const [btc8h, eth5m, eth8h] = await Promise.all([
      getBTCPricePrediction(),
      getETHPricePrediction('5m'),
      getETHPricePrediction('8h'),
    ]);

    return {
      btc: btc8h,
      eth: {
        shortTerm: eth5m,
        mediumTerm: eth8h,
      },
    };
  } catch (error) {
    console.error('Error fetching crypto predictions:', error);
    throw error;
  }
}

/**
 * Calculate confidence score from confidence interval
 * Narrower interval = higher confidence
 */
function calculateConfidenceFromInterval(intervals: string[]): number {
  if (intervals.length === 0) return 50;

  // Allora provides confidence intervals (e.g., [low, high])
  // Narrower interval = higher confidence
  const values = intervals.map((v) => parseFloat(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const midpoint = (max + min) / 2;

  // Calculate relative range (range as % of midpoint)
  const relativeRange = (range / midpoint) * 100;

  // Convert to confidence score (0-100)
  // Smaller relative range = higher confidence
  // If range is 0-5% of midpoint = 95-100% confidence
  // If range is 20%+ of midpoint = 50% confidence
  const confidence = Math.max(50, Math.min(100, 100 - relativeRange * 2.5));

  return Math.round(confidence);
}

/**
 * Convert Allora price prediction to probability for binary outcome
 * Used to map price predictions to Polymarket YES/NO markets
 */
export function convertPriceToProbability(
  predictedPrice: number,
  threshold: number,
  direction: 'above' | 'below' = 'above'
): number {
  if (direction === 'above') {
    if (predictedPrice > threshold) {
      // Calculate how confident we are it will be above
      const percentAbove = ((predictedPrice - threshold) / threshold) * 100;
      // More above = higher probability, capped at 95%
      const probability = Math.min(0.95, 0.5 + percentAbove * 0.01);
      return probability;
    } else {
      // Below threshold = lower probability
      const percentBelow = ((threshold - predictedPrice) / threshold) * 100;
      const probability = Math.max(0.05, 0.5 - percentBelow * 0.01);
      return probability;
    }
  } else {
    // Inverse logic for 'below' direction
    return 1 - convertPriceToProbability(predictedPrice, threshold, 'above');
  }
}

/**
 * Test Allora connection
 * Useful for debugging and health checks
 */
export async function testAlloraConnection() {
  try {
    console.log('🔍 Testing Allora Network connection...');

    // Test 1: Fetch topics
    const topics = await getAllAlloraTopics();
    console.log(`✅ Found ${topics.length} active topics`);

    // Test 2: Fetch BTC prediction
    const btc = await getBTCPricePrediction();
    console.log(`✅ BTC 8h prediction: $${btc.price.toFixed(2)} (confidence: ${btc.confidence}%)`);

    // Test 3: Fetch ETH prediction
    const eth = await getETHPricePrediction('5m');
    console.log(`✅ ETH 5m prediction: $${eth.price.toFixed(2)} (confidence: ${eth.confidence}%)`);

    return {
      success: true,
      topics: topics.length,
      btcPrice: btc.price,
      ethPrice: eth.price,
    };
  } catch (error) {
    console.error('❌ Allora connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export types for use in other files
export type AlloPrediction = Awaited<ReturnType<typeof getBTCPricePrediction>>;
export type AlloraTopicInference = Awaited<ReturnType<typeof getInferenceByTopic>>;
