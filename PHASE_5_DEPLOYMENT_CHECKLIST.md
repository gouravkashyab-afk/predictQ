# Phase 5: Deployment Checklist

## Pre-Deployment Checklist

Use this checklist before deploying Phase 5 to production.

---

## ✅ Code Implementation

### Core Libraries
- [x] `src/lib/polymarket-client.ts` - Polymarket CLOB API client
- [x] `src/lib/wallet-manager.ts` - Wallet signing + safety checks
- [x] `src/lib/agent-engine.ts` - Updated with real trading support

### API Endpoints
- [x] `POST /api/agents/[id]/toggle-trading` - Enable/disable real trading
- [x] `GET /api/wallet/balance` - Get USDC balance
- [x] `POST /api/trade/execute` - Manual trade execution

### UI Components
- [x] `src/components/trading/RealTradingToggle.tsx` - Toggle with warnings
- [x] `src/components/trading/WalletBalance.tsx` - Balance display
- [x] `src/components/ui/switch.tsx` - Toggle switch
- [x] `src/components/ui/alert.tsx` - Alert component

### Database
- [x] Schema updated with `orderHash` field
- [x] Migration SQL created (`add_real_trading_support.sql`)
- [ ] Migration applied to database

---

## 🔧 Configuration

### Environment Variables
- [ ] `NEXT_PUBLIC_POLYGON_RPC` - Polygon RPC URL (Alchemy/Infura)
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` - Privy app ID (production)
- [ ] `PRIVY_APP_SECRET` - Privy secret key (production)
- [ ] `DATABASE_URL` - PostgreSQL connection string

**Example `.env.local`:**
```bash
# Polygon RPC
NEXT_PUBLIC_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Privy (for production wallet management)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Database Migration
```bash
# Apply migration
psql $DATABASE_URL < add_real_trading_support.sql

# Verify
psql $DATABASE_URL -c "\d agent_trades"
# Should show: order_hash column
```

---

## 🧪 Testing

### 1. Simulation Mode (Required)
- [ ] Create test agent with `simulateOnly: true`
- [ ] Run cron job: `GET /api/cron`
- [ ] Verify trades have `status="simulated"`
- [ ] Verify no real money spent
- [ ] Check agent logs for decision trail

**Test Command:**
```bash
# Create agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "strategy": "signal_follower",
    "config": {
      "maxPositionSize": 50,
      "minConfidence": 75,
      "simulateOnly": true
    }
  }'

# Run cron
curl http://localhost:3000/api/cron

# Check trades
curl http://localhost:3000/api/agents/{agentId}/trades
```

### 2. Testnet Trading (Recommended)
- [ ] Get testnet USDC on Polygon Mumbai
- [ ] Update `NEXT_PUBLIC_POLYGON_RPC` to Mumbai RPC
- [ ] Enable real trading: `simulateOnly: false`
- [ ] Run cron job
- [ ] Verify trades have `status="pending"` with `orderHash`
- [ ] Check Polymarket testnet for order

**Mumbai RPC:**
```bash
NEXT_PUBLIC_POLYGON_RPC=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
```

### 3. Safety Mechanisms
- [ ] Test agent permission checks
- [ ] Test spending limit enforcement
- [ ] Test insufficient balance fallback
- [ ] Test emergency stop functionality
- [ ] Test automatic fallback to simulation on errors

**Safety Tests:**
```bash
# Test emergency stop
curl -X POST http://localhost:3000/api/agents/emergency-stop \
  -H "x-user-id: {userId}"

# Verify all agents paused
curl http://localhost:3000/api/agents

# Test balance check
curl http://localhost:3000/api/wallet/balance \
  -H "x-user-id: {userId}"
```

### 4. UI Components
- [ ] Test `RealTradingToggle` component
- [ ] Verify warning appears when enabling
- [ ] Test `WalletBalance` component
- [ ] Verify balance refresh works
- [ ] Test manual trade execution form

---

## 🔒 Security Checklist

### Critical (MUST DO before production)
- [ ] **Integrate Privy SDK** for wallet management
  - Replace stubbed `getUserWalletKey()` with Privy
  - Never store raw private keys
  - Use Privy embedded wallets
- [ ] **Add rate limiting** to API endpoints
  - Limit requests per IP/user
  - Prevent abuse of trade execution
- [ ] **Implement audit logging**
  - Log all real trades to separate table
  - Track all wallet access attempts
  - Monitor for suspicious activity
- [ ] **Encrypt sensitive data**
  - Use encryption at rest for any keys
  - Use HTTPS for all API calls
  - Secure environment variables

### Recommended
- [ ] Add webhook signature verification (Polymarket)
- [ ] Implement 2FA for enabling real trading
- [ ] Add transaction signing confirmation UI
- [ ] Set up monitoring/alerts for large trades
- [ ] Implement IP whitelisting for admin endpoints

### Code Review
- [ ] Review wallet signing logic
- [ ] Verify spending limit calculations
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify input validation on all endpoints
- [ ] Review error handling (no sensitive data leaked)

---

## 📊 Monitoring Setup

### Application Monitoring
- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Add performance monitoring (New Relic, DataDog, etc.)
- [ ] Create dashboards for key metrics:
  - Total trades executed
  - Success/failure rate
  - Average trade size
  - Agent performance (P&L)

### Database Monitoring
- [ ] Monitor `agentTrades` table growth
- [ ] Set up alerts for failed trades
- [ ] Track order hash resolution rate
- [ ] Monitor query performance

### Alerts
- [ ] Alert on failed trades (status="failed")
- [ ] Alert on large trades (>$500)
- [ ] Alert on spending limit exceeded
- [ ] Alert on insufficient balance
- [ ] Alert on agent crashes

**Example Alert Rules:**
```sql
-- Failed trades in last hour
SELECT COUNT(*) FROM agent_trades 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Large trades today
SELECT * FROM agent_trades 
WHERE amount_usdc > 500 
AND created_at > CURRENT_DATE;
```

---

## 🚀 Deployment Steps

### Step 1: Pre-Production
1. [ ] Run all tests (simulation + testnet)
2. [ ] Review security checklist
3. [ ] Update environment variables
4. [ ] Apply database migration
5. [ ] Deploy to staging environment
6. [ ] Test all features in staging

### Step 2: Production Deploy
1. [ ] Backup database
2. [ ] Apply migrations
3. [ ] Deploy code to production
4. [ ] Verify environment variables
5. [ ] Test basic functionality (simulation only)
6. [ ] Monitor error logs

### Step 3: Gradual Rollout
1. [ ] Start with simulation mode only
2. [ ] Enable real trading for 1-2 test users
3. [ ] Monitor for 24-48 hours
4. [ ] Gradually enable for more users
5. [ ] Monitor performance and errors

### Step 4: Post-Deploy Verification
- [ ] Test simulation mode in production
- [ ] Verify cron job is running
- [ ] Check agent logs are being created
- [ ] Test manual trade execution (small amount)
- [ ] Verify emergency stop works
- [ ] Monitor for 7 days before full rollout

---

## 📈 Performance Benchmarks

Track these metrics post-deployment:

### Agent Performance
- Total trades executed
- Simulated vs Real trades ratio
- Average confidence score
- Win rate (when tracking implemented)
- Average trade size
- Total volume traded

### System Performance
- API response time (<500ms target)
- Database query time (<100ms target)
- Cron job duration (<30s target)
- Error rate (<1% target)

### User Metrics
- Number of agents created
- Number of agents with real trading enabled
- Average agent lifespan
- User retention rate

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Privy Integration Incomplete**
   - Wallet management is stubbed
   - Uses temporary test keys in development
   - **MUST be implemented before production**

2. **Order Status Tracking**
   - Orders submitted but status not tracked
   - Need webhook from Polymarket
   - Manual status checks available via API

3. **Daily Limits**
   - Logic exists but not fully enforced
   - Need to track daily trade totals
   - Will be implemented in Phase 6

4. **P&L Calculation**
   - Not yet tracking realized profits
   - Will be added with order status tracking

### Workarounds
- **Privy:** Use testnet until integration complete
- **Order Status:** Manually check via Polymarket API
- **Daily Limits:** Monitor agent logs manually
- **P&L:** Calculate manually from trade history

---

## 📞 Emergency Procedures

### If Something Goes Wrong

#### 1. High Priority (Money at Risk)
```bash
# IMMEDIATELY stop all agents
curl -X POST http://localhost:3000/api/agents/emergency-stop \
  -H "x-user-id: {userId}"

# Verify all agents stopped
curl http://localhost:3000/api/agents | jq '.[] | {id, status}'
# Should show status="paused" for all
```

#### 2. Medium Priority (Errors but No Money at Risk)
- Review agent logs for errors
- Check database for failed trades
- Verify environment variables
- Restart affected agents only

#### 3. Low Priority (Performance Issues)
- Check cron job timing
- Review database query performance
- Monitor API response times
- Scale infrastructure if needed

### Emergency Contacts
- **Database Admin:** [Contact]
- **Infrastructure:** [Contact]
- **Security Team:** [Contact]
- **On-Call Engineer:** [Contact]

---

## 🎯 Success Criteria

Phase 5 is successfully deployed when:

- [x] All code implemented and tested
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Simulation mode working in production
- [ ] Real trading tested on testnet
- [ ] Security review completed
- [ ] Privy integration complete (production only)
- [ ] Monitoring and alerts set up
- [ ] Documentation updated
- [ ] Team trained on emergency procedures

---

## 📚 Documentation

Ensure these docs are up-to-date:

- [x] `PHASE_5_REAL_TRADING.md` - Technical documentation
- [x] `PHASE_5_COMPLETE.md` - Status and features
- [x] `AGENT_INFO_DISPLAY.md` - UI implementation guide
- [x] `README_PHASE_5.md` - Quick start guide
- [x] `COBOT_COMPARISON.md` - Feature comparison
- [x] `PHASE_5_DEPLOYMENT_CHECKLIST.md` - This file
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Runbook for operations team

---

## ✅ Final Sign-Off

Before going to production:

### Development Lead
- [ ] Code review complete
- [ ] All tests passing
- [ ] No critical bugs

### Security Team
- [ ] Security review complete
- [ ] Privy integration verified
- [ ] Rate limiting in place
- [ ] Audit logging implemented

### Operations Team
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Runbook reviewed
- [ ] Emergency procedures tested

### Product Team
- [ ] Features tested
- [ ] UI/UX verified
- [ ] Documentation complete
- [ ] User guides created

---

## 🎉 Next Steps After Deployment

1. **Monitor closely for 7 days**
   - Check logs daily
   - Review all trades
   - Monitor error rates

2. **Collect feedback**
   - User experience
   - Performance issues
   - Feature requests

3. **Plan Phase 6**
   - Order status tracking
   - Position management
   - Advanced analytics

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Verified By:** _____________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
