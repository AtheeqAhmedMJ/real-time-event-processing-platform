const Redis = require("ioredis");
const config = require("../config");

const client = new Redis(config.REDIS_URL, { lazyConnect: true });

client.on("error", (e) => console.error("Redis error:", e.message));

const connect = async () => {
  await client.connect();
  console.log("✅ Redis connected");
};

// Generic cache
const get = async (key) => {
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
};

const set = async (key, value, ttl = config.CACHE_TTL) => {
  await client.setex(key, ttl, JSON.stringify(value));
};

const del = async (key) => client.del(key);

// Sliding window counter for rate / throughput tracking
const incrementCounter = async (key, windowSeconds = 60) => {
  const now = Date.now();
  const windowKey = `counter:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
  const count = await client.incr(windowKey);
  if (count === 1) await client.expire(windowKey, windowSeconds * 2);
  return count;
};

const getCounter = async (key, windowSeconds = 60) => {
  const now = Date.now();
  const windowKey = `counter:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
  return parseInt((await client.get(windowKey)) || "0", 10);
};

// Event rate per type (last 60s)
const trackEventRate = async (eventType) => {
  await incrementCounter(`events:${eventType}`, 60);
  await incrementCounter("events:total", 60);
};

const getEventRates = async (types) => {
  const rates = {};
  for (const t of types) {
    rates[t] = await getCounter(`events:${t}`, 60);
  }
  rates.total = await getCounter("events:total", 60);
  return rates;
};

// Buffer last N events per type for dashboard (ring buffer via Redis list)
const bufferEvent = async (event, maxSize = 100) => {
  const key = `buffer:${event.type}`;
  await client.lpush(key, JSON.stringify(event));
  await client.ltrim(key, 0, maxSize - 1);
  await client.expire(key, 3600);
};

const getBuffer = async (type, count = 20) => {
  const items = await client.lrange(`buffer:${type}`, 0, count - 1);
  return items.map((i) => JSON.parse(i));
};

module.exports = { connect, client, get, set, del, trackEventRate, getEventRates, bufferEvent, getBuffer };
