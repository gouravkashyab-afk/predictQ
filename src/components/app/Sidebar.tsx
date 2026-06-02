"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  LayoutDashboard,
  TrendingUp,
  Zap,
  Newspaper,
  Fish,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  {
    group: "Main",
    items: [
      { href: "/app/home", label: "Home", icon: LayoutDashboard },
      { href: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
    ],
  },
  {
    group: "Trading",
    items: [
      { href: "/app/markets", label: "Markets", icon: TrendingUp },
      { href: "/app/signals", label: "AI Signals", icon: Zap },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { href: "/app/newsroom", label: "Newsroom", icon: Newspaper },
      { href: "/app/whales", label: "Whale Feed", icon: Fish },
      { href: "/app/agents", label: "Agents", icon: Bot },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "/app/portfolio", label: "Portfolio", icon: BarChart3 },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = usePrivy();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/app/dashboard" className="sidebar-logo-link">
          <div className="sidebar-logo-icon">P</div>
          {!collapsed && <span className="sidebar-logo-text">PredictIQ</span>}
        </Link>
        <button
          id="sidebar-collapse-btn"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.group} className="sidebar-group">
            {!collapsed && (
              <span className="sidebar-group-label">{group.group}</span>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && (
                    <span className="sidebar-nav-label">{item.label}</span>
                  )}
                  {isActive && <span className="sidebar-active-pill" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button
          id="sidebar-logout-btn"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title={collapsed ? "Disconnect" : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Disconnect</span>}
        </button>
      </div>
    </aside>
  );
}
