"use client";

import { Fish, ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react";

export interface WhaleEventData {
  id: string;
  txHash: string;
  wallet: string;
  amountUsd: number;
  direction: string;
  token: string;
  contractAddress: string;
  blockNumber: string;
  network: string;
  timestamp: string;
}

interface WhaleFeedProps {
  events: WhaleEventData[];
  loading?: boolean;
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getSizeClass(amount: number): string {
  if (amount >= 500_000) return "whale-mega";
  if (amount >= 100_000) return "whale-large";
  if (amount >= 50_000) return "whale-medium";
  return "whale-small";
}

export default function WhaleFeed({ events, loading }: WhaleFeedProps) {
  if (loading) {
    return (
      <div className="whale-feed">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="whale-event-row skeleton" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="whale-feed-empty">
        <Fish size={32} className="whale-feed-empty-icon" />
        <p>No whale activity detected</p>
        <span>Large trades will appear here</span>
      </div>
    );
  }

  return (
    <div className="whale-feed" id="whale-feed">
      {events.map((event) => {
        const isIn = event.direction === "IN";
        const sizeClass = getSizeClass(event.amountUsd);

        return (
          <div
            key={event.id}
            className={`whale-event-row ${sizeClass}`}
            id={`whale-event-${event.id}`}
          >
            {/* Direction icon */}
            <div className={`whale-direction-icon ${isIn ? "in" : "out"}`}>
              {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </div>

            {/* Main info */}
            <div className="whale-event-info">
              <div className="whale-event-top">
                <span className="whale-wallet">{shortAddress(event.wallet)}</span>
                <span className={`whale-action ${isIn ? "deposited" : "withdrew"}`}>
                  {isIn ? "deposited" : "withdrew"}
                </span>
                <span className="whale-amount">{formatAmount(event.amountUsd)}</span>
                <span className="whale-token">{event.token}</span>
              </div>
              <div className="whale-event-bottom">
                <span className="whale-network">{event.network}</span>
                <span className="whale-separator">·</span>
                <span className="whale-time">{timeAgo(event.timestamp)}</span>
              </div>
            </div>

            {/* Size indicator */}
            <div className={`whale-size-badge ${sizeClass}`}>
              {event.amountUsd >= 500_000
                ? "🐋 MEGA"
                : event.amountUsd >= 100_000
                ? "🐳 LARGE"
                : "🐬 MID"}
            </div>

            {/* Tx link */}
            <a
              href={`https://polygonscan.com/tx/${event.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whale-tx-link"
              title="View on PolygonScan"
              aria-label="View transaction on PolygonScan"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        );
      })}
    </div>
  );
}
