"use client";

import { useEffect, useRef } from "react";

// Mock live prediction market ticker data
const TICKER_ITEMS = [
  { question: "Trump wins 2026 midterms?", yes: "67%", no: "33%", vol: "$2.4M" },
  { question: "Fed cuts rates in June?", yes: "72%", no: "28%", vol: "$5.1M" },
  { question: "BTC above $120k by Dec 2026?", yes: "54%", no: "46%", vol: "$8.9M" },
  { question: "Apple launches AR glasses 2026?", yes: "38%", no: "62%", vol: "$1.2M" },
  { question: "GPT-5 released by July 2026?", yes: "81%", no: "19%", vol: "$3.7M" },
  { question: "Ukraine ceasefire by Q3 2026?", yes: "44%", no: "56%", vol: "$6.2M" },
  { question: "SpaceX Starship reaches orbit?", yes: "89%", no: "11%", vol: "$2.8M" },
  { question: "Ethereum ETH staking yield >5%?", yes: "61%", no: "39%", vol: "$4.5M" },
  { question: "S&P 500 hits 7000 in 2026?", yes: "49%", no: "51%", vol: "$9.1M" },
  { question: "Tesla new model under $25k?", yes: "33%", no: "67%", vol: "$1.8M" },
];

// Double for seamless loop
const ALL_ITEMS = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function LiveTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ticker-bar py-2">
      <div className="ticker-track" ref={trackRef}>
        {ALL_ITEMS.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="text-white/30 text-[10px]">#{i % TICKER_ITEMS.length + 1}</span>
            <span className="truncate max-w-[200px]">{item.question}</span>
            <span className="ticker-yes">YES {item.yes}</span>
            <span className="text-white/20">·</span>
            <span className="ticker-no">NO {item.no}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">{item.vol} vol</span>
          </div>
        ))}
      </div>
    </div>
  );
}
