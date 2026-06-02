"use client";

import { useEffect, useRef } from "react";

const STATS = [
  { value: "$2.4B+", label: "Total Volume Tracked" },
  { value: "12,000+", label: "Active Markets" },
  { value: "140+", label: "AI Signals / Day" },
  { value: "98.7%", label: "Execution Uptime" },
];

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".stat-item").forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = "1";
                (el as HTMLElement).style.transform = "translateY(0)";
              }, i * 100);
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="stats-section" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="stat-item border-r border-white/5 last:border-r-0"
              style={{
                opacity: 0,
                transform: "translateY(16px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              <div className="stat-number">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
