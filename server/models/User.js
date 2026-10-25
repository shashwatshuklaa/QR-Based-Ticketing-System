const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  password: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }
}, { timestamps: true });

// Ensure an email cannot register twice for the same event
userSchema.index({ email: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
