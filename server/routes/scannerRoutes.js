const express = require('express');
const router = express.Router();
const { scanTicket, syncOfflineScans } = require('../controllers/scannerController');

// POST /api/scanner/scan - Real-time ticket QR scanning
router.post('/scan', scanTicket);

// POST /api/scanner/sync - Sync queued offline scans
router.post('/sync', syncOfflineScans);

module.exports = router;
