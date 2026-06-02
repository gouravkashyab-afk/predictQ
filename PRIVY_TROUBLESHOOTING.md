# Privy OAuth - Complete Troubleshooting Guide

## Current Error
```
"Please enter a URL with a domain in your configured allowed domains"
```

This means:
- ✅ Privy App ID is working (`cmpur8liy01330cktghj1puai`)
- ❌ Your production domain is NOT in the allowed list

---

## Critical Check #1: Are You in the RIGHT App?

Privy allows multiple apps. You might be editing the WRONG app.

### Steps:
1. Go to: **https://dashboard.privy.io** (NOT dashboard.privy.com)
2. Look at the **top-left dropdown** (shows current app name)
3. Click it and see ALL your apps
4. Find the app with App ID: **cmpur8liy01330cktghj1puai**
5. Select THAT app

### How to Find Your App ID in Dashboard:
1. In any app, go to: **Configuration → App settings → Basics tab**
2. You'll see: **"App ID"** field
3. It should show: `cmpur8liy01330cktghj1puai`
4. If it shows a DIFFERENT ID, you're in the WRONG app!

---

## Critical Check #2: Production vs Development Environment

Some Privy dashboards have separate "Production" and "Development" environments.

### Steps:
1. In the dashboard, look for an **environment switcher**
2. It might say "Production" or "Development" near the top
3. Make sure you're in **PRODUCTION** environment
4. Some settings are environment-specific

---

## Step-by-Step Configuration (Do This Exactly)

### Part 1: Add Allowed Domains

1. **Go to**: https://dashboard.privy.io
2. **Verify App ID**: Configuration → App settings → Basics → Should show `cmpur8liy01330cktghj1puai`
3. **Go to**: Configuration → App settings → **Domains** tab
4. **Find**: Section labeled "Allowed Origins" or "Allowed Domains"
5. **Add** (in the text box):
   ```
   https://predict-qi.vercel.app
   ```
6. **Click SAVE** (or "Update" or similar button)
7. **Wait 30 seconds** for changes to propagate

### Part 2: Enable Google OAuth

1. **Still in same app**
2. **Go to**: Configuration → App settings → **Login methods** tab
3. **Find**: "Google" toggle switch
4. **Make sure**: It's toggled ON (enabled)
5. **Click SAVE** if there's a save button

### Part 3: Configure OAuth Redirects (Optional but Recommended)

1. **Still in same app**
2. **Go to**: Configuration → App settings → **Advanced** tab
3. **Find**: "Allowed OAuth redirect URLs"
4. **Add** (one per line):
   ```
   https://predict-qi.vercel.app
   https://predict-qi.vercel.app/
   ```
5. **Click SAVE**

---

## Alternative: Create a NEW Privy App

If you can't figure out which app to configure, just create a new one:

### Steps:
1. **Go to**: https://dashboard.privy.io
2. **Click**: "Create New App" (or similar button)
3. **Name**: "PredictIQ Production"
4. **Configure**:
   - **Allowed Origins**: `https://predict-qi.vercel.app`
   - **Login Methods**: Enable Email, Google, Twitter, Wallet
   - **OAuth Redirects**: `https://predict-qi.vercel.app` and `https://predict-qi.vercel.app/`
5. **Copy the NEW App ID** (looks like: `clp...` or `cmp...`)
6. **Update Vercel Environment Variables**:
   - Go to: https://vercel.com → Your project → Settings → Environment Variables
   - Find: `NEXT_PUBLIC_PRIVY_APP_ID`
   - Change to: Your NEW App ID
   - **Important**: Redeploy after changing env vars

---

## Test Environment Variable in Production

After the latest deployment finishes (2-3 minutes), test:

**Go to**: https://predict-qi.vercel.app/api/test-env

You should see JSON like:
```json
{
  "hasPrivyAppId": true,
  "privyAppIdLength": 25,
  "privyAppIdPrefix": "cmpur",
  "allPublicEnvKeys": ["NEXT_PUBLIC_PRIVY_APP_ID", "NEXT_PUBLIC_APP_URL", ...]
}
```

If `hasPrivyAppId` is **false**, then the environment variable is NOT set in Vercel.

---

## Verify Vercel Environment Variables

Your Privy App ID must be set in Vercel:

1. **Go to**: https://vercel.com
2. **Select**: Your project (`predict-qi`)
3. **Go to**: Settings → Environment Variables
4. **Find**: `NEXT_PUBLIC_PRIVY_APP_ID`
5. **Verify**: Value is `cmpur8liy01330cktghj1puai`
6. **Verify**: It's enabled for "Production" environment
7. **If missing**: Add it with value: `cmpur8liy01330cktghj1puai`
8. **After changing**: You MUST redeploy (Settings → Deployments → Click "..." → Redeploy)

---

## Common Mistakes

### ❌ Wrong Dashboard
- Using `dashboard.privy.com` (e-commerce) instead of `dashboard.privy.io` (Web3)

### ❌ Wrong App Selected
- Editing a different app than the one your code uses

### ❌ Wrong Environment
- Configuring "Development" instead of "Production"

### ❌ Typo in Domain
- `http://` instead of `https://`
- Missing/extra trailing slash
- Wrong domain name

### ❌ Didn't Save
- Made changes but didn't click "Save" or "Update"

### ❌ Didn't Wait
- Changes take 30-60 seconds to propagate

### ❌ Wrong Format
- Added domains with wildcards (not supported in some fields)
- Added paths after domain (e.g., `https://domain.com/login` - should be just `https://domain.com`)

---

## Nuclear Option: Start Fresh with Localhost

If nothing works, test with localhost first to confirm everything else is working:

1. **In Privy Dashboard**: Add `http://localhost:3000` to allowed domains
2. **Run locally**: `npm run dev`
3. **Go to**: http://localhost:3000
4. **Try Google login**
5. **If it works**: The issue is ONLY with production domain configuration
6. **If it fails**: The issue is with the Privy app itself

---

## What to Send Me

If still not working, send me:

1. **Screenshot**: Privy Dashboard → Configuration → App settings → **Basics tab** (showing App ID)
2. **Screenshot**: Privy Dashboard → Configuration → App settings → **Domains tab** (showing Allowed Origins)
3. **Screenshot**: Privy Dashboard → Configuration → App settings → **Login methods tab** (showing Google enabled)
4. **Test Result**: What you see at https://predict-qi.vercel.app/api/test-env
5. **Error Message**: What you see in browser console (F12) when clicking Google button

With these, I can pinpoint the exact issue.

---

## Quick Checklist

- [ ] Using https://dashboard.privy.io (NOT .com)
- [ ] Selected correct app (App ID: `cmpur8liy01330cktghj1puai`)
- [ ] In "Production" environment (if option exists)
- [ ] Added `https://predict-qi.vercel.app` to Allowed Origins
- [ ] Google is enabled in Login Methods
- [ ] Clicked SAVE after making changes
- [ ] Waited 1-2 minutes for changes to apply
- [ ] Environment variable is set in Vercel
- [ ] Redeployed after changing Vercel env vars (if needed)
- [ ] Cleared browser cache / tried incognito mode

Go through this checklist one by one!
