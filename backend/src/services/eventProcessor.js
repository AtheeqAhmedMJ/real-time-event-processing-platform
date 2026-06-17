const { v4: uuidv4 } = require("uuid");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const kafka = require("./kafka");
const redis = require("./redis");

let _io = null;
const setIO = (io) => { _io = io; };

// Ingest a raw event → Kafka → returns immediately (async)
const ingestEvent = async (data) => {
  const event = {
    eventId: uuidv4(),
    type: data.type || "CUSTOM",
    source: data.source || "api",
    severity: data.severity || "LOW",
    payload: data.payload || {},
    metadata: data.metadata || {},
    timestamp: new Date().toISOString(),
  };

  await kafka.publishEvent(kafka.config.EVENTS, event);
  return event;
};

// Process incoming event from Kafka consumer
const processEvent = async (event) => {
  // 1. Persist to MongoDB
  const doc = await Event.create({ ...event });

  // 2. Track rates in Redis
  await redis.trackEventRate(event.type);

  // 3. Buffer for fast dashboard reads
  await redis.bufferEvent(event);

  // 4. Check alert conditions
  await evaluateAlerts(event);

  // 5. Broadcast via WebSocket
  if (_io) {
    _io.emit("event:new", { ...event, _id: doc._id });
    _io.emit("stats:update", await getStats());
  }

  // Mark processed
  await Event.findOneAndUpdate({ eventId: event.eventId }, { processed: true, processedAt: new Date() });
};

// Evaluate active alerts against current counters
const evaluateAlerts = async (event) => {
  const alerts = await Alert.find({ active: true, "condition.eventType": event.type });
  for (const alert of alerts) {
    const count = await redis.getCounter(`events:${event.type}`, alert.condition.windowSeconds || 60);
    if (count >= (alert.condition.threshold || Infinity)) {
      await Alert.findByIdAndUpdate(alert._id, {
        $inc: { triggeredCount: 1 },
        lastTriggeredAt: new Date(),
      });
      if (_io) {
        _io.emit("alert:triggered", {
          alertId: alert.alertId,
          name: alert.name,
          eventType: event.type,
          count,
          triggeredAt: new Date(),
        });
      }
      // Publish alert event to Kafka
      await kafka.publishEvent(kafka.config.ALERTS, {
        eventId: uuidv4(),
        alertId: alert.alertId,
        name: alert.name,
        eventType: event.type,
        count,
        severity: event.severity,
      });
    }
  }
};

// Stats for dashboard (Redis-cached)
const getStats = async () => {
  const cached = await redis.get("dashboard:stats");
  if (cached) return cached;

  const types = ["USER_ACTION", "SYSTEM", "ERROR", "PAYMENT", "SENSOR", "CUSTOM"];
  const [rates, totalEvents, errorCount, criticalCount] = await Promise.all([
    redis.getEventRates(types),
    Event.countDocuments(),
    Event.countDocuments({ type: "ERROR" }),
    Event.countDocuments({ severity: "CRITICAL" }),
  ]);

  const stats = { rates, totalEvents, errorCount, criticalCount, updatedAt: new Date() };
  await redis.set("dashboard:stats", stats, 5);
  return stats;
};

// Analytics: event count grouped by type, last N hours
const getAnalytics = async (hours = 24) => {
  const since = new Date(Date.now() - hours * 3600 * 1000);
  const cacheKey = `analytics:${hours}h`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const result = await Event.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { type: "$type", hour: { $hour: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.hour": 1 } },
  ]);

  await redis.set(cacheKey, result, 30);
  return result;
};

module.exports = { ingestEvent, processEvent, getStats, getAnalytics, setIO };
