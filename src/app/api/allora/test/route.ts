/**
 * Test Allora Network Connection
 * GET /api/allora/test
 * 
 * Tests connection to Allora Network and fetches sample predictions
 */

import { NextResponse } from 'next/server';
import {
  testAlloraConnection,
  getAllCryptoPredictions,
  getAllAlloraTopics,
} from '@/lib/allora-client';

export async function GET() {
  try {
    console.log('🧪 Testing Allora Network integration...');

    // Run connection test
    const connectionTest = await testAlloraConnection();

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: connectionTest.error,
          message: 'Failed to connect to Allora Network',
        },
        { status: 500 }
      );
    }

    // Fetch all crypto predictions
    const predictions = await getAllCryptoPredictions();

    // Fetch available topics
    const topics = await getAllAlloraTopics();

    return NextResponse.json({
      success: true,
      message: 'Allora Network connection successful!',
      data: {
        predictions: {
          btc: {
            price: predictions.btc.price,
            confidence: predictions.btc.confidence,
            timeframe: predictions.btc.timeframe,
            confidenceInterval: predictions.btc.confidenceInterval,
          },
          eth: {
            shortTerm: {
              price: predictions.eth.shortTerm.price,
              confidence: predictions.eth.shortTerm.confidence,
              timeframe: predictions.eth.shortTerm.timeframe,
            },
            mediumTerm: {
              price: predictions.eth.mediumTerm.price,
              confidence: predictions.eth.mediumTerm.confidence,
              timeframe: predictions.eth.mediumTerm.timeframe,
            },
          },
        },
        topics: {
          total: topics.length,
          active: topics.filter((t) => t.is_active).length,
          sample: topics.slice(0, 5).map((t) => ({
            id: t.topic_id,
            name: t.topic_name,
            description: t.description,
            workerCount: t.worker_count,
            reputerCount: t.reputer_count,
          })),
        },
        stats: {
          chain: process.env.ALLORA_CHAIN || 'mainnet',
          hasApiKey: !!process.env.ALLORA_API_KEY,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('❌ Allora test endpoint error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test Allora Network connection',
      },
      { status: 500 }
    );
  }
}
