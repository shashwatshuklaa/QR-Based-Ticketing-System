const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    action: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['user', 'ticket', 'event', 'admin'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

activityLogSchema.index({ eventId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
