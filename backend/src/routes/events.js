const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const processor = require("../services/eventProcessor");
const redis = require("../services/redis");

// POST /api/events — ingest single event
router.post("/", async (req, res) => {
  try {
    const event = await processor.ingestEvent({
      ...req.body,
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] },
    });
    res.status(202).json({ success: true, eventId: event.eventId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/batch — ingest up to 100 events
router.post("/batch", async (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events) || events.length > 100)
    return res.status(400).json({ error: "events must be array of max 100" });

  const results = await Promise.allSettled(events.map((e) => processor.ingestEvent(e)));
  const accepted = results.filter((r) => r.status === "fulfilled").length;
  res.status(202).json({ accepted, total: events.length });
});

// GET /api/events — paginated list
router.get("/", async (req, res) => {
  const { page = 1, limit = 20, type, severity } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (severity) filter.severity = severity;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit).lean(),
    Event.countDocuments(filter),
  ]);
  res.json({ events, total, page: +page, pages: Math.ceil(total / limit) });
});

// GET /api/events/stream/:type — buffered events from Redis
router.get("/stream/:type", async (req, res) => {
  const events = await redis.getBuffer(req.params.type.toUpperCase(), 50);
  res.json(events);
});

// GET /api/events/stats
router.get("/stats", async (req, res) => {
  const stats = await processor.getStats();
  res.json(stats);
});

// GET /api/events/analytics
router.get("/analytics", async (req, res) => {
  const data = await processor.getAnalytics(req.query.hours || 24);
  res.json(data);
});

// ---- Alerts ----
router.get("/alerts", async (req, res) => {
  res.json(await Alert.find().sort({ createdAt: -1 }));
});

router.post("/alerts", async (req, res) => {
  const alert = await Alert.create({ alertId: uuidv4(), ...req.body });
  res.status(201).json(alert);
});

router.patch("/alerts/:id/toggle", async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) return res.status(404).json({ error: "Not found" });
  alert.active = !alert.active;
  await alert.save();
  res.json(alert);
});

module.exports = router;
