/**
 * User Preferences & Risk Management System
 * Gives users full control over their trading limits and risk tolerance
 */

import { db } from "@/db/client";
import { userSettings, agents, agentTrades, positions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export interface TradingPreferences {
  // Per-Trade Limits
  maxPerTrade: number;              // Max $ per single trade (e.g., $50)
  minPerTrade: number;              // Min $ per single trade (e.g., $10)
  
  // Daily Limits
  maxDailySpend: number;            // Max $ to spend per day (e.g., $200)
  maxDailyLoss: number;             // Max $ loss per day (e.g., -$50)
  maxDailyTrades: number;           // Max number of trades per day (e.g., 10)
  
  // Period Limits (for autonomous trading)
  maxPeriodLoss: number;            // Max $ loss over period (e.g., -$100)
  periodDays: number;               // Period in days (e.g., 7 for weekly)
  
  // Stop Loss / Take Profit
  stopLossPercentage: number;       // Auto-close at X% loss (e.g., -10%)
  takeProfitPercentage: number;     // Auto-close at X% profit (e.g., +20%)
  useTrailingStop: boolean;         // Enable trailing stop loss
  trailingStopPercentage: number;   // Trail by X% (e.g., 5%)
  
  // Position Management
  maxOpenPositions: number;         // Max concurrent positions (e.g., 5)
  maxExposurePerMarket: number;     // Max % in one market (e.g., 20%)
  maxExposurePerCategory: number;   // Max % in one category (e.g., 40%)
  
  // Market Filters
  allowedCategories: string[];      // ["crypto", "sports"] or [] for all
  blockedCategories: string[];      // ["politics"] or [] for none
  minMarketLiquidity: number;       // Min liquidity to trade (e.g., $10,000)
  
  // Signal Filters
  minSignalConfidence: number;      // Min confidence to trade (e.g., 75%)
  requiredSignalConsensus: number;  // Require X signals to agree (e.g., 2)
  
  // Notifications
  notifyOnTrade: boolean;           // Notify on each trade
  notifyOnProfitableTrade: boolean; // Notify only on wins
  notifyOnLoss: boolean;            // Notify on losses
  notifyDailySummary: boolean;      // Daily summary email
  notifyWeeklySummary: boolean;     // Weekly summary email
  
  // Notification Channels
  emailNotifications: boolean;
  pushNotifications: boolean;
  telegramNotifications: boolean;
  telegramChatId?: string;
  
  // Paper Trading
  paperTradingMode: boolean;        // Use paper money (simulation)
  paperTradingBalance: number;      // Starting paper balance (e.g., $1,000)
}

export const DEFAULT_PREFERENCES: TradingPreferences = {
  // Conservative defaults
  maxPerTrade: 50,
  minPerTrade: 10,
  maxDailySpend: 200,
  maxDailyLoss: 50,
  maxDailyTrades: 10,
  maxPeriodLoss: 100,
  periodDays: 7,
  stopLossPercentage: 10,
  takeProfitPercentage: 20,
  useTrailingStop: false,
  trailingStopPercentage: 5,
  maxOpenPositions: 5,
  maxExposurePerMarket: 20,
  maxExposurePerCategory: 40,
  allowedCategories: [],
  blockedCategories: [],
  minMarketLiquidity: 10000,
  minSignalConfidence: 75,
  requiredSignalConsensus: 1,
  notifyOnTrade: true,
  notifyOnProfitableTrade: true,
  notifyOnLoss: true,
  notifyDailySummary: true,
  notifyWeeklySummary: true,
  emailNotifications: true,
  pushNotifications: false,
  telegramNotifications: false,
  paperTradingMode: true, // Start with paper trading
  paperTradingBalance: 1000,
};

/**
 * Get user's trading preferences
 */
export async function getUserPreferences(userId: string): Promise<TradingPreferences> {
  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!settings || settings.length === 0) {
    return DEFAULT_PREFERENCES;
  }

  const preferences = settings[0].preferences as any;
  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
  };
}

/**
 * Update user's trading preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<TradingPreferences>
): Promise<void> {
  const current = await getUserPreferences(userId);
  const updated = { ...current, ...preferences };

  await db
    .update(userSettings)
    .set({
      preferences: updated,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

/**
 * Check if trade is allowed based on user preferences
 */
export async function canExecuteTrade(
  userId: string,
  tradeAmount: number,
  marketCategory: string,
  signalConfidence: number
): Promise<{ allowed: boolean; reason?: string }> {
  const prefs = await getUserPreferences(userId);

  // Check per-trade limits
  if (tradeAmount > prefs.maxPerTrade) {
    return {
      allowed: false,
      reason: `Trade amount ($${tradeAmount}) exceeds max per trade ($${prefs.maxPerTrade})`,
    };
  }

  if (tradeAmount < prefs.minPerTrade) {
    return {
      allowed: false,
      reason: `Trade amount ($${tradeAmount}) below minimum ($${prefs.minPerTrade})`,
    };
  }

  // Check daily limits
  const todayStats = await getTodayStats(userId);
  
  if (todayStats.totalSpent + tradeAmount > prefs.maxDailySpend) {
    return {
      allowed: false,
      reason: `Daily spend limit reached ($${prefs.maxDailySpend})`,
    };
  }

  if (todayStats.totalLoss <= -prefs.maxDailyLoss) {
    return {
      allowed: false,
      reason: `Daily loss limit reached (-$${prefs.maxDailyLoss})`,
    };
  }

  if (todayStats.tradesCount >= prefs.maxDailyTrades) {
    return {
      allowed: false,
      reason: `Daily trade limit reached (${prefs.maxDailyTrades})`,
    };
  }

  // Check period limits
  const periodStats = await getPeriodStats(userId, prefs.periodDays);
  
  if (periodStats.totalLoss <= -prefs.maxPeriodLoss) {
    return {
      allowed: false,
      reason: `Period loss limit reached (-$${prefs.maxPeriodLoss} over ${prefs.periodDays} days)`,
    };
  }

  // Check category filters
  if (
    prefs.allowedCategories.length > 0 &&
    !prefs.allowedCategories.includes(marketCategory)
  ) {
    return {
      allowed: false,
      reason: `Category "${marketCategory}" not in allowed list`,
    };
  }

  if (prefs.blockedCategories.includes(marketCategory)) {
    return {
      allowed: false,
      reason: `Category "${marketCategory}" is blocked`,
    };
  }

  // Check signal confidence
  if (signalConfidence < prefs.minSignalConfidence) {
    return {
      allowed: false,
      reason: `Signal confidence (${signalConfidence}%) below minimum (${prefs.minSignalConfidence}%)`,
    };
  }

  return { allowed: true };
}

/**
 * Check if position should be closed based on stop loss / take profit
 */
export function shouldClosePosition(
  preferences: TradingPreferences,
  entryPrice: number,
  currentPrice: number,
  highestPrice: number, // For trailing stop
  direction: "YES" | "NO"
): { shouldClose: boolean; reason?: string } {
  const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;

  // Check stop loss
  if (Math.abs(priceChange) >= preferences.stopLossPercentage && priceChange < 0) {
    return {
      shouldClose: true,
      reason: `Stop loss triggered (${priceChange.toFixed(2)}%)`,
    };
  }

  // Check take profit
  if (priceChange >= preferences.takeProfitPercentage) {
    return {
      shouldClose: true,
      reason: `Take profit triggered (+${priceChange.toFixed(2)}%)`,
    };
  }

  // Check trailing stop
  if (preferences.useTrailingStop) {
    const dropFromHigh = ((highestPrice - currentPrice) / highestPrice) * 100;
    if (dropFromHigh >= preferences.trailingStopPercentage) {
      return {
        shouldClose: true,
        reason: `Trailing stop triggered (${dropFromHigh.toFixed(2)}% from high)`,
      };
    }
  }

  return { shouldClose: false };
}

/**
 * Get today's trading stats for user
 */
async function getTodayStats(userId: string): Promise<{
  totalSpent: number;
  totalLoss: number;
  tradesCount: number;
}> {
  // Get start of today (UTC)
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  // Get user's agents
  const userAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  if (userAgents.length === 0) {
    return { totalSpent: 0, totalLoss: 0, tradesCount: 0 };
  }

  const agentIds = userAgents.map(a => a.id);

  // Get today's trades
  const todayTrades = await db
    .select()
    .from(agentTrades)
    .where(
      and(
        gte(agentTrades.createdAt, startOfToday),
        eq(agentTrades.status, "filled")
      )
    );

  // Filter for user's agents
  const userTrades = todayTrades.filter(t => agentIds.includes(t.agentId));

  // Calculate total spent
  const totalSpent = userTrades.reduce((sum, t) => sum + t.amountUsdc, 0);

  // Calculate total loss (from closed positions)
  const todayPositions = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.status, "closed"),
        gte(positions.closedAt!, startOfToday)
      )
    );

  const userPositions = todayPositions.filter(p => agentIds.includes(p.agentId));
  
  // Calculate realized P&L (negative = loss)
  const totalPnL = userPositions.reduce((sum, p) => {
    const pnl = (p.currentPrice - p.entryPrice) * p.shares;
    return sum + pnl;
  }, 0);

  const totalLoss = totalPnL < 0 ? totalPnL : 0;

  return {
    totalSpent,
    totalLoss,
    tradesCount: userTrades.length,
  };
}

/**
 * Get period trading stats for user
 */
async function getPeriodStats(
  userId: string,
  days: number
): Promise<{
  totalLoss: number;
}> {
  // Get start of period (X days ago)
  const startOfPeriod = new Date();
  startOfPeriod.setDate(startOfPeriod.getDate() - days);

  // Get user's agents
  const userAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  if (userAgents.length === 0) {
    return { totalLoss: 0 };
  }

  const agentIds = userAgents.map(a => a.id);

  // Get period's closed positions
  const periodPositions = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.status, "closed"),
        gte(positions.closedAt!, startOfPeriod)
      )
    );

  const userPositions = periodPositions.filter(p => agentIds.includes(p.agentId));
  
  // Calculate realized P&L (negative = loss)
  const totalPnL = userPositions.reduce((sum, p) => {
    const pnl = (p.currentPrice - p.entryPrice) * p.shares;
    return sum + pnl;
  }, 0);

  const totalLoss = totalPnL < 0 ? totalPnL : 0;

  return { totalLoss };
}

/**
 * Calculate dynamic position size based on preferences and signal quality
 */
export function calculatePositionSize(
  preferences: TradingPreferences,
  signalConfidence: number,
  expectedValue: number,
  userBalance: number
): number {
  // Start with max per trade
  let size = preferences.maxPerTrade;

  // Adjust based on signal confidence
  // Higher confidence = larger position (up to max)
  const confidenceMultiplier = signalConfidence / 100;
  size = size * confidenceMultiplier;

  // Adjust based on expected value
  // Higher EV = larger position
  if (expectedValue > 15) {
    size = size * 1.2; // 20% boost for high EV
  } else if (expectedValue < 5) {
    size = size * 0.8; // 20% reduction for low EV
  }

  // Ensure within user's limits
  size = Math.max(preferences.minPerTrade, Math.min(preferences.maxPerTrade, size));

  // Ensure user has enough balance
  size = Math.min(size, userBalance);

  return Math.round(size * 100) / 100;
}
