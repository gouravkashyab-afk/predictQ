# Telegram Bot Setup Guide

## Overview

Enable Telegram notifications so users get instant alerts on their phone when trades execute, profits are made, or limits are reached.

---

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Choose a name for your bot (e.g., "MyTradingBot")
4. Choose a username (e.g., "my_trading_bot")
5. BotFather will give you a **Bot Token** like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. Copy this token!

---

## Step 2: Add Token to Environment

Add to `.env.local`:

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## Step 3: User Gets Their Chat ID

Users need to find their Chat ID to receive notifications:

1. User opens Telegram
2. Search for **@userinfobot**
3. Start a chat with the bot
4. Bot will reply with user's Chat ID (e.g., `123456789`)
5. User enters this Chat ID in the app settings

---

## Step 4: Test the Bot

### Option A: From UI

Users can test notifications in settings:

```tsx
<button onClick={testTelegramNotification}>
  Test Telegram Notification
</button>
```

### Option B: Manual Test

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "123456789",
    "text": "🎉 Test notification from your trading bot!",
    "parse_mode": "Markdown"
  }'
```

---

## How It Works

### 1. User Enables Telegram Notifications

```
User Settings:
├─ Enable Telegram Notifications: ✅
├─ Telegram Chat ID: 123456789
└─ Save
```

### 2. System Sends Notification

```typescript
// When trade executes
await notifyTradeExecuted({
  userId: "user-123",
  agentName: "BTC Follower",
  question: "Will BTC hit $100K?",
  direction: "YES",
  amount: 50,
  confidence: 85,
  isSimulated: false,
});
```

### 3. User Receives on Phone

```
📱 Telegram Message:

💰 Real Trade Executed

BTC Follower placed a YES bet on:
"Will BTC hit $100K?"

Amount: $50
Confidence: 85%
```

---

## Message Types

### Trade Executed
```
💰 Real Trade Executed
BTC Follower placed a YES bet on:
"Will BTC hit $100K?"

Amount: $50
Confidence: 85%
```

### Profitable Trade
```
🎉 Profit Made!
BTC Follower just made +$12.50!

"Will BTC hit $100K?"
```

### Loss
```
📉 Loss Recorded
BTC Follower lost -$5.00 on:
"Will BTC hit $100K?"
```

### Daily Summary
```
📈 Your Daily Summary

Today's P&L: +$25.50

Trades: 8 (6W / 2L)

Best: BTC Follower
Worst: ETH Tracker
```

### Alert (Limit Reached)
```
⚠️ Daily Loss Limit Reached

You've lost $50 today (your limit).
Trading paused for today.
```

---

## Customization

### Custom Messages

Edit `src/lib/notification-system.ts`:

```typescript
export async function notifyTradeExecuted(params) {
  const emoji = params.isSimulated ? "🧪" : "💰";
  const mode = params.isSimulated ? "Simulated" : "Real";

  // Customize message here
  const message = `${emoji} ${mode} Trade Executed\n\n` +
    `${params.agentName} placed a ${params.direction} bet on:\n` +
    `"${params.question}"\n\n` +
    `Amount: $${params.amount}\n` +
    `Confidence: ${params.confidence}%`;
    
  await sendTelegramNotification({...}, chatId);
}
```

### Add Buttons (Inline Keyboard)

```typescript
await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "View Details", url: `https://yourapp.com/trades/${tradeId}` },
          { text: "Stop Agent", callback_data: `stop_${agentId}` }
        ]
      ]
    }
  }),
});
```

---

## Telegram API Reference

### Send Message

```bash
POST https://api.telegram.org/bot<TOKEN>/sendMessage

{
  "chat_id": "123456789",
  "text": "Your message here",
  "parse_mode": "Markdown"  // or "HTML"
}
```

### Formatting

**Markdown:**
```
*bold*
_italic_
`code`
[link](https://example.com)
```

**HTML:**
```
<b>bold</b>
<i>italic</i>
<code>code</code>
<a href="https://example.com">link</a>
```

---

## Security Best Practices

1. **Never expose bot token publicly**
   - Store in `.env.local`
   - Never commit to git
   - Use environment variables

2. **Validate Chat IDs**
   - Only send to known users
   - Verify user owns the chat ID

3. **Rate Limiting**
   - Telegram allows ~30 messages/second
   - For multiple users, implement queue

4. **Error Handling**
   - Handle "chat not found" errors
   - Handle "blocked by user" errors
   - Retry failed messages

---

## Troubleshooting

### "Chat not found"
- User hasn't started a chat with the bot
- Ask user to send `/start` to the bot first

### "Blocked by user"
- User blocked the bot
- Disable Telegram notifications for this user

### "Invalid token"
- Check bot token in `.env.local`
- Make sure no extra spaces

### Messages not received
- Verify Chat ID is correct
- Test with manual curl command
- Check bot token is valid

---

## Advanced Features

### Commands

Users can send commands to the bot:

```typescript
// Set up webhook to receive messages
POST https://api.telegram.org/bot<TOKEN>/setWebhook
{
  "url": "https://yourapp.com/api/telegram/webhook"
}

// Handle commands
if (message.text === "/status") {
  // Send agent status
}
if (message.text === "/stop") {
  // Stop all agents
}
```

### Rich Media

```typescript
// Send photo
await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
  body: JSON.stringify({
    chat_id: chatId,
    photo: "https://yourapp.com/chart.png",
    caption: "Your P&L Chart"
  })
});

// Send document
await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
  body: JSON.stringify({
    chat_id: chatId,
    document: "https://yourapp.com/report.pdf",
    caption: "Weekly Report"
  })
});
```

---

## Example Implementation

### User Flow

```
1. User goes to Settings
2. Enables "Telegram Notifications"
3. Clicks "Get Chat ID"
4. Opens @userinfobot in Telegram
5. Copies Chat ID: 123456789
6. Pastes in app
7. Clicks "Test Notification"
8. Receives test message on phone ✅
9. Saves settings
10. Now gets all trade notifications!
```

### Code Flow

```typescript
// 1. User saves preferences
await updateUserPreferences(userId, {
  telegramNotifications: true,
  telegramChatId: "123456789"
});

// 2. Agent executes trade
await executeTrade(agent, signal, amount, direction);

// 3. Notification system checks preferences
const prefs = await getUserPreferences(userId);
if (prefs.telegramNotifications && prefs.telegramChatId) {
  // 4. Send Telegram message
  await sendTelegramNotification({
    userId,
    type: "trade",
    title: "Trade Executed",
    message: "..."
  }, prefs.telegramChatId);
}
```

---

## Summary

✅ **Easy Setup**: 5 minutes to create bot
✅ **Instant Notifications**: Real-time alerts on phone
✅ **Multiple Events**: Trades, profits, losses, summaries
✅ **Customizable**: Format messages however you want
✅ **Secure**: Token stored in environment
✅ **Reliable**: Telegram's infrastructure

---

## Next Steps

1. Create bot with @BotFather
2. Add token to `.env.local`
3. Test manual notification
4. Update UI to help users get Chat ID
5. Enable in production!

**Telegram notifications = Users stay engaged!** 📱🚀
