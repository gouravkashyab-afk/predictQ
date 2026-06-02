# 🔐 Privy Authentication Setup - Like Cobot.gg

Your platform now uses **Privy** for authentication, just like Cobot.gg! This provides:
- ✅ **Email login** - Passwordless email authentication
- ✅ **Social login** - Google, Twitter, Discord, etc.
- ✅ **Wallet connection** - MetaMask, Coinbase, WalletConnect
- ✅ **Embedded wallets** - Auto-created wallets for email/social users
- ✅ **No seed phrases** - Wallets secured by Privy

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Privy Account

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Sign up with your email
3. Verify your email

### Step 2: Create App

1. Click "Create App"
2. Name: "PredictIQ" (or your app name)
3. Select "Production" or "Development"
4. Click "Create"

### Step 3: Get App ID

1. In your Privy dashboard, click on your app
2. Go to "Settings" → "Basics"
3. Copy your **App ID** (looks like: `clxxx...`)

### Step 4: Add to Environment

Add to your `.env.local`:

```env
NEXT_PUBLIC_PRIVY_APP_ID="your-app-id-here"
```

### Step 5: Configure Login Methods

In Privy dashboard:

1. Go to "Settings" → "Login methods"
2. Enable:
   - ✅ Email
   - ✅ Google
   - ✅ Twitter
   - ✅ Wallet (MetaMask, Coinbase, WalletConnect)
3. Save changes

### Step 6: Configure Embedded Wallets

1. Go to "Settings" → "Embedded wallets"
2. Enable "Create on login"
3. Select "Users without wallets"
4. Disable "Require password" (for passwordless experience)
5. Save changes

### Step 7: Test It!

```bash
npm run dev
```

Go to http://localhost:3000/login and try:
- Email login
- Google login
- Wallet connection

---

## 🎨 What Changed

### Before (SIWE + RainbowKit)
- Only wallet connection
- Required MetaMask/Coinbase
- Manual SIWE signing
- No embedded wallets

### After (Privy)
- ✅ Email + Social + Wallet
- ✅ Embedded wallets auto-created
- ✅ Passwordless experience
- ✅ Better UX like Cobot.gg

---

## 📁 Files Modified

### 1. `src/components/providers/Web3Provider.tsx`
- Replaced RainbowKit with PrivyProvider
- Configured login methods
- Enabled embedded wallets

### 2. `src/app/login/page.tsx`
- New UI with email/social + wallet options
- Uses Privy's `useLogin()` hook
- Auto-redirect after authentication

### 3. `src/components/app/TopBar.tsx`
- Uses Privy's `usePrivy()` hook
- Shows email/username/wallet address
- Logout button

### 4. `src/components/app/TradePanel.tsx`
- Uses Privy wallets for signing
- Works with embedded + external wallets
- Simplified trade flow

### 5. `src/proxy.ts`
- Checks for `privy-token` cookie
- Route protection

---

## 🔧 Configuration Options

### Login Methods

In `src/components/providers/Web3Provider.tsx`:

```typescript
loginMethods: [
  "email",      // Email OTP
  "google",     // Google OAuth
  "twitter",    // Twitter OAuth
  "discord",    // Discord OAuth
  "github",     // GitHub OAuth
  "wallet",     // External wallets
]
```

### Embedded Wallets

```typescript
embeddedWallets: {
  createOnLogin: "users-without-wallets", // Auto-create for email/social
  requireUserPasswordOnCreate: false,     // Passwordless
}
```

### Appearance

```typescript
appearance: {
  theme: "dark",           // or "light"
  accentColor: "#5542ff",  // Your brand color
  logo: "/logo.png",       // Your logo
  showWalletLoginFirst: false, // Show email/social first
}
```

---

## 🎯 User Flows

### Flow 1: Email Login (New User)
1. User enters email
2. Receives OTP code
3. Enters code
4. **Embedded wallet auto-created**
5. Redirected to dashboard

### Flow 2: Google Login (New User)
1. User clicks "Continue with Google"
2. Google OAuth popup
3. Authorizes
4. **Embedded wallet auto-created**
5. Redirected to dashboard

### Flow 3: Wallet Connection (Existing Wallet)
1. User clicks "Connect Wallet"
2. Selects MetaMask/Coinbase
3. Connects wallet
4. **No embedded wallet created**
5. Redirected to dashboard

### Flow 4: Returning User
1. User visits site
2. **Auto-authenticated** (cookie exists)
3. Redirected to dashboard

---

## 🔐 Security Features

### 1. Embedded Wallets
- **Non-custodial** - User controls keys
- **Encrypted** - Keys encrypted at rest
- **MFA support** - Optional 2FA
- **Recovery** - Email-based recovery

### 2. Session Management
- **Secure cookies** - HttpOnly, Secure, SameSite
- **7-day expiration** - Auto-logout after 7 days
- **Refresh tokens** - Seamless re-authentication

### 3. Wallet Security
- **No seed phrases** - Embedded wallets don't expose seeds
- **Biometric auth** - Optional on mobile
- **Transaction signing** - User approval required

---

## 💰 Pricing

### Free Tier
- ✅ 1,000 monthly active users
- ✅ All login methods
- ✅ Embedded wallets
- ✅ Email support

### Pro Tier ($99/month)
- ✅ 10,000 monthly active users
- ✅ Custom branding
- ✅ Priority support
- ✅ Advanced analytics

### Enterprise
- ✅ Unlimited users
- ✅ SLA guarantees
- ✅ Dedicated support
- ✅ Custom contracts

**Start with free tier!** Upgrade when you hit 1,000 users.

---

## 🧪 Testing

### Test Email Login
1. Go to http://localhost:3000/login
2. Click "Continue with Email or Social"
3. Enter your email
4. Check email for OTP
5. Enter code
6. Should see dashboard

### Test Google Login
1. Go to http://localhost:3000/login
2. Click "Continue with Email or Social"
3. Select Google
4. Authorize
5. Should see dashboard

### Test Wallet Connection
1. Go to http://localhost:3000/login
2. Click "Connect Wallet"
3. Select MetaMask
4. Connect
5. Should see dashboard

---

## 🐛 Troubleshooting

### "App ID not found"
- Check `NEXT_PUBLIC_PRIVY_APP_ID` in `.env.local`
- Make sure it starts with `cl...`
- Restart dev server

### "Login method not enabled"
- Go to Privy dashboard
- Settings → Login methods
- Enable the method you want
- Save changes

### "Embedded wallet creation failed"
- Go to Privy dashboard
- Settings → Embedded wallets
- Enable "Create on login"
- Save changes

### "Redirect loop"
- Clear cookies
- Check `proxy.ts` is checking `privy-token`
- Restart dev server

---

## 📚 Advanced Features

### Custom Login UI

You can fully customize the login UI:

```typescript
import { useLogin } from "@privy-io/react-auth";

const { login } = useLogin({
  onComplete: (user, isNewUser) => {
    console.log("Login complete!", user);
  },
  onError: (error) => {
    console.error("Login failed", error);
  },
});

// Trigger login with specific method
<button onClick={() => login({ loginMethod: "email" })}>
  Email Login
</button>

<button onClick={() => login({ loginMethod: "google" })}>
  Google Login
</button>

<button onClick={() => login({ loginMethod: "wallet" })}>
  Wallet Login
</button>
```

### Access User Data

```typescript
import { usePrivy } from "@privy-io/react-auth";

const { user } = usePrivy();

// Email user
user?.email?.address // "user@example.com"

// Google user
user?.google?.email // "user@gmail.com"
user?.google?.name // "John Doe"

// Twitter user
user?.twitter?.username // "@johndoe"

// Wallet user
user?.wallet?.address // "0x123..."

// Embedded wallet
user?.wallet?.walletClientType // "privy"
```

### Sign Messages

```typescript
import { useWallets } from "@privy-io/react-auth";

const { wallets } = useWallets();
const wallet = wallets[0]; // Get first wallet

// Sign message
const signature = await wallet.signMessage("Hello World");

// Sign typed data (EIP-712)
const signature = await wallet.signTypedData({
  domain: { ... },
  types: { ... },
  message: { ... },
});
```

---

## 🎉 You're Done!

Your authentication is now exactly like Cobot.gg:
- ✅ Email + Social + Wallet login
- ✅ Embedded wallets for email/social users
- ✅ Passwordless experience
- ✅ Better UX

**Next steps:**
1. Test all login methods
2. Customize branding in Privy dashboard
3. Add your logo
4. Deploy to production

---

## 📞 Support

- **Privy Docs:** https://docs.privy.io
- **Privy Discord:** https://discord.gg/privy
- **Privy Support:** support@privy.io

---

**Happy building! 🚀**
