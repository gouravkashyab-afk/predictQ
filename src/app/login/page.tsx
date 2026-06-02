"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import { Mail, Wallet, Zap, TrendingUp, Bot, Shield, ArrowRight } from "lucide-react";

function LoginContent() {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin({
    onComplete: (user, isNewUser) => {
      console.log("[Privy] Login complete:", { user, isNewUser });
      // Redirect handled by useEffect below
    },
    onError: (error) => {
      console.error("[Privy] Login error:", error);
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/app/dashboard";

  // Auto-redirect when authenticated
  useEffect(() => {
    if (ready && authenticated) {
      router.push(redirectTo);
    }
  }, [ready, authenticated, redirectTo, router]);

  if (!ready) {
    return (
      <main className="login-page">
        <div className="login-bg">
          <div className="login-orb login-orb-1" />
          <div className="login-orb login-orb-2" />
          <div className="login-grid" />
        </div>
        <div className="login-card">
          <div className="login-spinner" />
          <p style={{ marginTop: "1rem", color: "#71717a" }}>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-grid" />
      </div>

      {/* Card */}
      <div className="login-card">
        {/* Logo */}
        <Link href="/" className="login-logo">
          <div className="login-logo-icon">
            <Zap size={20} />
          </div>
          <span className="login-logo-text">PredictIQ</span>
        </Link>

        <div className="login-divider" />

        <h1 className="login-title">Welcome to PredictIQ</h1>
        <p className="login-subtitle">
          Sign in with email, social, or connect your wallet to access AI-powered prediction markets.
        </p>

        {/* Login Options */}
        <div className="login-options">
          {/* Email/Social Login */}
          <button
            id="login-email-btn"
            className="login-option-btn primary"
            onClick={() => login()}
          >
            <Mail size={18} />
            <div className="login-option-content">
              <span className="login-option-title">Continue with Email or Social</span>
              <span className="login-option-subtitle">Google, Twitter, or Email</span>
            </div>
            <ArrowRight size={16} className="login-option-arrow" />
          </button>

          {/* Wallet Login */}
          <button
            id="login-wallet-btn"
            className="login-option-btn secondary"
            onClick={() => login()}
          >
            <Wallet size={18} />
            <div className="login-option-content">
              <span className="login-option-title">Connect Wallet</span>
              <span className="login-option-subtitle">MetaMask, Coinbase, WalletConnect</span>
            </div>
            <ArrowRight size={16} className="login-option-arrow" />
          </button>
        </div>

        {/* Security Note */}
        <div className="login-security-note">
          <Shield size={14} />
          <span>
            New users get an embedded wallet automatically. No seed phrase needed.
          </span>
        </div>

        {/* Features grid */}
        <div className="login-features-grid">
          <div className="login-feature-card">
            <div className="login-feature-icon" style={{ background: "#5542ff20", color: "#5542ff" }}>
              <Zap size={16} />
            </div>
            <div className="login-feature-content">
              <h3>AI Signals</h3>
              <p>GPT-4 powered trade recommendations</p>
            </div>
          </div>
          <div className="login-feature-card">
            <div className="login-feature-icon" style={{ background: "#06b6d420", color: "#06b6d4" }}>
              <TrendingUp size={16} />
            </div>
            <div className="login-feature-content">
              <h3>Live Markets</h3>
              <p>Real-time Polymarket integration</p>
            </div>
          </div>
          <div className="login-feature-card">
            <div className="login-feature-icon" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
              <Bot size={16} />
            </div>
            <div className="login-feature-content">
              <h3>Auto Agents</h3>
              <p>24/7 autonomous trading bots</p>
            </div>
          </div>
        </div>

        <p className="login-legal">
          By continuing, you agree to our{" "}
          <a href="/terms" className="login-legal-link">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="login-legal-link">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="login-page">
        <div className="login-bg">
          <div className="login-orb login-orb-1" />
          <div className="login-orb login-orb-2" />
          <div className="login-grid" />
        </div>
        <div className="login-card">
          <div className="login-spinner" />
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
