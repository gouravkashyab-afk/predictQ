"use client";

import { usePrivy } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import { Bell, LogOut, User } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/markets": "Markets",
  "/app/signals": "AI Signals",
  "/app/newsroom": "Newsroom",
  "/app/whales": "Whale Feed",
  "/app/agents": "Agents",
  "/app/portfolio": "Portfolio",
  "/app/settings": "Settings",
};

export default function TopBar() {
  const { ready, authenticated, user, logout } = usePrivy();
  const pathname = usePathname();
  const pageTitle = ROUTE_LABELS[pathname] ?? "PredictIQ";

  // Get display name/address
  const displayName = user?.email?.address 
    || user?.google?.email
    || user?.twitter?.username
    || (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : null)
    || "User";

  return (
    <header className="app-topbar">
      {/* Page title */}
      <div className="topbar-left">
        <h1 className="topbar-title">{pageTitle}</h1>
        <div className="topbar-network-badge">
          <span className="topbar-live-dot" style={{ width: 5, height: 5, marginRight: 0 }} />
          <span>Polygon</span>
        </div>
      </div>

      {/* Right side */}
      <div className="topbar-right">
        {/* Live indicator */}
        <div className="topbar-live">
          <span className="topbar-live-dot" />
          <span>Live</span>
        </div>

        {/* Notifications */}
        <button
          id="topbar-notifications-btn"
          className="topbar-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="topbar-notif-badge">3</span>
        </button>

        {/* User menu */}
        {ready && authenticated && (
          <div className="topbar-user-menu">
            <button className="topbar-user-btn">
              <User size={14} />
              <span>{displayName}</span>
            </button>
            <button
              className="topbar-icon-btn"
              onClick={() => logout()}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
