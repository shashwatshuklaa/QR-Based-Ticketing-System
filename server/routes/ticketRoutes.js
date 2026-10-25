const express = require('express');
const router = express.Router();
const { getMyTickets } = require('../controllers/ticketController');

// GET /api/tickets - Fetch all tickets for authenticated attendee
router.get('/', getMyTickets);

module.exports = router;
