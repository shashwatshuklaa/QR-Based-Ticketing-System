const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    qrCode: { type: String, required: true },
    qrId: { type: String, required: true, unique: true },
    paymentId: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    amount: { type: Number, required: true },
    scanStatus: {
      type: String,
      enum: ['unused', 'used'],
      default: 'unused',
    },
    scannedAt: { type: Date },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    scannedAtGate: { type: String },
  },
  { timestamps: true }
);

ticketSchema.index({ userId: 1, eventId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
