const Ticket = require('../models/Ticket');
const Entry = require('../models/Entry');
const Event = require('../models/Event');
const { getUserFromRequest } = require('../utils/auth');
const { validateQRExpiry } = require('../utils/qr');

exports.scanTicket = async (req, res) => {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required' });
    }

    const { qrId, gateName, scannedOffline, deviceInfo } = req.body;

    if (!qrId || !gateName) {
      return res.status(400).json({ error: 'QR ID and gate name are required' });
    }

    const ticket = await Ticket.findOne({ qrId })
      .populate('eventId')
      .populate('userId', 'name email phone');

    if (!ticket) {
      return res.status(404).json({ error: 'Invalid QR code', status: 'invalid' });
    }

    // 1. Prevent duplicate scans / already used tickets
    if (ticket.scanStatus === 'used') {
      const recentEntry = await Entry.findOne({
        ticketId: ticket._id,
        gateName,
      }).sort({ entryTime: -1 });

      if (recentEntry) {
        const timeDiff = Date.now() - new Date(recentEntry.entryTime).getTime();
        if (timeDiff < 60000) {
          return res.status(400).json({
            error: 'Ticket just scanned. Please wait',
            status: 'duplicate-scan',
            scannedAt: recentEntry.entryTime,
            scannedAtGate: gateName,
          });
        }
      }

      return res.status(400).json({
        error: 'Ticket already used',
        status: 'already-used',
        scannedAt: ticket.scannedAt,
        scannedAtGate: ticket.scannedAtGate,
      });
    }

    // 2. Event date / time window validation
    const event = ticket.eventId;
    if (event && !validateQRExpiry(event.qrValidityStart, event.qrValidityEnd)) {
      return res.status(400).json({
        error: 'Ticket is not valid at this time',
        status: 'expired',
      });
    }

    // 3. Mark ticket as used atomically
    ticket.scanStatus = 'used';
    ticket.scannedAt = new Date();
    ticket.scannedBy = admin.id;
    ticket.scannedAtGate = gateName;
    await ticket.save();

    // 4. Create verified entry record
    const entry = await Entry.create({
      ticketId: ticket._id,
      userId: ticket.userId._id,
      eventId: event._id,
      gateName,
      scannedBy: admin.id,
      scannedOffline: !!scannedOffline,
      deviceInfo: deviceInfo || 'web-scanner',
    });

    console.log(`[Scanner] Entry granted for ticket ${ticket._id} at ${gateName}`);

    return res.status(200).json({
      message: 'Entry granted',
      status: 'success',
      ticket: {
        id: ticket._id,
        userName: ticket.userId.name,
        userEmail: ticket.userId.email,
        eventName: event.name,
        scannedAt: ticket.scannedAt,
        scannedAtGate: gateName,
      },
      entry,
    });
  } catch (error) {
    console.error('Scan ticket error:', error);
    return res.status(500).json({ error: 'Scan processing failed' });
  }
};

exports.syncOfflineScans = async (req, res) => {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required' });
    }

    const { offlineScans } = req.body;
    if (!Array.isArray(offlineScans)) {
      return res.status(400).json({ error: 'Invalid data format. Array expected' });
    }

    const results = { synced: [], failed: [], duplicates: [] };

    for (const scan of offlineScans) {
      try {
        const { qrId, gateName, scannedAt, deviceInfo } = scan;
        if (!qrId || !gateName || !scannedAt) {
          results.failed.push({ qrId: qrId || 'unknown', reason: 'Missing required scan fields' });
          continue;
        }

        const ticket = await Ticket.findOne({ qrId }).populate('eventId');
        if (!ticket) {
          results.failed.push({ qrId, reason: 'Ticket not found' });
          continue;
        }

        // Duplicate entry check
        const existingEntry = await Entry.findOne({
          ticketId: ticket._id,
          gateName,
          entryTime: new Date(scannedAt),
        });

        if (existingEntry) {
          results.duplicates.push({ qrId, reason: 'Already synced' });
          continue;
        }

        // Check if previously scanned before this offline timestamp
        if (ticket.scanStatus === 'used' && ticket.scannedAt && new Date(ticket.scannedAt) < new Date(scannedAt)) {
          results.failed.push({ qrId, reason: 'Ticket was already scanned earlier online' });
          continue;
        }

        // Update ticket
        ticket.scanStatus = 'used';
        ticket.scannedAt = new Date(scannedAt);
        ticket.scannedBy = admin.id;
        ticket.scannedAtGate = gateName;
        await ticket.save();

        await Entry.create({
          ticketId: ticket._id,
          userId: ticket.userId,
          eventId: ticket.eventId._id,
          entryTime: new Date(scannedAt),
          gateName,
          scannedBy: admin.id,
          scannedOffline: true,
          syncedAt: new Date(),
          deviceInfo,
        });

        results.synced.push({ qrId });
      } catch (err) {
        results.failed.push({ qrId: scan.qrId || 'unknown', reason: err.message });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Sync offline scans error:', error);
    return res.status(500).json({ error: 'Failed to sync offline scans' });
  }
};
