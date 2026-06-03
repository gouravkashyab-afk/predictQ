"use client";

import { useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import type { TradingPreferences } from "@/lib/user-preferences";

interface TradingPreferencesFormProps {
  userId: string;
}

export function TradingPreferencesForm({ userId }: TradingPreferencesFormProps) {
  const [preferences, setPreferences] = useState<TradingPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/preferences", {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const data = await res.json();
      setPreferences(data.preferences);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!res.ok) throw new Error("Failed to save preferences");

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof TradingPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-red-500">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trading Preferences</h2>
          <p className="text-muted-foreground">Customize your risk limits and trading rules</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Save Status */}
      {saveStatus === "success" && (
        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700 dark:text-green-300">Preferences saved successfully!</span>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950 border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700 dark:text-red-300">Failed to save preferences. Please try again.</span>
        </div>
      )}

      {/* Paper Trading Mode */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">💰 Trading Mode</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Paper Trading Mode</label>
              <p className="text-sm text-muted-foreground">
                Use virtual money to test strategies risk-free
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.paperTradingMode}
                onChange={(e) => updatePreference("paperTradingMode", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.paperTradingMode && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Paper Trading Balance
              </label>
              <input
                type="number"
                value={preferences.paperTradingBalance}
                onChange={(e) =>
                  updatePreference("paperTradingBalance", Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-md"
                min="100"
                step="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Starting virtual balance for paper trading
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Per-Trade Limits */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">💵 Per-Trade Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Per Trade ($)
            </label>
            <input
              type="number"
              value={preferences.maxPerTrade}
              onChange={(e) => updatePreference("maxPerTrade", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum amount per single trade
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Min Per Trade ($)
            </label>
            <input
              type="number"
              value={preferences.minPerTrade}
              onChange={(e) => updatePreference("minPerTrade", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum amount per single trade
            </p>
          </div>
        </div>
      </div>

      {/* Daily Limits */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">📅 Daily Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Daily Spend ($)
            </label>
            <input
              type="number"
              value={preferences.maxDailySpend}
              onChange={(e) => updatePreference("maxDailySpend", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Daily Loss ($)
            </label>
            <input
              type="number"
              value={preferences.maxDailyLoss}
              onChange={(e) => updatePreference("maxDailyLoss", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Stop trading if lose this much in a day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Daily Trades
            </label>
            <input
              type="number"
              value={preferences.maxDailyTrades}
              onChange={(e) => updatePreference("maxDailyTrades", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Period Limits */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">📊 Period Limits (Week/Month)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Period Loss ($)
            </label>
            <input
              type="number"
              value={preferences.maxPeriodLoss}
              onChange={(e) => updatePreference("maxPeriodLoss", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Stop if lose this much over the period
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Period (Days)
            </label>
            <input
              type="number"
              value={preferences.periodDays}
              onChange={(e) => updatePreference("periodDays", Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
              max="30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              7 = weekly, 30 = monthly
            </p>
          </div>
        </div>
      </div>

      {/* Stop Loss / Take Profit */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">🎯 Stop Loss / Take Profit</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Stop Loss (%)
              </label>
              <input
                type="number"
                value={preferences.stopLossPercentage}
                onChange={(e) =>
                  updatePreference("stopLossPercentage", Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-close position at this % loss
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Take Profit (%)
              </label>
              <input
                type="number"
                value={preferences.takeProfitPercentage}
                onChange={(e) =>
                  updatePreference("takeProfitPercentage", Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-close position at this % profit
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <label className="font-medium">Use Trailing Stop</label>
              <p className="text-sm text-muted-foreground">
                Lock in profits as price moves in your favor
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.useTrailingStop}
                onChange={(e) => updatePreference("useTrailingStop", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.useTrailingStop && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Trailing Stop (%)
              </label>
              <input
                type="number"
                value={preferences.trailingStopPercentage}
                onChange={(e) =>
                  updatePreference("trailingStopPercentage", Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Close if price drops this % from highest point
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Position Management */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">📈 Position Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Open Positions
            </label>
            <input
              type="number"
              value={preferences.maxOpenPositions}
              onChange={(e) =>
                updatePreference("maxOpenPositions", Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-md"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max % Per Market
            </label>
            <input
              type="number"
              value={preferences.maxExposurePerMarket}
              onChange={(e) =>
                updatePreference("maxExposurePerMarket", Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-md"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max % Per Category
            </label>
            <input
              type="number"
              value={preferences.maxExposurePerCategory}
              onChange={(e) =>
                updatePreference("maxExposurePerCategory", Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-md"
              min="1"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Market Filters */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">🎲 Market Filters</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Min Signal Confidence (%)
            </label>
            <input
              type="number"
              value={preferences.minSignalConfidence}
              onChange={(e) =>
                updatePreference("minSignalConfidence", Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-md"
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only trade signals above this confidence level
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Required Signal Consensus
            </label>
            <input
              type="number"
              value={preferences.requiredSignalConsensus}
              onChange={(e) =>
                updatePreference("requiredSignalConsensus", Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-md"
              min="1"
              max="3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Require X signals to agree before trading
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Min Market Liquidity ($)
            </label>
            <input
              type="number"
              value={preferences.minMarketLiquidity}
              onChange={(e) =>
                updatePreference("minMarketLiquidity", Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-md"
              min="0"
              step="1000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only trade markets with at least this much liquidity
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">🔔 Notifications</h3>
        <div className="space-y-4">
          {/* Notification Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Notify on every trade</label>
              <input
                type="checkbox"
                checked={preferences.notifyOnTrade}
                onChange={(e) => updatePreference("notifyOnTrade", e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Notify on profitable trades</label>
              <input
                type="checkbox"
                checked={preferences.notifyOnProfitableTrade}
                onChange={(e) =>
                  updatePreference("notifyOnProfitableTrade", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Notify on losses</label>
              <input
                type="checkbox"
                checked={preferences.notifyOnLoss}
                onChange={(e) => updatePreference("notifyOnLoss", e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Daily summary</label>
              <input
                type="checkbox"
                checked={preferences.notifyDailySummary}
                onChange={(e) =>
                  updatePreference("notifyDailySummary", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Weekly summary</label>
              <input
                type="checkbox"
                checked={preferences.notifyWeeklySummary}
                onChange={(e) =>
                  updatePreference("notifyWeeklySummary", e.target.checked)
                }
                className="h-4 w-4"
              />
            </div>
          </div>

          {/* Notification Channels */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Notification Channels</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">📧 Email</label>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) =>
                    updatePreference("emailNotifications", e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">🔔 Push (In-App)</label>
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) =>
                    updatePreference("pushNotifications", e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">📱 Telegram</label>
                <input
                  type="checkbox"
                  checked={preferences.telegramNotifications}
                  onChange={(e) =>
                    updatePreference("telegramNotifications", e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>

              {preferences.telegramNotifications && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={preferences.telegramChatId || ""}
                    onChange={(e) => updatePreference("telegramChatId", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Your Telegram Chat ID"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your Chat ID from @userinfobot on Telegram
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
        >
          <Save className="h-5 w-5" />
          {isSaving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
