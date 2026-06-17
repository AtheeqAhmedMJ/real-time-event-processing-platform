const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["USER_ACTION", "SYSTEM", "ERROR", "PAYMENT", "SENSOR", "CUSTOM"],
      index: true,
    },
    source: { type: String, required: true },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: {
      ip: String,
      userAgent: String,
      userId: String,
    },
    processed: { type: Boolean, default: false, index: true },
    processedAt: Date,
  },
  { timestamps: true }
);

// TTL index — auto-delete events older than 7 days
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model("Event", eventSchema);
