# 💰 Trading Guide - How Polymarket Trading Works

Complete guide to understanding and using the trading system in PredictIQ.

---

## 🎯 How Prediction Markets Work

Prediction markets let you bet on real-world events:
- **YES shares** pay $1 if the event happens
- **NO shares** pay $1 if the event doesn't happen
- Prices range from $0.01 to $0.99 per share

**Example:**
- Market: "Will BTC hit $120K by July 2026?"
- YES price: $0.54 (54¢)
- NO price: $0.46 (46¢)

If you buy 100 YES shares at $0.54:
- **Cost:** $54
- **If YES wins:** You get $100 (profit: $46)
- **If NO wins:** You get $0 (loss: $54)

---

## 🔧 How Our Trading System Works

### Architecture

```
User Wallet → Sign EIP-712 Message → Polymarket CLOB → Order Matched → Position Created
     ↓                                                                        ↓
  No Gas!                                                            Recorded in DB
```

### Key Features

1. **Gasless Trading** ✅
   - No blockchain transaction required
   - Just sign a message (EIP-712)
   - Polymarket handles the rest

2. **CLOB (Central Limit Order Book)** ✅
   - Orders match against other traders
   - Better prices than AMM
   - Instant execution

3. **USDC Settlement** ✅
   - All trades in USDC (stablecoin)
   - 1:1 with USD
   - On Polygon network (low fees)

---

## 📝 Step-by-Step: Placing a Trade

### 1. Connect Wallet
- Click "Connect Wallet" in top right
- Select your wallet (MetaMask, Coinbase, etc.)
- Sign the SIWE message (no gas)

### 2. Browse Markets
- Go to Markets page
- Use search/filters to find interesting markets
- Click on a market to see details

### 3. Choose Side
- **YES** - You think the event will happen
- **NO** - You think it won't happen

### 4. Enter Amount
- Minimum: $1 USDC
- Maximum: $10,000 USDC per order
- Use preset buttons ($10, $25, $50, $100)

### 5. Review Order
The panel shows:
- **Avg Price** - Price per share
- **Shares** - How many shares you'll get
- **Potential Payout** - Max you can win
- **Potential Return** - Profit if you win

### 6. Sign Order
- Click "Buy YES" or "Buy NO"
- Your wallet opens
- Sign the message (no gas required)
- Order submits to Polymarket

### 7. Order Execution
- Order goes to CLOB
- Matches against other traders
- Usually fills instantly
- You receive confirmation

---

## 🔐 Security & Safety

### What You're Signing

When you click "Buy", you sign an **EIP-712 typed message** containing:
- Token ID (YES or NO)
- Amount (USDC)
- Price per share
- Expiration (usually GTC - Good Till Cancelled)
- Nonce (prevents replay attacks)

**This is NOT a blockchain transaction!**
- No gas fees
- No ETH required
- Just USDC for the trade

### Smart Contract Addresses

All trades go through Polymarket's audited contracts:

```
CTF Exchange: 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E
USDC (Polygon): 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```

### Permissions

When you sign:
- ✅ You authorize ONE specific trade
- ✅ Polymarket can execute that trade
- ❌ They CANNOT access other funds
- ❌ They CANNOT make other trades

---

## 💡 Trading Tips

### 1. Start Small
- Test with $1-10 first
- Understand the flow
- Then scale up

### 2. Check Liquidity
- Higher liquidity = better fills
- Look for markets with $10K+ liquidity
- Avoid thin markets

### 3. Watch the Spread
- Spread = difference between best bid and ask
- Tight spread (1-2¢) = good
- Wide spread (5¢+) = bad

### 4. Use Limit Orders
- Our system uses limit orders
- You set the price
- Order fills at that price or better

### 5. Monitor Positions
- Check Polymarket directly for live positions
- Our portfolio page shows history
- Set alerts for important markets

---

## 🤖 Automated Trading with Agents

### Agent Strategies

**1. Signal Follower**
- Follows AI-generated signals
- Trades when confidence > threshold
- Best for: Hands-off trading

**2. Whale Tracker**
- Mirrors large trades (>$100K)
- Assumes whales have info
- Best for: Following smart money

**3. Contrarian**
- Trades opposite to signals
- Fades the crowd
- Best for: Contrarian plays

### Agent Configuration

```typescript
{
  maxPositionSize: 50,      // Max $50 per trade
  minConfidence: 70,        // Only trade 70%+ signals
  maxMarketsPerRun: 3,      // Max 3 trades per run
  riskLevel: "medium"       // low | medium | high
}
```

### Agent Execution

- Runs every 30 minutes via cron
- Checks for new signals/whale events
- Places trades automatically
- Logs all activity

---

## 📊 Understanding Prices

### Price = Probability

Market prices reflect the crowd's probability estimate:
- **$0.70 YES** = 70% chance of YES
- **$0.30 NO** = 30% chance of NO

### Price Movement

Prices change based on:
- New information (news, events)
- Large trades (whale activity)
- Time to expiration
- Overall sentiment

### Arbitrage

Prices should sum to ~$1.00:
- YES $0.54 + NO $0.46 = $1.00
- If not, arbitrage opportunity exists

---

## 💸 Fees & Costs

### Trading Fees
- **Maker fee:** 0% (you provide liquidity)
- **Taker fee:** ~2% (you take liquidity)
- Fees built into price

### Network Fees
- **Signing:** $0 (no gas)
- **Withdrawing:** ~$0.01 (Polygon gas)
- **Bridging:** Varies by bridge

### Our Fees
- **Platform fee:** 0% (we don't charge)
- **Agent fee:** 0% (free to use)

---

## 🔄 Managing Positions

### View Positions
- Go to [polymarket.com](https://polymarket.com)
- Connect same wallet
- See all open positions

### Close Position
- Sell your shares on Polymarket
- Or wait for market resolution
- Winners get $1 per share

### Claim Winnings
- Automatic on Polymarket
- USDC sent to your wallet
- Usually within 24h of resolution

---

## ⚠️ Risk Warnings

### Market Risk
- You can lose your entire stake
- Markets can be wrong
- No guaranteed returns

### Liquidity Risk
- Some markets have low liquidity
- Hard to exit large positions
- Slippage on big orders

### Smart Contract Risk
- Polymarket contracts are audited
- But bugs can exist
- Never risk more than you can afford to lose

### Regulatory Risk
- Prediction markets may be restricted
- Check your local laws
- Use at your own risk

---

## 🆘 Troubleshooting

### "Insufficient USDC"
**Problem:** Not enough USDC in wallet
**Solution:** 
1. Bridge USDC to Polygon
2. Or swap MATIC → USDC on Uniswap

### "Please switch to Polygon network"
**Problem:** Wallet on wrong network
**Solution:** Click button to switch to Polygon

### "Order failed"
**Problem:** CLOB rejected order
**Reasons:**
- Price moved (market volatile)
- Insufficient liquidity
- Order too large
**Solution:** Try smaller amount or different price

### "User rejected signature"
**Problem:** You cancelled in wallet
**Solution:** Click "Buy" again and approve

### Order stuck "pending"
**Problem:** CLOB hasn't matched yet
**Solution:** 
- Wait 1-2 minutes
- Check Polymarket for status
- May need to cancel and retry

---

## 📈 Advanced Features (Coming Soon)

- [ ] Stop-loss orders
- [ ] Take-profit orders
- [ ] Portfolio analytics
- [ ] P&L tracking
- [ ] Tax reporting
- [ ] Mobile app
- [ ] Telegram alerts
- [ ] Copy trading

---

## 🎓 Learn More

- [Polymarket Docs](https://docs.polymarket.com)
- [CLOB API](https://docs.polymarket.com/#clob-api)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)
- [Prediction Markets 101](https://en.wikipedia.org/wiki/Prediction_market)

---

## 🤝 Support

Need help?
- Check browser console for errors
- Review this guide
- Check Polymarket status
- Contact support (if available)

---

Happy trading! 🚀
