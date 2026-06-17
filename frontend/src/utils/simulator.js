import { api } from "../hooks/useEventPlatform";

const TYPES = ["USER_ACTION", "SYSTEM", "ERROR", "PAYMENT", "SENSOR", "CUSTOM"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SOURCES = ["web-app", "mobile", "iot-sensor", "payment-service", "auth-service"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const simulateEvent = () => ({
  type: rand(TYPES),
  source: rand(SOURCES),
  severity: rand(SEVERITIES),
  payload: {
    userId: `user_${Math.floor(Math.random() * 1000)}`,
    action: rand(["login", "purchase", "view", "click", "error"]),
    value: +(Math.random() * 1000).toFixed(2),
  },
});

export const sendSingle = () => api.post("/events", simulateEvent());

export const sendBurst = async (count = 20) => {
  const events = Array.from({ length: count }, simulateEvent);
  return api.post("/events/batch", { events });
};
