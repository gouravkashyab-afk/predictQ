# Fix Privy Google OAuth - Configuration Guide

## Problem
When you click "Google" in the Privy login modal, nothing happens. This is because **OAuth redirect URLs** are not configured in the Privy dashboard.

## Solution: Configure OAuth Redirect URLs

### Step 1: Go to Privy Dashboard
1. Open: **https://dashboard.privy.io**
2. Login with your account
3. Select your app from the dropdown (left sidebar)

### Step 2: Navigate to Advanced Settings
1. Go to: **Configuration → App settings**
2. Click on the **"Advanced"** tab
3. Find the section: **"Allowed OAuth redirect URLs"**

### Step 3: Add Your Production URLs
Add these EXACT URLs (one per line):

```
https://predict-qi.vercel.app
https://predict-qi.vercel.app/
```

**Important Notes:**
- ✅ Include both with and without trailing slash
- ✅ Must be EXACT match (no wildcards)
- ✅ Must match domains in "Allowed Origins"
- ❌ Don't add query parameters

### Step 4: Verify Allowed Domains
While you're in the dashboard, also check:

1. Go to: **Configuration → App settings → Domains tab**
2. Under **"Allowed Origins"**, verify these domains are listed:
   ```
   https://predict-qi.vercel.app
   https://predict-qi-git-main-peak-s-projects5.vercel.app
   https://predict-i6tnv9k1u-peak-s-projects5.vercel.app
   ```

### Step 5: Test Google Login
1. Wait 1-2 minutes for Privy to apply changes
2. Go to: **https://predict-qi.vercel.app**
3. Click **"Login"**
4. Click **"Google"**
5. Google OAuth popup should now open
6. Select your Google account
7. You should be redirected back and logged in

## Why This Was Needed

Privy uses a two-layer security system:

1. **Allowed Domains** - Controls which websites can use your Privy App ID
2. **OAuth Redirect URLs** - Controls where OAuth providers (Google, Twitter) can redirect users after login

Without configuring OAuth redirect URLs, Google doesn't know where to send users after authentication, so nothing happens when you click the button.

## Alternative: Check if Google OAuth is Enabled

If the above doesn't work, also verify:

1. In Privy Dashboard: **Configuration → App settings → Login methods**
2. Ensure **"Google"** toggle is ON (enabled)
3. If disabled, enable it and save

## Troubleshooting

### Still Nothing Happens?

**Check Browser Console:**
1. Press F12 to open DevTools
2. Go to "Console" tab
3. Click "Google" button again
4. Look for any error messages
5. Screenshot any errors you see

**Common Errors:**
- `redirect_uri_mismatch` → URLs don't match exactly
- `invalid_request` → OAuth not configured in Privy
- `unauthorized_client` → Google OAuth not enabled

### Google Popup Opens but Fails?

**Check Network Tab:**
1. Press F12 → "Network" tab
2. Click "Google" button
3. Look for failed requests (red)
4. Click on failed request to see error details

### Works in Localhost but Not Production?

This confirms it's an OAuth redirect URL issue:
1. Localhost uses: `http://localhost:3000`
2. Production uses: `https://predict-qi.vercel.app`
3. You need to add BOTH to allowed OAuth redirect URLs

## Visual Guide

Here's what you should see in Privy Dashboard:

### Allowed Origins (Domains tab):
```
✅ https://predict-qi.vercel.app
✅ https://predict-qi-git-main-peak-s-projects5.vercel.app
✅ https://predict-i6tnv9k1u-peak-s-projects5.vercel.app
```

### Allowed OAuth Redirect URLs (Advanced tab):
```
✅ https://predict-qi.vercel.app
✅ https://predict-qi.vercel.app/
```

### Login Methods:
```
✅ Email (enabled)
✅ Google (enabled)
✅ Twitter (enabled)
✅ Wallet (enabled)
```

## After It Works

Once Google login works:
1. Test Email login
2. Test Twitter login
3. Test Wallet connect
4. Verify wallet is auto-created for social logins
5. Then we can move to implementing the multi-wallet system

## Need More Help?

If you see any error messages in the console or network tab, share them and I can help diagnose the specific issue.
