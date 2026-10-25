const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAttendees,
  resetUserQR,
  getActivityLogs,
} = require('../controllers/adminController');

// GET /api/admin/dashboard?eventId=...
router.get('/dashboard', getDashboardStats);

// GET /api/admin/users?eventId=...
router.get('/users', getAttendees);

// POST /api/admin/users/:id/reset-qr
router.post('/users/:id/reset-qr', resetUserQR);

// GET /api/admin/activity-logs?eventId=...
router.get('/activity-logs', getActivityLogs);

module.exports = router;
