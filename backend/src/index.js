require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const config = require("./config");
const kafkaService = require("./services/kafka");
const redisService = require("./services/redis");
const processor = require("./services/eventProcessor");
const eventRoutes = require("./routes/events");

const app = express();
const server = http.createServer(app);

// ---- Socket.io ----
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

// Inject io into processor so it can broadcast
processor.setIO(io);

io.on("connection", (socket) => {
  console.log(`WS client connected: ${socket.id}`);
  // Send current stats on connect
  processor.getStats().then((s) => socket.emit("stats:update", s));
  socket.on("disconnect", () => console.log(`WS client disconnected: ${socket.id}`));
});

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ---- Routes ----
app.use("/api/events", eventRoutes);
app.get("/health", (_, res) => res.json({ status: "ok", time: new Date() }));

// ---- Kafka Consumer Handlers ----
const kafkaHandlers = {
  [kafkaService.config.EVENTS]: processor.processEvent,
  [kafkaService.config.ALERTS]: async (msg) => {
    console.log(`🔔 Alert triggered: ${msg.name} (${msg.count} events)`);
  },
};

// ---- Bootstrap ----
const start = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ MongoDB connected");

    await redisService.connect();
    await kafkaService.connect();
    await kafkaService.startConsumer(kafkaHandlers);

    server.listen(config.PORT, () =>
      console.log(`🚀 Server running on port ${config.PORT}`)
    );
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  await kafkaService.disconnect();
  await redisService.client.quit();
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});

start();
