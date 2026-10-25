const mongoose = require('mongoose');

// This defines exactly what information an "Event" must have in our database.
// It is based on the 'models/Event.ts' file from the original project.
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an event name']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  venue: {
    type: String,
    required: [true, 'Please add a venue']
  },
  ticketPrice: {
    type: Number,
    required: [true, 'Please add a ticket price']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Please add maximum capacity']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  // This automatically adds "createdAt" and "updatedAt" times to each record
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
