import React from "react";
import { formatDistanceToNow } from "date-fns";

const SEV_COLOR = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444" };
const TYPE_ICON = {
  USER_ACTION: "👤", SYSTEM: "⚙️", ERROR: "❌", PAYMENT: "💳", SENSOR: "📡", CUSTOM: "🔷",
};

export default function EventFeed({ events }) {
  return (
    <div className="card">
      <h3 className="card-title">Live Event Stream</h3>
      <div className="feed">
        {events.length === 0 && <p className="empty">No events yet. Send some!</p>}
        {events.map((e) => (
          <div key={e.eventId || e._id} className="feed-item">
            <span className="feed-icon">{TYPE_ICON[e.type] || "🔷"}</span>
            <div className="feed-body">
              <div className="feed-header">
                <span className="feed-type">{e.type}</span>
                <span className="feed-src">{e.source}</span>
              </div>
              <div className="feed-meta">
                <span
                  className="feed-sev"
                  style={{ color: SEV_COLOR[e.severity] }}
                >
                  {e.severity}
                </span>
                <span className="feed-time">
                  {formatDistanceToNow(new Date(e.timestamp || e.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
