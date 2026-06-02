"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function JoinSection() {
  return (
    <div id="contact" className="join-section">
      <div className="join-card">
        {/* Glow */}
        <div className="join-glow" />

        {/* Floating accent dots */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 pointer-events-none"
            style={{
              width: 4 + i * 2,
              height: 4 + i * 2,
              background: i % 2 === 0 ? "#5542ff" : "#f4d03f",
              top: `${15 + i * 12}%`,
              left: `${8 + i * 3}%`,
              animation: `float-particle ${8 + i * 2}s linear infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-6 font-inter">
            JOIN PREDICTIQ
          </p>
          <h2
            className="font-zilla font-black uppercase text-white w-full max-w-5xl"
            style={{
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            LET'S BUILD THE FUTURE
            <br />
            OF TRADING TOGETHER
          </h2>

          <p className="text-white/40 text-base mt-8 max-w-md font-light">
            Be among the first traders to access AI-powered signals,
            whale tracking, and autonomous agents — all in one terminal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link href="/app" className="btn-yellow text-sm px-8 py-3.5">
              <ArrowUpRight size={18} />
              Launch App — It's Free
            </Link>
            <a
              href="mailto:hello@predictiq.app"
              className="btn-ghost text-sm px-8 py-3.5"
            >
              Contact Us
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-12 flex-wrap justify-center">
            {["Polymarket Integration", "Non-Custodial", "AI-Powered", "On-Chain Verified"].map((b) => (
              <div key={b} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-white/40">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
