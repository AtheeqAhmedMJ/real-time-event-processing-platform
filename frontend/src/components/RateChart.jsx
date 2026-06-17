import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = {
  USER_ACTION: "#6366f1",
  SYSTEM: "#3b82f6",
  ERROR: "#ef4444",
  PAYMENT: "#10b981",
  SENSOR: "#f59e0b",
  CUSTOM: "#8b5cf6",
};

export default function RateChart({ rates }) {
  if (!rates) return null;

  const data = Object.entries(rates)
    .filter(([k]) => k !== "total")
    .map(([name, value]) => ({ name: name.replace("_", " "), value, key: name }));

  return (
    <div className="card">
      <h3 className="card-title">Events per Minute (by type)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6 }}
            labelStyle={{ color: "#e2e8f0" }}
            itemStyle={{ color: "#94a3b8" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key] || "#6366f1"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
