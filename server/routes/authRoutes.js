const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  superAdminLogin,
  getMe,
  logout,
} = require('../controllers/authController');

// User Authentication
router.post('/register', register);
router.post('/login', login);

// Admin & Super Admin Authentication
router.post('/admin/login', adminLogin);
router.post('/superadmin/login', superAdminLogin);

// Session Check & Logout
router.get('/me', getMe);
router.post('/logout', logout);

module.exports = router;
