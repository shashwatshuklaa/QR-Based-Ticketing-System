const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    entryTime: { type: Date, default: Date.now },
    gateName: { type: String, required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    scannedOffline: { type: Boolean, default: false },
    syncedAt: { type: Date },
    deviceInfo: { type: String },
  },
  { timestamps: true }
);

entrySchema.index({ eventId: 1, entryTime: -1 });

module.exports = mongoose.model('Entry', entrySchema);
