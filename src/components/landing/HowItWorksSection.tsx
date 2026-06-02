"use client";

import { useEffect, useRef } from "react";

const STEPS = [
  {
    num: "01",
    title: "Ingest",
    description: "We pull live markets, whale flows, and breaking news from across Polymarket, Kalshi, and the web — all in one place.",
    icon: "📡",
  },
  {
    num: "02",
    title: "Analyze",
    description: "Our AI engine reads the signals. It matches news to markets, flags whale conviction, and generates probability-weighted trade ideas.",
    icon: "🧠",
  },
  {
    num: "03",
    title: "Execute",
    description: "One click. Your order hits the market. No switching tabs, no manual signing — just instant execution with full position tracking.",
    icon: "⚡",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".fade-in-up").forEach((el, i) => {
              setTimeout(() => el.classList.add("visible"), i * 150);
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
    <section id="story" className="story-section" ref={ref}>
      <div className="container mx-auto px-4 sm:px-8 py-24 sm:py-32">
        {/* Label */}
        <p className="fade-in-up text-center text-xs tracking-[0.25em] uppercase text-white/40 mb-8">
          HOW PREDICTIQ WORKS
        </p>

        {/* Big headline */}
        <div className="fade-in-up animated-title text-center mb-4 flex flex-wrap justify-center gap-x-3 gap-y-1 px-4">
          {"FROM SIGNAL TO TRADE IN SECONDS".split(" ").map((word, i) => (
            <span key={i} className="animated-word">
              {word}
            </span>
          ))}
        </div>

        {/* Sub */}
        <p className="fade-in-up text-center text-white/40 text-base sm:text-lg max-w-2xl mx-auto mt-8 font-light leading-relaxed">
          PredictIQ ingests live markets, whale flow, and news, turns them into
          clear AI signals, and lets you execute instantly — without switching
          tabs or losing context.
        </p>

        {/* Steps */}
        <div className="how-steps mt-16 px-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="fade-in-up how-step">
              <div className="step-number">{s.num}</div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-zilla text-xl font-bold text-white mb-3">
                {s.title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="fade-in-up mt-20 mx-auto max-w-3xl">
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              {[
                { label: "Markets", sublabel: "Polymarket · Kalshi", color: "#4ade80" },
                { label: "→", sublabel: "", color: "transparent" },
                { label: "AI Engine", sublabel: "Signals · News · Whales", color: "#a78bfa" },
                { label: "→", sublabel: "", color: "transparent" },
                { label: "You", sublabel: "One-click trades", color: "#f4d03f" },
              ].map((item, i) =>
                item.label === "→" ? (
                  <span key={i} className="text-white/20 text-2xl hidden sm:block">→</span>
                ) : (
                  <div key={i} className="text-center flex-1 min-w-[100px]">
                    <div
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-lg font-bold"
                      style={{
                        background: `${item.color}18`,
                        border: `1px solid ${item.color}30`,
                        color: item.color,
                      }}
                    >
                      {i === 0 ? "📊" : i === 2 ? "🤖" : "🎯"}
                    </div>
                    <p className="text-white/80 font-semibold text-sm">{item.label}</p>
                    <p className="text-white/30 text-xs mt-1">{item.sublabel}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
