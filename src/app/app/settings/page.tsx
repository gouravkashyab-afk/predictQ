"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Wallet, Shield, Bell, AlertTriangle, CheckCircle, LogOut } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

interface UserSettings {
  riskLevel: string;
  maxPositionSize: string;
  autoTrade: boolean;
  notificationsEnabled: boolean;
  telegramChatId: string | null;
  preferredChain: string;
}

export default function SettingsPage() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  
  // Get wallet address from Privy
  const address = wallets[0]?.address || user?.wallet?.address || null;

  const [settings, setSettings] = useState<UserSettings>({
    riskLevel: "medium",
    maxPositionSize: "100",
    autoTrade: false,
    notificationsEnabled: true,
    telegramChatId: null,
    preferredChain: "polygon",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/verify", { method: "DELETE" });
    await logout();
    router.push("/login");
  };

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—";

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title"><Settings size={20} />Settings</h1>
        <button
          id="settings-save-btn"
          className={`settings-save-btn ${saved ? "saved" : ""}`}
          onClick={save}
          disabled={saving || loading}
        >
          {saved ? <><CheckCircle size={14} />Saved!</> : saving ? "Saving..." : <><Save size={14} />Save Changes</>}
        </button>
      </div>

      {error && <div className="settings-error-banner"><AlertTriangle size={14} />{error}</div>}

      <div className="settings-sections">
        {/* Profile */}
        <section className="settings-section" id="settings-profile">
          <div className="settings-section-header">
            <Wallet size={16} className="settings-section-icon" />
            <h2>Profile</h2>
          </div>
          <div className="settings-field-group">
            <div className="settings-field readonly">
              <label>Wallet Address</label>
              <div className="settings-readonly-value">
                <span className="settings-wallet-address">{address || "Not connected"}</span>
              </div>
            </div>
            <div className="settings-field">
              <label>Preferred Chain</label>
              <div className="settings-radio-group">
                {["polygon", "ethereum"].map((chain) => (
                  <label key={chain} className={`settings-radio ${settings.preferredChain === chain ? "active" : ""}`}>
                    <input type="radio" name="chain" value={chain}
                      checked={settings.preferredChain === chain}
                      onChange={() => setSettings((s) => ({ ...s, preferredChain: chain }))}
                    />
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trading Risk */}
        <section className="settings-section" id="settings-risk">
          <div className="settings-section-header">
            <Shield size={16} className="settings-section-icon" />
            <h2>Trading Risk</h2>
          </div>
          <div className="settings-field-group">
            <div className="settings-field">
              <label>Risk Level</label>
              <div className="settings-radio-group">
                {["low", "medium", "high"].map((level) => (
                  <label key={level}
                    className={`settings-radio risk-${level} ${settings.riskLevel === level ? "active" : ""}`}
                  >
                    <input type="radio" name="risk" value={level}
                      checked={settings.riskLevel === level}
                      onChange={() => setSettings((s) => ({ ...s, riskLevel: level }))}
                    />
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div className="settings-field">
              <label>Max Position Size (USDC)</label>
              <div className="settings-slider-wrap">
                <input
                  id="settings-max-position"
                  type="range" min="10" max="1000" step="10"
                  value={parseInt(settings.maxPositionSize) || 100}
                  onChange={(e) => setSettings((s) => ({ ...s, maxPositionSize: e.target.value }))}
                  className="settings-slider"
                />
                <span className="settings-slider-value">${settings.maxPositionSize}</span>
              </div>
              <p className="settings-field-hint">Maximum USDC per single trade position</p>
            </div>
            <div className="settings-field">
              <label className="settings-toggle-label">
                <div className="settings-toggle-info">
                  <span>Auto-Trade</span>
                  <span className="settings-field-hint">Allow agents to execute trades automatically</span>
                </div>
                <div
                  id="settings-auto-trade-toggle"
                  className={`settings-toggle ${settings.autoTrade ? "on" : "off"}`}
                  onClick={() => setSettings((s) => ({ ...s, autoTrade: !s.autoTrade }))}
                  role="switch"
                  aria-checked={settings.autoTrade}
                >
                  <div className="settings-toggle-thumb" />
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-section" id="settings-notifications">
          <div className="settings-section-header">
            <Bell size={16} className="settings-section-icon" />
            <h2>Notifications</h2>
          </div>
          <div className="settings-field-group">
            <div className="settings-field">
              <label className="settings-toggle-label">
                <div className="settings-toggle-info">
                  <span>Enable Notifications</span>
                  <span className="settings-field-hint">Signal alerts, agent activity, trade fills</span>
                </div>
                <div
                  id="settings-notif-toggle"
                  className={`settings-toggle ${settings.notificationsEnabled ? "on" : "off"}`}
                  onClick={() => setSettings((s) => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                  role="switch"
                  aria-checked={settings.notificationsEnabled}
                >
                  <div className="settings-toggle-thumb" />
                </div>
              </label>
            </div>
            <div className="settings-field">
              <label>Telegram Chat ID</label>
              <input
                id="settings-telegram-input"
                type="text"
                placeholder="e.g. 123456789"
                value={settings.telegramChatId || ""}
                onChange={(e) => setSettings((s) => ({ ...s, telegramChatId: e.target.value || null }))}
                className="settings-text-input"
              />
              <p className="settings-field-hint">
                Message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="settings-link">@userinfobot</a> on Telegram to find your chat ID
              </p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger" id="settings-danger">
          <div className="settings-section-header">
            <AlertTriangle size={16} className="settings-section-icon danger" />
            <h2>Danger Zone</h2>
          </div>
          <div className="settings-field-group">
            <div className="settings-field">
              <div className="settings-danger-row">
                <div>
                  <p className="settings-danger-label">Disconnect Wallet</p>
                  <p className="settings-field-hint">Signs you out and clears the session cookie</p>
                </div>
                <button
                  id="settings-logout-btn"
                  className="settings-danger-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
