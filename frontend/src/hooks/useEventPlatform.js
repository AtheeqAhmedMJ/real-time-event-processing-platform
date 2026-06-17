import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const api = axios.create({ baseURL: `${BASE}/api` });

// Singleton socket
let _socket = null;
const getSocket = () => {
  if (!_socket) _socket = io(BASE, { transports: ["websocket"] });
  return _socket;
};

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => {};
  }, [socket]);

  const on = useCallback((event, handler) => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket]);

  return { socket, connected, on };
};

export const useStats = () => {
  const [stats, setStats] = useState(null);
  const { on } = useSocket();

  useEffect(() => {
    api.get("/events/stats").then((r) => setStats(r.data));
    return on("stats:update", setStats);
  }, [on]);

  return stats;
};

export const useLiveEvents = (maxItems = 50) => {
  const [events, setEvents] = useState([]);
  const { on } = useSocket();

  useEffect(() => {
    api.get("/events?limit=20").then((r) =>
      setEvents(r.data.events || [])
    );
    return on("event:new", (e) =>
      setEvents((prev) => [e, ...prev].slice(0, maxItems))
    );
  }, [on, maxItems]);

  return events;
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [triggered, setTriggered] = useState([]);
  const { on } = useSocket();

  useEffect(() => {
    api.get("/events/alerts").then((r) => setAlerts(r.data));
    return on("alert:triggered", (a) =>
      setTriggered((prev) => [a, ...prev].slice(0, 20))
    );
  }, [on]);

  const toggle = async (id) => {
    const r = await api.patch(`/events/alerts/${id}/toggle`);
    setAlerts((prev) => prev.map((a) => (a._id === id ? r.data : a)));
  };

  const create = async (data) => {
    const r = await api.post("/events/alerts", data);
    setAlerts((prev) => [r.data, ...prev]);
  };

  return { alerts, triggered, toggle, create };
};
