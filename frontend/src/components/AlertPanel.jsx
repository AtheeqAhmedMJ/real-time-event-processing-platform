import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const TYPES = ["USER_ACTION", "SYSTEM", "ERROR", "PAYMENT", "SENSOR", "CUSTOM"];

export default function AlertPanel({ alerts, triggered, onToggle, onCreate }) {
  const [form, setForm] = useState({
    name: "", eventType: "ERROR", threshold: 10, windowSeconds: 60,
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    await onCreate({
      name: form.name,
      condition: {
        eventType: form.eventType,
        threshold: +form.threshold,
        windowSeconds: +form.windowSeconds,
      },
    });
    setCreating(false);
    setForm({ name: "", eventType: "ERROR", threshold: 10, windowSeconds: 60 });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Alert Rules</h3>
        <button className="btn-sm" onClick={() => setCreating(!creating)}>
          {creating ? "Cancel" : "+ New Alert"}
        </button>
      </div>

      {creating && (
        <form className="alert-form" onSubmit={handleCreate}>
          <input
            required placeholder="Alert name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input
            type="number" min={1} placeholder="Threshold"
            value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })}
          />
          <input
            type="number" min={10} placeholder="Window (sec)"
            value={form.windowSeconds} onChange={(e) => setForm({ ...form, windowSeconds: e.target.value })}
          />
          <button type="submit" className="btn-primary">Create</button>
        </form>
      )}

      <div className="alert-list">
        {alerts.map((a) => (
          <div key={a._id} className={`alert-item ${a.active ? "active" : "inactive"}`}>
            <div>
              <strong>{a.name}</strong>
              <span className="alert-cond">
                {a.condition.eventType} ≥ {a.condition.threshold} / {a.condition.windowSeconds}s
              </span>
              {a.lastTriggeredAt && (
                <span className="alert-last">
                  Last: {formatDistanceToNow(new Date(a.lastTriggeredAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <button className={`toggle-btn ${a.active ? "on" : "off"}`} onClick={() => onToggle(a._id)}>
              {a.active ? "ON" : "OFF"}
            </button>
          </div>
        ))}
        {alerts.length === 0 && <p className="empty">No alerts configured.</p>}
      </div>

      {triggered.length > 0 && (
        <div className="triggered-list">
          <h4>Recent Triggers</h4>
          {triggered.map((t, i) => (
            <div key={i} className="triggered-item">
              🔔 <strong>{t.name}</strong> — {t.count} events of {t.eventType}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
