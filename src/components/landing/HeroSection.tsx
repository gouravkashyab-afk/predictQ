"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Zap, TrendingUp, Bot, Newspaper } from "lucide-react";

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${8 + Math.random() * 12}s`,
  size: `${1 + Math.random() * 3}px`,
}));

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const words = entry.target.querySelectorAll(".animated-word");
            words.forEach((w) => w.classList.add("visible"));
          }
        });
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: Newspaper, label: "Real-time news" },
    { icon: TrendingUp, label: "Whale tracking" },
    { icon: Zap, label: "AI-powered signals" },
    { icon: Bot, label: "Autonomous trading agents" },
  ];

  return (
    <section id="home" className="hero-section" ref={sectionRef}>
      <div className="hero-video-frame">
        {/* Background */}
        <div className="hero-bg-gradient" />
        <div className="hero-grid" />

        {/* Floating particles */}
        <div className="hero-particles">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
        </div>

        {/* Glowing orbs */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 600,
            height: 600,
            top: "10%",
            right: "-10%",
            background: "radial-gradient(circle, rgba(85,66,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 400,
            height: 400,
            bottom: "20%",
            left: "-5%",
            background: "radial-gradient(circle, rgba(244,208,63,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 pt-24">
          {/* Badge */}
          <div className="mb-6 flex">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Now live on Polymarket
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-heading text-white max-w-4xl leading-tight mb-4">
            Prediction
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
              Market
            </span>{" "}
            <br className="sm:hidden" />
            Aggregator
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-2xl font-light text-white/70 mb-6 max-w-xl">
            Trade like a{" "}
            <span className="text-yellow-300 font-semibold bg-yellow-300/10 px-2 py-0.5 rounded">
              pro
            </span>{" "}
            with
          </p>

          {/* Feature list */}
          <div className="feature-list mb-10 max-w-sm">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="feature-item">
                <div className="feature-dot" />
                <span className="text-white/80 text-sm sm:text-base font-light">{label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/app" id="start-trading" className="btn-yellow">
              <ArrowUpRight size={16} />
              Start Trading
            </Link>
            <a href="#features" className="btn-ghost">
              Explore Features
            </a>
          </div>
        </div>

        {/* Big watermark text */}
        <h2
          className="absolute bottom-8 right-4 sm:right-8 z-10 font-zilla font-black uppercase text-white/[0.04]"
          style={{ fontSize: "clamp(3rem, 12vw, 9rem)", lineHeight: 1, letterSpacing: "-0.02em", pointerEvents: "none" }}
          aria-hidden
        >
          Aggregator
        </h2>
      </div>
    </section>
  );
}
