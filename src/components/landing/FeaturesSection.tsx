"use client";

import { useEffect, useRef } from "react";

const FEATURES = [
  {
    title: "Whale Feed",
    sub: "Follow conviction, not chatter.",
    description: "Track large-scale positions and smart money movements across prediction markets in real-time.",
    gradient: "from-blue-600/20 to-violet-600/20",
    accent: "#60a5fa",
    icon: "🐳",
    stats: [
      { label: "Tracked Wallets", value: "12,400+" },
      { label: "Avg Trade Size", value: "$45K" },
    ],
  },
  {
    title: "AI Signals",
    sub: "Forecasts you can act on.",
    description: "GPT-4 powered engine scans all markets 24/7, generating actionable signals with confidence scores.",
    gradient: "from-violet-600/20 to-pink-600/20",
    accent: "#a78bfa",
    icon: "🤖",
    stats: [
      { label: "Daily Signals", value: "140+" },
      { label: "Avg Confidence", value: "73%" },
    ],
  },
  {
    title: "Newsroom",
    sub: "Trade the catalyst, not the thread.",
    description: "Live news ingestion with AI-powered matching to open markets. See the catalyst before the crowd.",
    gradient: "from-yellow-600/20 to-orange-600/20",
    accent: "#fbbf24",
    icon: "📰",
    stats: [
      { label: "News Sources", value: "80+" },
      { label: "Match Accuracy", value: "91%" },
    ],
  },
  {
    title: "One-Click Execution",
    sub: "See the setup, place the trade.",
    description: "Execute orders across Polymarket and Kalshi without leaving the terminal. No tab-switching.",
    gradient: "from-green-600/20 to-emerald-600/20",
    accent: "#34d399",
    icon: "⚡",
    stats: [
      { label: "Avg Exec Time", value: "<2s" },
      { label: "Markets", value: "4 platforms" },
    ],
  },
];

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".feature-card").forEach((el, i) => {
              setTimeout(() => (el as HTMLElement).style.opacity = "1", i * 150);
              setTimeout(() => (el as HTMLElement).style.transform = "translateY(0)", i * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="features-section" ref={ref}>
      <div className="container mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="py-20 sm:py-28">
          <p className="text-xs tracking-[0.2em] uppercase text-violet-400 font-medium mb-4">
            Platform Features
          </p>
          <p className="font-zilla text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-xl">
            Tools that turn signal into trades
          </p>
          <p className="text-white/40 text-base sm:text-lg mt-4 max-w-md font-light">
            PredictIQ blends market discovery, AI insight, and fast execution into one clean workflow.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-20">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feature-card bento-card group"
              style={{
                opacity: 0,
                transform: "translateY(24px)",
                transition: "opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, box-shadow 0.3s",
                minHeight: 300,
              }}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="bento-card-gradient" />

              <div className="bento-card-content">
                {/* Icon + badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="text-3xl p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {f.icon}
                  </div>
                  <div className="flex gap-2">
                    {f.stats.map((s) => (
                      <div
                        key={s.label}
                        className="text-right px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <p className="font-bold text-sm" style={{ color: f.accent }}>
                          {s.value}
                        </p>
                        <p className="text-[10px] text-white/40">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div className="bento-badge">
                  <h3 className="bento-title">{f.title}</h3>
                </div>
                <p className="text-white/50 text-sm mt-2 mb-1">{f.sub}</p>
                <p className="text-white/35 text-xs leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Agents section — extra wide card */}
        <div
          className="bento-card mb-20 group"
          style={{
            minHeight: 220,
            background: "linear-gradient(135deg, rgba(85,66,255,0.15) 0%, rgba(124,111,255,0.05) 100%)",
            border: "1px solid rgba(85,66,255,0.25)",
          }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(rgba(85,66,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
          <div className="bento-card-content flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="bento-badge" style={{ background: "rgba(85,66,255,0.3)" }}>
                <h3 className="bento-title text-violet-200">🛸 Autonomous Trading Agents</h3>
              </div>
              <p className="text-white/50 text-sm mt-3">
                Deploy AI agents that trade 24/7 on your behalf — BTC 5-min, ETH 15-min,
                Polymarket farming, and more. Set your risk parameters and let them run.
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                {["BTC 5-min", "ETH 15-min", "SOL 15-min", "PM Farming"].map((a) => (
                  <span
                    key={a}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(85,66,255,0.2)", color: "#a78bfa", border: "1px solid rgba(85,66,255,0.3)" }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <a href="/app" className="btn-yellow shrink-0">
              Deploy Agent →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
