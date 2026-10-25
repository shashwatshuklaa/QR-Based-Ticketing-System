const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Entry = require('../models/Entry');
const ActivityLog = require('../models/ActivityLog');
const { getUserFromRequest } = require('../utils/auth');

exports.getDashboardStats = async (req, res) => {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required' });
    }

    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const totalRegistered = await User.countDocuments({ eventId });
    const totalTickets = await Ticket.countDocuments({ eventId, paymentStatus: 'completed' });
    const checkedIn = await Ticket.countDocuments({ eventId, scanStatus: 'used' });
    const remaining = Math.max(0, totalTickets - checkedIn);

    const recentEntries = await Entry.find({ eventId })
      .populate('userId', 'name email')
      .sort({ entryTime: -1 })
      .limit(10);

    return res.status(200).json({
      stats: {
        totalRegistered,
        totalTickets,
        checkedIn,
        remaining,
      },
      recentEntries,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

exports.getAttendees = async (req, res) => {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required' });
    }

    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const users = await User.find({ eventId }).select('-password').sort({ createdAt: -1 });
    const tickets = await Ticket.find({ eventId });

    const ticketMap = new Map();
    tickets.forEach((t) => ticketMap.set(t.userId.toString(), t));

    const attendees = users.map((u) => {
      const ticket = ticketMap.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        dateOfBirth: u.dateOfBirth,
        createdAt: u.createdAt,
        ticket: ticket
          ? {
              _id: ticket._id,
              qrId: ticket.qrId,
              scanStatus: ticket.scanStatus,
              scannedAt: ticket.scannedAt,
              scannedAtGate: ticket.scannedAtGate,
              paymentStatus: ticket.paymentStatus,
            }
          : null,
      };
    });

    return res.status(200).json({ attendees });
  } catch (error) {
    console.error('Fetch attendees error:', error);
    return res.status(500).json({ error: 'Failed to fetch attendees' });
  }
};

exports.resetUserQR = async (req, res) => {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required' });
    }

    const userId = req.params.id;
    const ticket = await Ticket.findOne({ userId });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found for user' });
    }

    ticket.scanStatus = 'unused';
    ticket.scannedAt = undefined;
    ticket.scannedBy = undefined;
    ticket.scannedAtGate = undefined;
    await ticket.save();

    await Entry.deleteMany({ ticketId: ticket._id });

    await ActivityLog.create({
      adminId: admin.id,
      eventId: ticket.eventId,
      action: 'RESET_QR',
      targetType: 'ticket',
      targetId: ticket._id,
      details: `QR scan status reset for user ${userId}`,
    });

    return res.status(200).json({ message: 'QR scan status reset successfully' });
  } catch (error) {
    console.error('Reset QR error:', error);
    return res.status(500).json({ error: 'Failed to reset QR' });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required' });
    }

    const { eventId } = req.query;
    const filter = eventId ? { eventId } : {};

    const logs = await ActivityLog.find(filter)
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 })
      .limit(50);

    return res.status(200).json({ logs });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};
