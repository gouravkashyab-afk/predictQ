"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Wallet, Copy, ExternalLink, Check, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { getUSDCBalance } from "@/lib/wallet";

export default function WalletDisplay() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Get the embedded wallet (Polygon/Multi-chain)
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  
  // Use embedded wallet if available, otherwise external
  const activeWallet = embeddedWallet || externalWallet || wallets[0];
  const address = activeWallet?.address;

  // Fetch USDC balance
  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address]);

  const fetchBalance = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const usdcBalance = await getUSDCBalance(address);
      setBalance(usdcBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="wallet-display">
        <div className="wallet-display-empty">
          <Wallet size={16} />
          <span>No wallet connected</span>
        </div>
      </div>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const isEmbedded = activeWallet?.walletClientType === "privy";

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wallet-display">
      <div className="wallet-display-header">
        <Wallet size={16} />
        <span className="wallet-display-title">
          {isEmbedded ? "Polymarket Wallet" : "Connected Wallet"}
        </span>
        {isEmbedded && (
          <span className="wallet-display-badge">Embedded</span>
        )}
      </div>

      <div className="wallet-display-address">
        <span className="wallet-address-text">{shortAddress}</span>
        <button
          className="wallet-display-btn"
          onClick={copyAddress}
          title="Copy address"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <a
          href={`https://polygonscan.com/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="wallet-display-btn"
          title="View on PolygonScan"
        >
          <ExternalLink size={14} />
        </a>
        <button
          className="wallet-display-btn"
          onClick={fetchBalance}
          title="Refresh balance"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spinning" : ""} />
        </button>
      </div>

      {isEmbedded && (
        <div className="wallet-display-info">
          <span className="wallet-info-label">Multi-Chain Support:</span>
          <div className="wallet-chains">
            <span className="wallet-chain-badge">Polygon</span>
            <span className="wallet-chain-badge">Ethereum</span>
            <span className="wallet-chain-badge">Base</span>
          </div>
        </div>
      )}

      <div className="wallet-display-balance">
        <span className="wallet-balance-label">USDC Balance</span>
        <span className="wallet-balance-value">
          {loading ? (
            <span className="wallet-balance-loading">Loading...</span>
          ) : balance !== null ? (
            `$${balance.toFixed(2)}`
          ) : (
            "$0.00"
          )}
        </span>
        {balance !== null && balance === 0 && (
          <span className="wallet-balance-hint">
            <a 
              href="https://app.uniswap.org/#/swap?chain=polygon" 
              target="_blank" 
              rel="noopener noreferrer"
              className="wallet-balance-link"
            >
              Get USDC on Polygon →
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
