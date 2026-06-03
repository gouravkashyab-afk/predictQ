/**
 * Multi-Channel Notification System
 * Supports: Email, Push Notifications, Telegram
 */

import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserPreferences } from "./user-preferences";

export interface NotificationPayload {
  userId: string;
  type: "trade" | "profit" | "loss" | "daily_summary" | "weekly_summary" | "alert";
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Send notification through all enabled channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const prefs = await getUserPreferences(payload.userId);

  // Check if user wants this type of notification
  const shouldNotify = checkNotificationPreferences(payload.type, prefs);
  if (!shouldNotify) {
    console.log(`Skipping notification for ${payload.userId} (preferences)`);
    return;
  }

  // Send through all enabled channels
  const promises: Promise<void>[] = [];

  if (prefs.emailNotifications) {
    promises.push(sendEmailNotification(payload));
  }

  if (prefs.pushNotifications) {
    promises.push(sendPushNotification(payload));
  }

  if (prefs.telegramNotifications && prefs.telegramChatId) {
    promises.push(sendTelegramNotification(payload, prefs.telegramChatId));
  }

  await Promise.allSettled(promises);
}

/**
 * Check if user wants this type of notification
 */
function checkNotificationPreferences(
  type: NotificationPayload["type"],
  prefs: any
): boolean {
  switch (type) {
    case "trade":
      return prefs.notifyOnTrade;
    case "profit":
      return prefs.notifyOnProfitableTrade;
    case "loss":
      return prefs.notifyOnLoss;
    case "daily_summary":
      return prefs.notifyDailySummary;
    case "weekly_summary":
      return prefs.notifyWeeklySummary;
    case "alert":
      return true; // Always send alerts
    default:
      return true;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  try {
    // Get user email
    const user = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, payload.userId))
      .limit(1);

    if (!user || user.length === 0) {
      console.warn("User not found for email notification");
      return;
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Email to ${payload.userId}:`, {
      subject: payload.title,
      body: payload.message,
    });

    // Example integration:
    // await sendgrid.send({
    //   to: user.email,
    //   subject: payload.title,
    //   html: formatEmailTemplate(payload)
    // });
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

/**
 * Send push notification (in-app)
 */
async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  try {
    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
    console.log(`🔔 Push notification to ${payload.userId}:`, {
      title: payload.title,
      body: payload.message,
    });

    // Example integration:
    // await firebase.messaging().send({
    //   token: userDeviceToken,
    //   notification: {
    //     title: payload.title,
    //     body: payload.message
    //   },
    //   data: payload.data
    // });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(
  payload: NotificationPayload,
  chatId: string
): Promise<void> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.warn("Telegram bot token not configured");
      return;
    }

    const message = `*${payload.title}*\n\n${payload.message}`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Telegram API error");
    }

    console.log(`📱 Telegram sent to ${chatId}`);
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}

/**
 * Notify on trade execution
 */
export async function notifyTradeExecuted(params: {
  userId: string;
  agentName: string;
  question: string;
  direction: "YES" | "NO";
  amount: number;
  confidence: number;
  isSimulated: boolean;
}): Promise<void> {
  const emoji = params.isSimulated ? "🧪" : "💰";
  const mode = params.isSimulated ? "Simulated" : "Real";

  await sendNotification({
    userId: params.userId,
    type: "trade",
    title: `${emoji} ${mode} Trade Executed`,
    message: `${params.agentName} placed a ${params.direction} bet on:\n"${params.question}"\n\nAmount: $${params.amount}\nConfidence: ${params.confidence}%`,
    data: params,
  });
}

/**
 * Notify on profitable trade
 */
export async function notifyProfitableTrade(params: {
  userId: string;
  agentName: string;
  question: string;
  profit: number;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: "profit",
    title: `🎉 Profit Made!`,
    message: `${params.agentName} just made +$${params.profit.toFixed(2)}!\n\n"${params.question}"`,
    data: params,
  });
}

/**
 * Notify on loss
 */
export async function notifyLoss(params: {
  userId: string;
  agentName: string;
  question: string;
  loss: number;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: "loss",
    title: `📉 Loss Recorded`,
    message: `${params.agentName} lost -$${Math.abs(params.loss).toFixed(2)} on:\n"${params.question}"`,
    data: params,
  });
}

/**
 * Notify daily summary
 */
export async function notifyDailySummary(params: {
  userId: string;
  totalPnL: number;
  trades: number;
  wins: number;
  losses: number;
  bestAgent: string;
  worstAgent: string;
}): Promise<void> {
  const emoji = params.totalPnL > 0 ? "📈" : "📉";

  await sendNotification({
    userId: params.userId,
    type: "daily_summary",
    title: `${emoji} Your Daily Summary`,
    message: `Today's P&L: ${params.totalPnL > 0 ? "+" : ""}$${params.totalPnL.toFixed(2)}\n\nTrades: ${params.trades} (${params.wins}W / ${params.losses}L)\n\nBest: ${params.bestAgent}\nWorst: ${params.worstAgent}`,
    data: params,
  });
}

/**
 * Notify weekly summary
 */
export async function notifyWeeklySummary(params: {
  userId: string;
  totalPnL: number;
  trades: number;
  winRate: number;
  bestStrategy: string;
}): Promise<void> {
  const emoji = params.totalPnL > 0 ? "🚀" : "⚠️";

  await sendNotification({
    userId: params.userId,
    type: "weekly_summary",
    title: `${emoji} Your Weekly Summary`,
    message: `This Week's P&L: ${params.totalPnL > 0 ? "+" : ""}$${params.totalPnL.toFixed(2)}\n\nTrades: ${params.trades}\nWin Rate: ${params.winRate.toFixed(1)}%\n\nBest Strategy: ${params.bestStrategy}`,
    data: params,
  });
}

/**
 * Notify alert (limits reached, etc.)
 */
export async function notifyAlert(params: {
  userId: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}): Promise<void> {
  const emoji =
    params.severity === "critical"
      ? "🚨"
      : params.severity === "warning"
      ? "⚠️"
      : "ℹ️";

  await sendNotification({
    userId: params.userId,
    type: "alert",
    title: `${emoji} ${params.title}`,
    message: params.message,
    data: params,
  });
}
