import React from "react";

const CARDS = [
  { key: "totalEvents", label: "Total Events", icon: "⚡", color: "#6366f1" },
  { key: "errorCount", label: "Errors", icon: "❌", color: "#ef4444" },
  { key: "criticalCount", label: "Critical", icon: "🔴", color: "#f97316" },
];

export default function StatsCards({ stats }) {
  if (!stats) return <div className="stats-grid loading">Loading stats…</div>;

  const total1min = stats.rates?.total || 0;

  return (
    <div className="stats-grid">
      {CARDS.map(({ key, label, icon, color }) => (
        <div key={key} className="stat-card" style={{ "--accent": color }}>
          <span className="stat-icon">{icon}</span>
          <div>
            <div className="stat-value">{(stats[key] || 0).toLocaleString()}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
      ))}
      <div className="stat-card" style={{ "--accent": "#10b981" }}>
        <span className="stat-icon">📈</span>
        <div>
          <div className="stat-value">{total1min}</div>
          <div className="stat-label">Events / min</div>
        </div>
      </div>
    </div>
  );
}
