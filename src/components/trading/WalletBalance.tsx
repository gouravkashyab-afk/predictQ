"use client";

import { useEffect, useState } from "react";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletBalanceProps {
  userId: string;
}

export function WalletBalance({ userId }: WalletBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/balance", {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Failed to load balance");
      setBalance(0); // Default to 0 on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  if (error && balance === null) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg bg-card">
        <Wallet className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{error}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchBalance}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <Wallet className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm text-muted-foreground">USDC Balance (Polygon)</p>
          <p className="text-2xl font-bold">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `$${balance?.toFixed(2) || "0.00"}`
            )}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={fetchBalance}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
