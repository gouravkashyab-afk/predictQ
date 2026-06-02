"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PricePoint } from "@/lib/polymarket";

interface PriceChartProps {
  data: PricePoint[];
  interval?: string;
}

function formatTimestamp(ts: number, interval: string): string {
  const d = new Date(ts * 1000);
  if (interval === "1m" || interval === "1h") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
  interval: string;
}

function CustomTooltip({ active, payload, label, interval }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-price">{Math.round(payload[0].value * 100)}¢</div>
      <div className="chart-tooltip-time">{formatTimestamp(label, interval)}</div>
    </div>
  );
}

export default function PriceChart({ data, interval = "1w" }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <span>No price history available</span>
      </div>
    );
  }

  const minPrice = Math.min(...data.map((d) => d.p));
  const maxPrice = Math.max(...data.map((d) => d.p));
  const isUp = data[data.length - 1]?.p >= data[0]?.p;

  const color = isUp ? "#4ade80" : "#f87171";

  // Sample data to at most 120 points for performance
  const sampled =
    data.length > 120
      ? data.filter((_, i) => i % Math.floor(data.length / 120) === 0)
      : data;

  return (
    <div className="price-chart">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={sampled}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickFormatter={(v) => formatTimestamp(v as number, interval)}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={50}
          />
          <YAxis
            domain={[Math.max(0, minPrice - 0.05), Math.min(1, maxPrice + 0.05)]}
            tickFormatter={(v) => `${Math.round((v as number) * 100)}¢`}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            content={<CustomTooltip interval={interval} />}
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="p"
            stroke={color}
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
