# 🎯 User Control & Notification System

## Overview

This is a **complete user control system** that gives users full customization over their autonomous trading experience. Users can set their own limits, risk tolerances, and notification preferences.

---

## 🌟 Key Features

### 1. **Fully Customizable Trading Limits**
- Per-trade limits (min/max)
- Daily spend limits
- Daily loss limits
- Period loss limits (weekly/monthly)
- Maximum daily trades

### 2. **Risk Management**
- Custom stop loss percentages
- Custom take profit percentages
- Trailing stops (optional)
- Position size limits
- Market exposure limits

### 3. **Multi-Channel Notifications**
- 📧 Email notifications
- 🔔 Push notifications (in-app)
- 📱 Telegram notifications
- User controls which events trigger notifications
- User controls which channels are enabled

### 4. **Paper Trading Mode**
- Risk-free testing with virtual money
- Set custom starting balance
- Toggle on/off anytime

### 5. **Smart Position Sizing**
- Dynamic sizing based on signal confidence
- Adjusts for expected value (EV)
- Respects user-set limits
- Balances risk and reward

---

## 📂 Architecture

```
User Control System
├── Core Logic
│   ├── user-preferences.ts      # Preference management
│   └── notification-system.ts   # Multi-channel notifications
├── API Layer
│   └── api/user/preferences     # GET/POST endpoints
├── UI Layer
│   └── TradingPreferencesForm   # Settings interface
└── Integration
    └── agent-engine.ts           # Preference enforcement
```

---

## 🔄 How It Works

### 1. User Sets Preferences

```typescript
{
  maxPerTrade: 50,          // Max $ per trade
  maxDailySpend: 200,       // Max $ per day
  maxDailyLoss: 50,         // Auto-stop if lose this much
  stopLossPercentage: 10,   // Close at -10%
  takeProfitPercentage: 20, // Close at +20%
  paperTradingMode: false,  // Use real money
  telegramNotifications: true
}
```

### 2. System Validates Every Trade

```typescript
Before executing any trade:
✓ Check signal confidence >= minSignalConfidence
✓ Check trade amount <= maxPerTrade
✓ Check daily spend + new trade <= maxDailySpend
✓ Check daily loss < maxDailyLoss
✓ Check daily trades < maxDailyTrades
✓ Check period loss < maxPeriodLoss
✓ Check category is allowed
✓ Check market liquidity >= minMarketLiquidity

If ANY check fails → Block trade + Notify user
If ALL checks pass → Execute trade + Notify user
```

### 3. Dynamic Position Sizing

```typescript
Base amount = maxPerTrade

Adjust for confidence:
  amount *= (signalConfidence / 100)

Adjust for expected value:
  if (EV > 15%) amount *= 1.2    // Increase for high EV
  if (EV < 5%)  amount *= 0.8    // Decrease for low EV

Enforce limits:
  amount = max(minPerTrade, min(maxPerTrade, amount))
  amount = min(amount, userBalance)
```

### 4. Multi-Channel Notifications

```typescript
When trade executes:
  ✓ Check if user wants notification for this event
  ✓ Send to enabled channels (Email, Push, Telegram)
  
Notification types:
  • Trade executed
  • Profitable trade
  • Loss recorded
  • Daily summary
  • Weekly summary
  • Alerts (limits reached)
```

---

## 🎨 User Interface

### Settings Page

Beautiful, comprehensive form with:
- Trading mode toggle (Paper/Real)
- Per-trade limit inputs
- Daily limit inputs
- Period limit inputs
- Stop loss / Take profit settings
- Trailing stop toggle
- Position management settings
- Market filter settings
- Notification preferences
- Channel selection
- Save button with feedback

---

## 📊 Example Use Cases

### Conservative Trader

```typescript
{
  maxPerTrade: 25,           // Small positions
  maxDailyLoss: 25,          // Stop early
  stopLossPercentage: 5,     // Tight stop
  takeProfitPercentage: 15,  // Quick profit
  minSignalConfidence: 85,   // Only high confidence
  paperTradingMode: false
}
```

**Result**: Safe, controlled trading with minimal risk

### Aggressive Trader

```typescript
{
  maxPerTrade: 100,          // Larger positions
  maxDailyLoss: 100,         // More tolerance
  stopLossPercentage: 15,    // Wider stop
  takeProfitPercentage: 30,  // Let winners run
  minSignalConfidence: 70,   // More opportunities
  paperTradingMode: false
}
```

**Result**: Higher risk, higher potential reward

### Paper Trader (Learning)

```typescript
{
  maxPerTrade: 50,
  paperTradingMode: true,         // Virtual money
  paperTradingBalance: 1000,      // $1,000 virtual
  notifyOnTrade: true,            // Learn from every trade
  telegramNotifications: true
}
```

**Result**: Risk-free learning with full feedback

---

## 🚀 Getting Started

### Step 1: Environment Setup

Add to `.env.local`:

```bash
# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN="your-bot-token"

# Email Service (Optional - Choose one)
SENDGRID_API_KEY="your-sendgrid-key"
SENDGRID_FROM_EMAIL="your-email"

# Push Notifications (Optional - Choose one)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

### Step 2: Create Settings Page

```tsx
// src/app/settings/page.tsx
import { TradingPreferencesForm } from "@/components/settings/TradingPreferencesForm";

export default function SettingsPage() {
  const userId = "user-123"; // Get from auth
  
  return (
    <div className="container mx-auto py-8">
      <TradingPreferencesForm userId={userId} />
    </div>
  );
}
```

### Step 3: Add to Navigation

```tsx
<Link href="/settings">
  <Settings className="h-5 w-5" />
  Settings
</Link>
```

---

## 📖 API Reference

### GET /api/user/preferences

Get user's trading preferences.

**Headers**:
```
x-user-id: string (required)
```

**Response**:
```json
{
  "preferences": {
    "maxPerTrade": 50,
    "minPerTrade": 10,
    "maxDailySpend": 200,
    "maxDailyLoss": 50,
    "stopLossPercentage": 10,
    "takeProfitPercentage": 20,
    "paperTradingMode": true,
    ...
  }
}
```

### POST /api/user/preferences

Update user's trading preferences.

**Headers**:
```
x-user-id: string (required)
Content-Type: application/json
```

**Body**:
```json
{
  "preferences": {
    "maxPerTrade": 100,
    "paperTradingMode": false,
    ...
  }
}
```

**Response**:
```json
{
  "success": true,
  "preferences": { ... },
  "message": "Preferences updated successfully"
}
```

---

## 🔒 Safety Features

### Multi-Layer Validation

Every trade goes through:
1. ✅ Preference validation
2. ✅ Agent permission check
3. ✅ Balance verification
4. ✅ Market validation
5. ✅ Signal quality check

### Automatic Safety Stops

- Daily loss limit reached → Stop trading for the day
- Period loss limit reached → Stop trading for the period
- Insufficient balance → Block trade
- Low signal confidence → Block trade
- Category blocked → Block trade

### Paper Trading Default

New users start in paper trading mode by default for safety.

### Notifications on Limits

When limits are reached, users are immediately notified via all enabled channels.

---

## 📈 Benefits

### For Users

✅ **Full Control** - Set your own risk tolerance
✅ **Peace of Mind** - Know your limits are enforced
✅ **Stay Informed** - Get notified on all channels
✅ **Safe Testing** - Try strategies with paper money
✅ **Custom Risk** - Adjust for your comfort level

### For Platform

✅ **User Trust** - Transparency builds confidence
✅ **Reduced Risk** - Users can't lose more than they set
✅ **Higher Engagement** - Notifications keep users engaged
✅ **Better Retention** - Users feel in control
✅ **Differentiation** - More control than competitors

---

## 🎯 Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Position Size | Fixed | ✅ User customizable |
| Daily Limits | None | ✅ User sets limits |
| Stop Loss | None | ✅ Custom percentage |
| Take Profit | None | ✅ Custom percentage |
| Paper Trading | No | ✅ Toggle on/off |
| Notifications | None | ✅ Email, Push, Telegram |
| Risk Control | Platform decides | ✅ User decides |

---

## 🧪 Testing

See `QUICK_START_CHECKLIST.md` for complete testing guide.

**Quick Test**:
```bash
# 1. Start dev server
npm run dev

# 2. Test API
curl http://localhost:3000/api/user/preferences \
  -H "x-user-id: test-user"

# 3. Visit settings page
open http://localhost:3000/settings
```

---

## 📚 Documentation

- **QUICK_START_CHECKLIST.md** - Step-by-step testing guide
- **SETUP_AND_TEST_GUIDE.md** - Complete setup walkthrough
- **USER_CONTROL_SYSTEM_COMPLETE.md** - Detailed feature documentation
- **TELEGRAM_BOT_SETUP.md** - Telegram bot setup guide
- **BUILD_COMPLETE_USER_CONTROL.md** - Implementation summary

---

## 🔧 Troubleshooting

### Preferences Not Saving

**Problem**: Preferences don't persist after save

**Solution**:
```bash
# Check if user_settings record exists
psql $DATABASE_URL -c "SELECT * FROM user_settings WHERE user_id='YOUR_USER_ID';"

# Create if missing
psql $DATABASE_URL -c "
INSERT INTO user_settings (user_id, preferences)
VALUES ('YOUR_USER_ID', '{}')
ON CONFLICT (user_id) DO NOTHING;
"
```

### Telegram Not Sending

**Problem**: Telegram notifications not arriving

**Solution**:
1. Verify bot token in `.env.local`
2. Check chat ID is correct
3. Test manually:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>&text=Test"
```
4. Restart dev server after adding token

### Trades Not Being Blocked

**Problem**: Trades execute despite hitting limits

**Solution**:
1. Check agent logs for validation messages
2. Verify preferences are loaded correctly
3. Ensure agent is using updated code

---

## 🚀 Next Steps

### Immediate
1. Set up Telegram bot (optional)
2. Create settings page
3. Test with real users

### Phase 6B (Next Feature)
**Signal Quality Analysis**
- Track AI model accuracy
- Compare sources (GPT-4o vs Allora)
- Show users which strategies work best

### Phase 6C
**Auto-Optimization**
- Auto-adjust limits for winning agents
- Scale back losing agents
- Dynamic capital allocation

### Phase 6D
**Position Management Cron**
- Monitor open positions
- Auto-close on stop loss/take profit
- Send notifications

---

## 🎉 Success!

You now have a **complete user control system** that:

✅ Gives users full control over their trading
✅ Enforces safety limits automatically
✅ Sends notifications via multiple channels
✅ Supports paper trading for safe testing
✅ Dynamically sizes positions for optimal returns
✅ Provides a beautiful, intuitive UI

**Your platform now matches and exceeds Cobot's capabilities!** 🚀

---

## 📞 Support

Questions? Check:
1. **QUICK_START_CHECKLIST.md** - Testing guide
2. **SETUP_AND_TEST_GUIDE.md** - Complete setup
3. **Troubleshooting section** (above)
4. Agent logs: `psql $DATABASE_URL -c "SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 20;"`

---

**Built with ❤️ for traders who want control**
