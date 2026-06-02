"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#story" },
    { label: "Community", href: "#community" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <div
        className={`fixed inset-x-4 sm:inset-x-6 top-4 z-50 h-16 navbar-glass transition-all duration-700 ${
          scrolled ? "scrolled" : ""
        }`}
      >
        <header className="absolute top-1/2 w-full -translate-y-1/2">
          <nav className="flex items-center justify-between px-5 h-full">
            {/* Logo */}
            <Link href="/" aria-label="PredictIQ home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm font-zilla">P</span>
              </div>
              <span className="font-zilla font-bold text-white text-lg tracking-tight hidden sm:block">
                PredictIQ
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="nav-link">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link href="/app" className="btn-yellow text-xs hidden sm:inline-flex">
                Launch App
              </Link>

              {/* Mobile hamburger */}
              <button
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-all"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </nav>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="mobile-menu">
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={28} />
          </button>

          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="mobile-menu-link"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}

          <Link
            href="/app"
            className="btn-yellow mt-4"
            onClick={() => setMobileOpen(false)}
          >
            Launch App
          </Link>
        </div>
      )}
    </>
  );
}
