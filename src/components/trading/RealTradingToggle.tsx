"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, DollarSign } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface RealTradingToggleProps {
  agentId: string;
  agentName: string;
  isEnabled: boolean;
  onToggle?: (enabled: boolean) => void;
}

export function RealTradingToggle({
  agentId,
  agentName,
  isEnabled: initialEnabled,
  onToggle,
}: RealTradingToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    // Show warning when enabling real trading
    if (enabled && !showWarning) {
      setShowWarning(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/toggle-trading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle trading");
      }

      const data = await res.json();
      setIsEnabled(enabled);
      setShowWarning(false);
      onToggle?.(enabled);
    } catch (error) {
      console.error("Error toggling trading:", error);
      alert("Failed to update trading mode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <DollarSign className="h-5 w-5 text-green-500" />
          ) : (
            <Shield className="h-5 w-5 text-blue-500" />
          )}
          <div>
            <Label htmlFor="real-trading" className="text-base font-medium">
              Real Trading Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "Agent will execute real trades with your wallet"
                : "Agent will only simulate trades (paper trading)"}
            </p>
          </div>
        </div>
        <Switch
          id="real-trading"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {/* Warning Alert (shown when trying to enable) */}
      {showWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ Warning: Real Money at Risk</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              You are about to enable <strong>real trading</strong> for{" "}
              <strong>{agentName}</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>This agent will use your wallet to execute real trades</li>
              <li>Real USDC will be spent on Polymarket</li>
              <li>You can lose money if predictions are wrong</li>
              <li>Spending limits still apply (per trade & daily)</li>
            </ul>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleToggle(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                disabled={isLoading}
              >
                {isLoading ? "Enabling..." : "I Understand, Enable Real Trading"}
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Display */}
      {isEnabled && !showWarning && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Real Trading Active</AlertTitle>
          <AlertDescription>
            This agent is executing real trades. Monitor its activity closely
            and pause it if needed.
          </AlertDescription>
        </Alert>
      )}

      {!isEnabled && !showWarning && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Safe Mode Active</AlertTitle>
          <AlertDescription>
            This agent is in simulation mode. No real money will be spent.
            Enable real trading when you're ready.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
