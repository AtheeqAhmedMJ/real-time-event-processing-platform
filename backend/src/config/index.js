module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/eventplatform",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  KAFKA_TOPICS: {
    EVENTS: "platform.events",
    ALERTS: "platform.alerts",
    ANALYTICS: "platform.analytics",
  },
  CACHE_TTL: 60, // seconds
};
