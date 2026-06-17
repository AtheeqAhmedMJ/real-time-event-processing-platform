const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    condition: {
      eventType: String,
      severity: String,
      threshold: Number,       // e.g. > 100 events/min
      windowSeconds: Number,   // rolling window
    },
    active: { type: Boolean, default: true },
    triggeredCount: { type: Number, default: 0 },
    lastTriggeredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
