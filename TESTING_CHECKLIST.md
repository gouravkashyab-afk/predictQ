# 🧪 Testing Checklist

## Before You Start

### ✅ Prerequisites
- [ ] Privy App ID is in `.env.local`: `NEXT_PUBLIC_PRIVY_APP_ID="cmpur8liy01330cktghj1puai"`
- [ ] Development server is running: `npm run dev`
- [ ] Browser is open to `http://localhost:3000`

---

## 🔧 Privy Dashboard Configuration (REQUIRED)

Go to https://dashboard.privy.io and configure:

### Login Methods
- [ ] Enable **Email** (passwordless magic link)
- [ ] Enable **Google** (OAuth)
- [ ] Enable **Twitter** (OAuth)
- [ ] Enable **Wallet** (MetaMask, Coinbase, WalletConnect)

### Embedded Wallets
- [ ] Enable **"Create on login"** → Select **"Users without wallets"**
- [ ] Disable **"Require password"** (passwordless like Cobot.gg)
- [ ] Set default chain to **Polygon**

### Allowed Origins
- [ ] Add `http://localhost:3000`
- [ ] Add your production URL (if deployed)

### Save
- [ ] Click **Save** in Privy dashboard

---

## 🧪 Test 1: Email Login

1. [ ] Go to `http://localhost:3000/login`
2. [ ] Click **"Continue with Email or Social"**
3. [ ] Enter your email address
4. [ ] Check your email for magic link
5. [ ] Click the magic link
6. [ ] Verify you're redirected to `/app/dashboard`
7. [ ] Check TopBar shows your email address
8. [ ] Go to Settings page
9. [ ] Verify wallet address is shown (embedded wallet)

**Expected**: Embedded wallet auto-created, email shown in TopBar

---

## 🧪 Test 2: Google Login

1. [ ] Go to `http://localhost:3000/login`
2. [ ] Click **"Continue with Email or Social"**
3. [ ] Click **"Continue with Google"**
4. [ ] Sign in with Google account
5. [ ] Verify you're redirected to `/app/dashboard`
6. [ ] Check TopBar shows your Google email
7. [ ] Go to Settings page
8. [ ] Verify wallet address is shown (embedded wallet)

**Expected**: Embedded wallet auto-created, Google email shown in TopBar

---

## 🧪 Test 3: Twitter Login

1. [ ] Go to `http://localhost:3000/login`
2. [ ] Click **"Continue with Email or Social"**
3. [ ] Click **"Continue with Twitter"**
4. [ ] Sign in with Twitter account
5. [ ] Verify you're redirected to `/app/dashboard`
6. [ ] Check TopBar shows your Twitter username
7. [ ] Go to Settings page
8. [ ] Verify wallet address is shown (embedded wallet)

**Expected**: Embedded wallet auto-created, Twitter username shown in TopBar

---

## 🧪 Test 4: Wallet Login (MetaMask)

1. [ ] Go to `http://localhost:3000/login`
2. [ ] Click **"Connect Wallet"**
3. [ ] Select **MetaMask**
4. [ ] Connect your MetaMask wallet
5. [ ] Verify you're redirected to `/app/dashboard`
6. [ ] Check TopBar shows your wallet address (0x1234...5678)
7. [ ] Go to Settings page
8. [ ] Verify wallet address matches your MetaMask

**Expected**: No embedded wallet created, MetaMask address shown

---

## 🧪 Test 5: Route Protection

### Test Protected Routes
1. [ ] Logout (click logout button in TopBar or Sidebar)
2. [ ] Try to access `http://localhost:3000/app/dashboard`
3. [ ] Verify you're redirected to `/login?redirect=/app/dashboard`
4. [ ] Try to access `http://localhost:3000/app/markets`
5. [ ] Verify you're redirected to `/login?redirect=/app/markets`

### Test Auth-Only Routes
1. [ ] Login with any method
2. [ ] Try to access `http://localhost:3000/login`
3. [ ] Verify you're redirected to `/app/dashboard`

**Expected**: Protected routes require login, login page redirects when authenticated

---

## 🧪 Test 6: Logout

### From TopBar
1. [ ] Login with any method
2. [ ] Click logout button in TopBar (top right)
3. [ ] Verify you're redirected to `/login`
4. [ ] Try to access `/app/dashboard`
5. [ ] Verify you're redirected to `/login`

### From Sidebar
1. [ ] Login with any method
2. [ ] Click **"Disconnect"** button in Sidebar (bottom)
3. [ ] Verify you're redirected to `/login`
4. [ ] Try to access `/app/dashboard`
5. [ ] Verify you're redirected to `/login`

### From Settings
1. [ ] Login with any method
2. [ ] Go to Settings page
3. [ ] Scroll to **"Danger Zone"**
4. [ ] Click **"Disconnect"** button
5. [ ] Verify you're redirected to `/login`

**Expected**: All logout methods work and redirect to login

---

## 🧪 Test 7: Trading Flow

1. [ ] Login with any method
2. [ ] Go to Markets page (`/app/markets`)
3. [ ] Click on any market
4. [ ] Verify TradePanel is shown
5. [ ] Select **YES** or **NO**
6. [ ] Enter amount (e.g., $50)
7. [ ] Verify order summary shows:
   - [ ] Avg Price
   - [ ] Shares
   - [ ] Potential Payout
   - [ ] Potential Return
8. [ ] Click **"Buy YES"** or **"Buy NO"**
9. [ ] Verify "Awaiting Signature..." message
10. [ ] Verify "Submitting Order..." message
11. [ ] Verify success screen with:
    - [ ] "Order Submitted!" message
    - [ ] Shares purchased
    - [ ] Market question
12. [ ] Click **"Place Another"**
13. [ ] Verify you can place another trade

**Expected**: Trade flow works (currently simulated)

---

## 🧪 Test 8: Settings Page

1. [ ] Login with any method
2. [ ] Go to Settings page (`/app/settings`)
3. [ ] Verify **Profile** section shows:
   - [ ] Wallet address (embedded or external)
   - [ ] Preferred chain (Polygon/Ethereum)
4. [ ] Change **Risk Level** (Low/Medium/High)
5. [ ] Change **Max Position Size** slider
6. [ ] Toggle **Auto-Trade** on/off
7. [ ] Toggle **Enable Notifications** on/off
8. [ ] Enter **Telegram Chat ID**
9. [ ] Click **"Save Changes"**
10. [ ] Verify **"Saved!"** message appears
11. [ ] Refresh the page
12. [ ] Verify settings are persisted

**Expected**: All settings can be changed and saved

---

## 🧪 Test 9: Navigation

1. [ ] Login with any method
2. [ ] Click each navigation item in Sidebar:
   - [ ] Dashboard
   - [ ] Markets
   - [ ] AI Signals
   - [ ] Newsroom
   - [ ] Whale Feed
   - [ ] Agents
   - [ ] Portfolio
   - [ ] Settings
3. [ ] Verify each page loads correctly
4. [ ] Verify active page is highlighted in Sidebar
5. [ ] Verify page title in TopBar matches current page

**Expected**: All navigation works, active page highlighted

---

## 🧪 Test 10: Sidebar Collapse

1. [ ] Login with any method
2. [ ] Click collapse button in Sidebar (top right of sidebar)
3. [ ] Verify Sidebar collapses to icon-only mode
4. [ ] Hover over icons to see tooltips
5. [ ] Click collapse button again
6. [ ] Verify Sidebar expands back to full width

**Expected**: Sidebar collapse/expand works smoothly

---

## 🐛 Common Issues

### Issue: "Login with Google not allowed"
**Solution**: Enable Google in Privy dashboard → Settings → Login methods

### Issue: "POST https://auth.privy.io/api/v1/siwe/init - 403"
**Solution**: Add `http://localhost:3000` to Privy dashboard → Settings → Allowed origins

### Issue: "No wallet found"
**Solution**: 
1. Check Privy dashboard → Settings → Embedded wallets
2. Enable "Create on login" for "Users without wallets"

### Issue: "Module not found: '@privy-io/react-auth'"
**Solution**: Reinstall dependencies:
```bash
npm install --legacy-peer-deps
```

### Issue: Login page shows "Loading..." forever
**Solution**: 
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_PRIVY_APP_ID` is in `.env.local`
3. Restart dev server: `npm run dev`

---

## ✅ All Tests Passed?

If all tests pass, you're ready to:
1. **Enable real trading** (replace simulated trades with real wallet signing)
2. **Add USDC balance checking**
3. **Add network validation**
4. **Deploy to production**

---

## 📝 Notes

- Trades are currently **simulated** (no real blockchain transactions)
- To enable real trading, update `TradePanel.tsx` to use `wallet.signTypedData()`
- Embedded wallets are created automatically for email/social users
- External wallets (MetaMask, Coinbase) don't get embedded wallets

---

## 🎯 Summary

✅ **Authentication**: Exactly like Cobot.gg (email + social + wallet)  
✅ **Embedded Wallets**: Auto-created for email/social users  
✅ **Route Protection**: Works with Privy token  
✅ **No Compilation Errors**: All files pass TypeScript checks  

**Next**: Configure Privy dashboard and run through this checklist!
