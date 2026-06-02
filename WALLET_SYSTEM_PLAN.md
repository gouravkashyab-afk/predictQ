# Multi-Wallet System Like Cobot - Implementation Plan

## Goal: Build Exact Wallet System as Cobot.gg

Based on the screenshot, Cobot has:

### 1. Multi-Chain Wallet
- Supports multiple blockchains
- Shows chain icons (Ethereum, Polygon, BSC, etc.)
- Balance displayed
- Deposit/Transfer/Withdraw buttons

### 2. Solana Wallet
- Dedicated Solana blockchain wallet
- SOL balance
- Phantom/Solflare integration
- Deposit/Transfer/Withdraw

### 3. Polymarket Wallet (GNOSIS)
- Polymarket's official Gnosis Safe wallet
- Shows "Allow on Polymarket" button
- USDC balance on Polygon
- Specialized for Polymarket trading
- Deposit/Transfer/Withdraw

### 4. Hyperliquid Wallet (ARBITRUM)
- Arbitrum-based wallet
- For Hyperliquid DEX trading
- USDC balance
- Deposit/Transfer/Withdraw

---

## Implementation Plan

### Phase 1: Wallet Infrastructure Setup

1. **Remove Privy** (or keep as backup)
2. **Install wallet SDKs:**
   - `@safe-global/safe-core-sdk` - For Gnosis Safe (Polymarket wallet)
   - `@solana/web3.js` + `@solana/wallet-adapter-react` - For Solana
   - `@wagmi/core` + `viem` - For Multi-Chain (already have)
   - `@wagmi/connectors` - For WalletConnect, MetaMask, Coinbase

3. **Create Wallet Architecture:**
   ```
   src/lib/wallets/
   ├── multi-chain.ts      # EVM chains (Polygon, Ethereum, Arbitrum, etc.)
   ├── solana.ts           # Solana wallet integration
   ├── polymarket-safe.ts  # Gnosis Safe for Polymarket
   ├── hyperliquid.ts      # Hyperliquid wallet (Arbitrum)
   └── wallet-manager.ts   # Central wallet management
   ```

### Phase 2: UI Components

1. **Wallet Page** (`src/app/app/wallet/page.tsx`)
   - Already exists, needs redesign to match Cobot
   - Show all 4 wallets
   - Total balance at top
   - Each wallet card shows:
     - Wallet type icon
     - Chain/Platform name
     - Status (Connected/Disconnected)
     - Balance
     - Action buttons (Deposit/Transfer/Withdraw)

2. **Wallet Cards Component:**
   ```tsx
   <WalletCard
     type="multi-chain"
     name="Multi-Chain"
     chains={["Ethereum", "Polygon", "BSC", "Arbitrum"]}
     balance={0.00}
     status="connected"
   />
   ```

3. **Connect Wallet Modal:**
   - Shows all wallet options
   - For Multi-Chain: MetaMask, WalletConnect, Coinbase
   - For Solana: Phantom, Solflare
   - For Polymarket: "Allow on Polymarket" button
   - For Hyperliquid: Connect via Arbitrum wallet

### Phase 3: Integration Details

#### Multi-Chain Wallet
- Use wagmi + viem (already installed)
- Support chains:
  - Ethereum (ETH)
  - Polygon (MATIC) - **Primary for Polymarket**
  - BSC (BNB)
  - Arbitrum (ETH)
  - Base
  - Optimism
- Show combined balance across chains
- Network switching

#### Solana Wallet
- Install: `@solana/wallet-adapter-react`
- Supported wallets:
  - Phantom
  - Solflare
  - Backpack
- Show SOL balance
- For Solana-based prediction markets (future)

#### Polymarket Wallet (Gnosis Safe)
- Use Polymarket's official Gnosis Safe integration
- Create/Import Polymarket proxy wallet
- Show USDC balance on Polygon
- "Allow on Polymarket" - Authorize app to use wallet
- This is THE wallet for Polymarket trading

#### Hyperliquid Wallet
- Arbitrum-based wallet
- For future DEX integration
- Show USDC balance
- Can skip for MVP, focus on Polymarket first

---

## Wallet Priority for Your Polymarket App

### MVP (Do First):
1. ✅ **Polymarket Wallet (Gnosis Safe)** - HIGHEST PRIORITY
   - This is essential for Polymarket trading
   - Users can import existing Polymarket wallet
   - Or create new one

2. ✅ **Multi-Chain Wallet** - HIGH PRIORITY
   - Needed for Polygon (Polymarket runs on Polygon)
   - MetaMask, WalletConnect, Coinbase support
   - Network switching to Polygon

### Future Enhancement:
3. ⏸️ **Solana Wallet** - LOW PRIORITY
   - Only if adding Solana-based markets
   
4. ⏸️ **Hyperliquid Wallet** - LOW PRIORITY
   - Only if adding DEX features

---

## Technical Implementation

### Step 1: Install Dependencies
```bash
npm install @safe-global/safe-core-sdk @safe-global/safe-ethers-lib
npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets
npm install @solana/wallet-adapter-react-ui
```

### Step 2: Create Wallet Manager
```typescript
// src/lib/wallets/wallet-manager.ts
export class WalletManager {
  private wallets: Map<WalletType, Wallet> = new Map();
  
  async connectMultiChain(connector: string) { }
  async connectSolana(wallet: string) { }
  async connectPolymarket() { }
  async connectHyperliquid() { }
  
  getTotalBalance(): number { }
  getWalletBalance(type: WalletType): number { }
}
```

### Step 3: Update Trading Integration
- Current: Uses Privy wallet
- New: Use Polymarket Gnosis Safe wallet
- Fallback: Multi-Chain wallet on Polygon

### Step 4: UI Updates
- Redesign wallet page to match Cobot
- Add wallet selection in trade panel
- Show active wallet in header

---

## Timeline

**Phase 1: Polymarket Wallet + Multi-Chain** (Priority)
- 2-3 hours
- Gnosis Safe integration
- Multi-Chain wallet (MetaMask, WalletConnect)
- Updated wallet UI
- Trading with new wallets

**Phase 2: Solana + Hyperliquid** (Optional)
- 2 hours
- Solana wallet integration
- Hyperliquid setup
- Complete 4-wallet system

---

## Next Steps

1. ✅ **Wait for Vercel deployment to succeed**
2. ✅ **Test current app is working**
3. 🚀 **Implement Polymarket + Multi-Chain wallets**
4. 🚀 **Update UI to match Cobot**
5. 🚀 **Add Solana + Hyperliquid (optional)**

---

**Ready to start once deployment is live!** 🚀
