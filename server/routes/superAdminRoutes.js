const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAdmins,
  createAdmin,
  deleteAdmin,
  createEvent,
  deleteEvent,
} = require('../controllers/superAdminController');

// Analytics
router.get('/analytics', getAnalytics);

// Admin Management
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.delete('/admins/:id', deleteAdmin);

// Event Management
router.post('/events', createEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;
