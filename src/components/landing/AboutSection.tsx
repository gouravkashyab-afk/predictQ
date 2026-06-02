"use client";

import { useEffect, useRef } from "react";

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".fade-in-up").forEach((el, i) => {
              setTimeout(() => el.classList.add("visible"), i * 120);
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="about-section" ref={ref}>
      {/* Header */}
      <div className="flex flex-col items-center gap-4 px-4 pt-24 pb-16">
        <p className="fade-in-up text-xs tracking-[0.25em] uppercase text-gray-400 font-inter font-medium">
          Welcome to PredictIQ
        </p>
        <h2
          className="fade-in-up font-zilla text-center font-black uppercase leading-tight text-black"
          style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
        >
          Discover the AI Terminal
          <br />
          For Prediction Markets
        </h2>
        <div className="fade-in-up relative max-w-2xl text-center mt-6">
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            PredictIQ unifies Polymarket, Kalshi, and Limitless into a single
            terminal with smart filters, live spreads, and one-click orders.
          </p>
          <p className="text-base sm:text-lg text-gray-500 mt-3 leading-relaxed">
            See news-linked catalysts, track whale flow, and act in seconds
            without switching tabs.
          </p>
        </div>
      </div>

      {/* Visual dashboard mockup */}
      <div className="fade-in-up px-4 sm:px-8 pb-24">
        <div
          className="relative mx-auto rounded-2xl overflow-hidden border border-gray-200"
          style={{ maxWidth: 1000, background: "#0a0a12" }}
        >
          {/* Mock dashboard header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-mono">LIVE</span>
            </div>
          </div>

          {/* Mock dashboard content */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat cards */}
            {[
              { label: "Active Markets", value: "2,847", change: "+12", color: "#4ade80" },
              { label: "24h Volume", value: "$89.4M", change: "+5.2%", color: "#60a5fa" },
              { label: "AI Signals Today", value: "143", change: "+28", color: "#f4d03f" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-xs text-white/40 uppercase tracking-wide font-inter">{stat.label}</p>
                <p className="text-2xl font-zilla font-bold text-white mt-1">{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: stat.color }}>
                  ▲ {stat.change} today
                </p>
              </div>
            ))}

            {/* Mock market rows */}
            <div className="col-span-1 sm:col-span-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-xs text-white/40 uppercase tracking-wide">Top Markets</span>
                <span className="text-xs text-violet-400 cursor-pointer hover:text-violet-300">View all →</span>
              </div>
              {[
                { q: "Will Trump sign crypto bill before August?", yes: 0.74, vol: "$12.3M", cat: "POLITICS" },
                { q: "BTC price above $110k on June 1?", yes: 0.58, vol: "$8.7M", cat: "CRYPTO" },
                { q: "Fed funds rate cut in June 2026?", yes: 0.71, vol: "$23.1M", cat: "FINANCE" },
                { q: "Will Apple release Vision Pro 2 in 2026?", yes: 0.42, vol: "$4.2M", cat: "TECH" },
              ].map((m, i) => (
                <div
                  key={i}
                  className="px-4 py-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded shrink-0"
                      style={{
                        background: "rgba(85,66,255,0.15)",
                        color: "#7c6fff",
                        border: "1px solid rgba(85,66,255,0.2)",
                      }}
                    >
                      {m.cat}
                    </span>
                    <span className="text-sm text-white/80 truncate">{m.q}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      {/* Progress bar */}
                      <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.yes * 100}%`,
                            background: m.yes > 0.5 ? "#4ade80" : "#f87171",
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: m.yes > 0.5 ? "#4ade80" : "#f87171" }}
                    >
                      {Math.round(m.yes * 100)}¢
                    </span>
                    <span className="text-xs text-white/30">{m.vol}</span>
                    <button className="btn-yellow" style={{ padding: "0.3rem 0.8rem", fontSize: "0.7rem" }}>
                      Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
