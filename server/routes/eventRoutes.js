const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { isValidObjectId } = require('../utils/validation');

// GET /api/events - List all active events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true });
    res.json(events);
  } catch (error) {
    console.error("Fetch events error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/events/:id - Fetch single event details
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json({ event });
  } catch (error) {
    console.error("Fetch event error:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

module.exports = router;
