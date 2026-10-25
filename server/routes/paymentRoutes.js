const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  cancelPayment,
} = require('../controllers/paymentController');

// POST /api/payment/create-order
router.post('/create-order', createOrder);

// POST /api/payment/verify
router.post('/verify', verifyPayment);

// POST /api/payment/cancel
router.post('/cancel', cancelPayment);

module.exports = router;
