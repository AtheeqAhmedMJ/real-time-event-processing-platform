import React from "react";
import StatsCards from "./components/StatsCards";
import EventFeed from "./components/EventFeed";
import RateChart from "./components/RateChart";
import AlertPanel from "./components/AlertPanel";
import SimulatorPanel from "./components/SimulatorPanel";
import { useStats, useLiveEvents, useAlerts, useSocket } from "./hooks/useEventPlatform";
import "./index.css";

export default function App() {
  const stats = useStats();
  const events = useLiveEvents();
  const { alerts, triggered, toggle, create } = useAlerts();
  const { connected } = useSocket();

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">⚡ EventStream</span>
          <span className="tagline">Real-Time Event Processing Platform</span>
        </div>
        <div className={`ws-badge ${connected ? "connected" : "disconnected"}`}>
          {connected ? "● LIVE" : "○ DISCONNECTED"}
        </div>
      </header>

      <main className="main">
        <StatsCards stats={stats} />

        <div className="grid-2">
          <RateChart rates={stats?.rates} />
          <SimulatorPanel />
        </div>

        <div className="grid-2">
          <EventFeed events={events} />
          <AlertPanel
            alerts={alerts}
            triggered={triggered}
            onToggle={toggle}
            onCreate={create}
          />
        </div>
      </main>
    </div>
  );
}
