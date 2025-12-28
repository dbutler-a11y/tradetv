"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface EquityCurveProps {
  data?: { date: string; equity: number; pnl: number }[];
  height?: number;
}

// Generate demo equity curve data
function generateDemoData(): { date: string; equity: number; pnl: number }[] {
  const data = [];
  let equity = 50000; // Starting equity
  const today = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate realistic trading P&L with slight upward trend
    const dailyPnl = (Math.random() - 0.45) * 800; // Slight positive bias
    equity += dailyPnl;

    // Ensure equity doesn't go negative
    equity = Math.max(equity, 25000);

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      equity: Math.round(equity),
      pnl: Math.round(dailyPnl),
    });
  }

  return data;
}

export function EquityCurve({ data, height = 300 }: EquityCurveProps) {
  const chartData = data || generateDemoData();

  const minEquity = Math.min(...chartData.map((d) => d.equity));
  const maxEquity = Math.max(...chartData.map((d) => d.equity));
  const padding = (maxEquity - minEquity) * 0.1;

  const startEquity = chartData[0]?.equity || 0;
  const endEquity = chartData[chartData.length - 1]?.equity || 0;
  const totalReturn = ((endEquity - startEquity) / startEquity) * 100;
  const isPositive = totalReturn >= 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Starting: </span>
          <span className="font-medium">${startEquity.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Current: </span>
          <span className="font-medium">${endEquity.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Return: </span>
          <span className={`font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{totalReturn.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? "#22c55e" : "#ef4444"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? "#22c55e" : "#ef4444"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            domain={[minEquity - padding, maxEquity + padding]}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium">{data.date}</p>
                    <p className="text-sm">
                      Equity: <span className="font-medium">${data.equity.toLocaleString()}</span>
                    </p>
                    <p className={`text-sm ${data.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      Daily P&L: {data.pnl >= 0 ? "+" : ""}${data.pnl.toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill="url(#equityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
