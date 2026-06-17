import React, { useState } from "react";
import { sendSingle, sendBurst } from "../utils/simulator";
import { api } from "../hooks/useEventPlatform";

const TYPES = ["USER_ACTION", "SYSTEM", "ERROR", "PAYMENT", "SENSOR", "CUSTOM"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function SimulatorPanel() {
  const [status, setStatus] = useState("");
  const [custom, setCustom] = useState({ type: "USER_ACTION", source: "demo", severity: "LOW", payload: '{"msg":"hello"}' });
  const [loading, setLoading] = useState(false);

  const run = async (fn, label) => {
    setLoading(true);
    setStatus("Sending…");
    try {
      await fn();
      setStatus(`✅ ${label}`);
    } catch {
      setStatus("❌ Error — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const sendCustom = () => {
    let payload = {};
    try { payload = JSON.parse(custom.payload); } catch { payload = { raw: custom.payload }; }
    return run(() => api.post("/events", { ...custom, payload }), "Custom event sent");
  };

  return (
    <div className="card">
      <h3 className="card-title">Event Simulator</h3>
      <div className="sim-buttons">
        <button className="btn-primary" disabled={loading} onClick={() => run(sendSingle, "1 random event sent")}>
          Send 1 Event
        </button>
        <button className="btn-secondary" disabled={loading} onClick={() => run(() => sendBurst(20), "20 events sent")}>
          Burst × 20
        </button>
        <button className="btn-danger" disabled={loading} onClick={() => run(() => sendBurst(100), "100 events sent")}>
          Stress × 100
        </button>
      </div>

      <div className="custom-form">
        <h4>Custom Event</h4>
        <div className="form-row">
          <select value={custom.type} onChange={(e) => setCustom({ ...custom, type: e.target.value })}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={custom.severity} onChange={(e) => setCustom({ ...custom, severity: e.target.value })}>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input
            placeholder="source"
            value={custom.source}
            onChange={(e) => setCustom({ ...custom, source: e.target.value })}
          />
        </div>
        <textarea
          rows={2}
          placeholder='{"key":"value"}'
          value={custom.payload}
          onChange={(e) => setCustom({ ...custom, payload: e.target.value })}
        />
        <button className="btn-primary" disabled={loading} onClick={sendCustom}>
          Send Custom
        </button>
      </div>

      {status && <p className="sim-status">{status}</p>}
    </div>
  );
}
