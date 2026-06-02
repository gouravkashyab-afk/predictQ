"use client";

import { useState, useCallback, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { TrendingUp, TrendingDown, Zap, CheckCircle, AlertCircle, ExternalLink, Wallet } from "lucide-react";
import type { Market } from "@/lib/polymarket";

interface TradePanelProps {
  market: Market;
}

type Side = "YES" | "NO";
type TradeStatus = "idle" | "signing" | "submitting" | "success" | "error";

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function TradePanel({ market }: TradePanelProps) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const [side, setSide] = useState<Side>("YES");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TradeStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderHash, setOrderHash] = useState<string | null>(null);

  const price = side === "YES" ? market.yesPrice : market.noPrice;
  const tokenId = side === "YES" ? market.yesTokenId : market.noTokenId;
  const numAmount = parseFloat(amount) || 0;
  const shares = price > 0 ? numAmount / price : 0;
  const potentialPayout = shares; // 1 USDC per share if wins
  const potentialProfit = potentialPayout - numAmount;
  const returnPct = numAmount > 0 ? ((potentialProfit / numAmount) * 100).toFixed(1) : "0";

  const isValid = numAmount >= 1 && numAmount <= 10000 && authenticated;

  const placeTrade = useCallback(async () => {
    if (!authenticated || !isValid) return;

    try {
      setStatus("signing");
      setErrorMsg(null);
      setOrderHash(null);

      // Get the active wallet (embedded or external)
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error("No wallet found");
      }

      // Import trading functions dynamically
      const { createAndSignOrder, submitOrder } = await import("@/lib/polymarket-trading");

      // Create and sign the order with Privy wallet
      const signedOrder = await createAndSignOrder(wallet, {
        tokenId,
        price,
        size: numAmount,
        side: "BUY",
        feeRateBps: 0,
      });

      setStatus("submitting");

      // Submit to Polymarket CLOB
      const result = await submitOrder(signedOrder);

      if (!result.success) {
        throw new Error(result.errorMsg || "Order submission failed");
      }

      // Record in our DB
      await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionId: market.conditionId,
          question: market.question,
          tokenId,
          direction: side,
          amountUsdc: numAmount,
          pricePerShare: price,
          shares,
          potentialPayout,
          orderHash: result.orderID || "unknown",
          txHash: result.transactionsHashes?.[0] || null,
        }),
      });

      setOrderHash(result.orderID || "unknown");
      setStatus("success");
    } catch (err: unknown) {
      console.error("[placeTrade]", err);
      if (err instanceof Error && err.message.toLowerCase().includes("user rejected")) {
        setStatus("idle");
        return;
      }
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Order failed. Try again."
      );
    }
  }, [authenticated, isValid, tokenId, price, numAmount, shares, potentialPayout, side, market, wallets]);

  const reset = () => {
    setStatus("idle");
    setErrorMsg(null);
    setOrderHash(null);
    setAmount("");
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="trade-panel" id="trade-panel">
        <div className="trade-success">
          <CheckCircle size={32} className="trade-success-icon" />
          <p className="trade-success-title">Order Submitted!</p>
          <p className="trade-success-desc">
            Bought <strong>{shares.toFixed(2)} {side}</strong> shares on{" "}
            <strong>{market.question.slice(0, 40)}...</strong>
          </p>
          {orderHash && orderHash !== "unknown" && !orderHash.startsWith("simulated") && (
            <a
              href={`https://polygonscan.com/tx/${orderHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="trade-tx-link"
            >
              <ExternalLink size={12} />
              View on PolygonScan
            </a>
          )}
          <div className="trade-success-actions">
            <button className="trade-btn-secondary" onClick={reset}>
              Place Another
            </button>
            <a
              href={`https://polymarket.com/event/${market.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="trade-btn-primary"
            >
              View Position
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-panel" id="trade-panel">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">
          <Zap size={14} style={{ color: "#f59e0b" }} />
          Trade
        </span>
        <span className="trade-powered-by">via Polymarket CLOB</span>
      </div>

      {/* Side selector */}
      <div className="trade-side-selector">
        <button
          id="trade-side-yes"
          className={`trade-side-btn yes ${side === "YES" ? "active" : ""}`}
          onClick={() => setSide("YES")}
        >
          <TrendingUp size={14} />
          YES
          <span className="trade-side-price">{Math.round(market.yesPrice * 100)}¢</span>
        </button>
        <button
          id="trade-side-no"
          className={`trade-side-btn no ${side === "NO" ? "active" : ""}`}
          onClick={() => setSide("NO")}
        >
          <TrendingDown size={14} />
          NO
          <span className="trade-side-price">{Math.round(market.noPrice * 100)}¢</span>
        </button>
      </div>

      {/* Amount input */}
      <div className="trade-amount-section">
        <label className="trade-label">Amount (USDC)</label>
        <div className="trade-amount-input-wrap">
          <span className="trade-currency-prefix">$</span>
          <input
            id="trade-amount-input"
            type="number"
            min="1"
            max="10000"
            step="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="trade-amount-input"
          />
        </div>

        {/* Preset amounts */}
        <div className="trade-presets">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              id={`trade-preset-${preset}`}
              className={`trade-preset-btn ${numAmount === preset ? "active" : ""}`}
              onClick={() => setAmount(String(preset))}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      {numAmount > 0 && (
        <div className="trade-summary">
          <div className="trade-summary-row">
            <span>Avg Price</span>
            <span>{Math.round(price * 100)}¢ per share</span>
          </div>
          <div className="trade-summary-row">
            <span>Shares</span>
            <span>{shares.toFixed(2)}</span>
          </div>
          <div className="trade-summary-row">
            <span>Potential Payout</span>
            <span className="trade-payout">${potentialPayout.toFixed(2)}</span>
          </div>
          <div className="trade-summary-row highlight">
            <span>Potential Return</span>
            <span className={`trade-return ${potentialProfit >= 0 ? "positive" : "negative"}`}>
              {potentialProfit >= 0 ? "+" : ""}${potentialProfit.toFixed(2)} ({returnPct}%)
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && errorMsg && (
        <div className="trade-error-banner">
          <AlertCircle size={13} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CTA */}
      {!authenticated ? (
        <div className="trade-connect-prompt">
          <Wallet size={16} />
          Sign in to trade
        </div>
      ) : (
        <button
          id="trade-place-order-btn"
          className={`trade-place-btn ${side === "YES" ? "yes" : "no"}`}
          onClick={placeTrade}
          disabled={!isValid || status === "signing" || status === "submitting"}
        >
          {status === "signing" && <><span className="login-spinner" />Awaiting Signature...</>}
          {status === "submitting" && <><span className="login-spinner" />Submitting Order...</>}
          {status === "idle" && `Buy ${side} — $${numAmount > 0 ? numAmount.toFixed(0) : "0"}`}
          {status === "error" && `Retry — Buy ${side}`}
        </button>
      )}

      {/* Disclaimer */}
      <p className="trade-disclaimer">
        Orders execute on Polymarket CLOB on <strong>Polygon network</strong>. No gas required for signing. USDC required in your wallet.
      </p>
    </div>
  );
}
