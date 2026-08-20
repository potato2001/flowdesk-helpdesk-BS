"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = { day: string; created: number; resolved: number };

/**
 * Replaces the fixed-height CSS bars the dashboard used to draw. Colours come
 * from the design tokens so the chart follows light/dark with everything else.
 */
export function TicketTrendChart({ data }: { data: readonly TrendPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data]} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--foreground)" }}
          />
          <Bar
            dataKey="created"
            name="Ticket mới"
            fill="var(--primary)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="resolved"
            name="Đã xử lý"
            fill="var(--muted-foreground)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
            opacity={0.45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
