"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Wallet, Copy, ExternalLink, Check, RefreshCw, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from "lucide-react";
import { getTokenBalances } from "@/lib/wallet";

export default function WalletPage() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState<string | null>(null);
  const [balances, setBalances] = useState<{ usdc: number; matic: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const address = embeddedWallet?.address || externalWallet?.address;

  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address]);

  const fetchBalances = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getTokenBalances(address);
      setBalances(data);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalBalance = balances ? balances.usdc + (balances.matic * 0.5) : 0; // Rough MATIC to USD

  return (
    <div className="wallet-page">
      {/* Header */}
      <div className="wallet-header">
        <div>
          <h1 className="wallet-title">
            <Wallet size={24} />
            Wallet
          </h1>
          <p className="wallet-subtitle">Manage your wallets and balances</p>
        </div>
        <button
          className="wallet-refresh-btn"
          onClick={fetchBalances}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spinning" : ""} />
          Refresh
        </button>
      </div>

      {/* Total Balance */}
      <div className="wallet-total-card">
        <span className="wallet-total-label">Total Balance</span>
        <span className="wallet-total-value">
          {loading ? "Loading..." : `$${totalBalance.toFixed(2)}`}
        </span>
        <div className="wallet-total-actions">
          <button className="wallet-action-btn deposit">
            <ArrowDownToLine size={14} />
            Deposit
          </button>
          <button className="wallet-action-btn withdraw">
            <ArrowUpFromLine size={14} />
            Withdraw
          </button>
          <button className="wallet-action-btn transfer">
            <ArrowLeftRight size={14} />
            Transfer
          </button>
        </div>
      </div>

      {/* Wallets */}
      <div className="wallet-sections">
        {/* Multi-Chain Wallet */}
        {embeddedWallet && (
          <div className="wallet-section-card">
            <div className="wallet-section-header">
              <div className="wallet-section-icon multi-chain">
                <Wallet size={18} />
              </div>
              <div className="wallet-section-info">
                <h3 className="wallet-section-title">Multi-Chain</h3>
                <span className="wallet-section-badge">EVM</span>
              </div>
            </div>

            <div className="wallet-section-address">
              <span className="wallet-address-text">
                {embeddedWallet.address.slice(0, 10)}...{embeddedWallet.address.slice(-8)}
              </span>
              <button
                className="wallet-icon-btn"
                onClick={() => copyAddress(embeddedWallet.address)}
              >
                {copied === embeddedWallet.address ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <a
                href={`https://polygonscan.com/address/${embeddedWallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-icon-btn"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="wallet-section-chains">
              <div className="wallet-chain-item">
                <span className="wallet-chain-icon">🟣</span>
                <span>Polygon</span>
              </div>
              <div className="wallet-chain-item">
                <span className="wallet-chain-icon">🔵</span>
                <span>Ethereum</span>
              </div>
              <div className="wallet-chain-item">
                <span className="wallet-chain-icon">🔷</span>
                <span>Base</span>
              </div>
              <div className="wallet-chain-item">
                <span className="wallet-chain-icon">🔹</span>
                <span>Arbitrum</span>
              </div>
              <div className="wallet-chain-item">
                <span className="wallet-chain-icon">🔴</span>
                <span>Optimism</span>
              </div>
            </div>
          </div>
        )}

        {/* Polymarket Wallet (Primary) */}
        {embeddedWallet && (
          <div className="wallet-section-card primary">
            <div className="wallet-section-header">
              <div className="wallet-section-icon polymarket">
                <Wallet size={18} />
              </div>
              <div className="wallet-section-info">
                <h3 className="wallet-section-title">Polymarket</h3>
                <span className="wallet-section-badge primary">Primary</span>
              </div>
            </div>

            <div className="wallet-section-address">
              <span className="wallet-address-text">
                {embeddedWallet.address.slice(0, 10)}...{embeddedWallet.address.slice(-8)}
              </span>
              <button
                className="wallet-icon-btn"
                onClick={() => copyAddress(embeddedWallet.address)}
              >
                {copied === embeddedWallet.address ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <div className="wallet-section-balance">
              <span className="wallet-balance-label">USDC Balance</span>
              <span className="wallet-balance-value">
                {loading ? "..." : `$${balances?.usdc.toFixed(2) || "0.00"}`}
              </span>
            </div>

            <div className="wallet-section-actions">
              <button className="wallet-section-btn">
                <ArrowDownToLine size={14} />
                Deposit
              </button>
              <button className="wallet-section-btn">
                <ArrowLeftRight size={14} />
                Transfer
              </button>
              <button className="wallet-section-btn">
                <ArrowUpFromLine size={14} />
                Withdraw
              </button>
            </div>
          </div>
        )}

        {/* External Wallet */}
        {externalWallet && (
          <div className="wallet-section-card">
            <div className="wallet-section-header">
              <div className="wallet-section-icon external">
                <Wallet size={18} />
              </div>
              <div className="wallet-section-info">
                <h3 className="wallet-section-title">External Wallet</h3>
                <span className="wallet-section-badge">{externalWallet.walletClientType}</span>
              </div>
            </div>

            <div className="wallet-section-address">
              <span className="wallet-address-text">
                {externalWallet.address.slice(0, 10)}...{externalWallet.address.slice(-8)}
              </span>
              <button
                className="wallet-icon-btn"
                onClick={() => copyAddress(externalWallet.address)}
              >
                {copied === externalWallet.address ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <a
                href={`https://polygonscan.com/address/${externalWallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-icon-btn"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Your Tokens */}
      <div className="wallet-tokens-section">
        <h2 className="wallet-tokens-title">Your Tokens</h2>
        <div className="wallet-tokens-list">
          <div className="wallet-token-item">
            <div className="wallet-token-icon">💵</div>
            <div className="wallet-token-info">
              <span className="wallet-token-name">USDC</span>
              <span className="wallet-token-chain">Polygon</span>
            </div>
            <div className="wallet-token-balance">
              <span className="wallet-token-amount">
                {loading ? "..." : balances?.usdc.toFixed(2) || "0.00"}
              </span>
              <span className="wallet-token-value">
                ${loading ? "..." : balances?.usdc.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>

          <div className="wallet-token-item">
            <div className="wallet-token-icon">🟣</div>
            <div className="wallet-token-info">
              <span className="wallet-token-name">MATIC</span>
              <span className="wallet-token-chain">Polygon</span>
            </div>
            <div className="wallet-token-balance">
              <span className="wallet-token-amount">
                {loading ? "..." : balances?.matic.toFixed(4) || "0.0000"}
              </span>
              <span className="wallet-token-value">
                ${loading ? "..." : (balances ? balances.matic * 0.5 : 0).toFixed(2)}
              </span>
            </div>
          </div>

          {(!balances || (balances.usdc === 0 && balances.matic === 0)) && !loading && (
            <div className="wallet-tokens-empty">
              <p>No tokens found</p>
              <a
                href="https://app.uniswap.org/#/swap?chain=polygon"
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-get-tokens-btn"
              >
                Get tokens on Uniswap →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
