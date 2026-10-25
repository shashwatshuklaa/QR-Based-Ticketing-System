const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Entry = require('../models/Entry');
const Admin = require('../models/Admin');
const { getUserFromRequest, hashPassword } = require('../utils/auth');

exports.getAnalytics = async (req, res) => {
  try {
    const superAdmin = getUserFromRequest(req);
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(401).json({ error: 'Unauthorized. Super Admin access required' });
    }

    const events = await Event.find().sort({ createdAt: -1 });

    const analytics = await Promise.all(
      events.map(async (event) => {
        const totalUsers = await User.countDocuments({ eventId: event._id });
        const totalTickets = await Ticket.countDocuments({
          eventId: event._id,
          paymentStatus: 'completed',
        });
        const checkedIn = await Ticket.countDocuments({
          eventId: event._id,
          scanStatus: 'used',
        });

        const entries = await Entry.find({ eventId: event._id });
        const hourlyEntries = {};
        entries.forEach((entry) => {
          const hour = new Date(entry.entryTime).getHours();
          hourlyEntries[hour] = (hourlyEntries[hour] || 0) + 1;
        });

        return {
          eventId: event._id,
          eventName: event.name,
          totalUsers,
          totalTickets,
          checkedIn,
          remaining: Math.max(0, totalTickets - checkedIn),
          revenue: totalTickets * event.ticketPrice,
          checkInRate: totalTickets > 0 ? ((checkedIn / totalTickets) * 100).toFixed(1) : '0',
          hourlyEntries,
        };
      })
    );

    return res.status(200).json({ analytics });
  } catch (error) {
    console.error('Superadmin analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const superAdmin = getUserFromRequest(req);
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(401).json({ error: 'Unauthorized. Super Admin access required' });
    }

    const admins = await Admin.find().select('-password').populate('eventIds', 'name').sort({ createdAt: -1 });
    return res.status(200).json({ admins });
  } catch (error) {
    console.error('Fetch admins error:', error);
    return res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const superAdmin = getUserFromRequest(req);
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(401).json({ error: 'Unauthorized. Super Admin access required' });
    }

    const { name, email, password, eventIds } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'An admin with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      eventIds: eventIds || [],
    });

    return res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        eventIds: admin.eventIds,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ error: 'Failed to create admin' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const superAdmin = getUserFromRequest(req);
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(401).json({ error: 'Unauthorized. Super Admin access required' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ error: 'Failed to delete admin' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const superAdmin = getUserFromRequest(req);
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(401).json({ error: 'Unauthorized. Super Admin access required' });
    }

    const { name, description, startDate, endDate, venue, ticketPrice, maxCapacity } = req.body;
    if (!name || !description || !startDate || !endDate || !venue || ticketPrice === undefined || !maxCapacity) {
      return res.status(400).json({ error: 'All event fields are required' });
    }

    const event = await Event.create({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      venue,
      ticketPrice: Number(ticketPrice),
      maxCapacity: Number(maxCapacity),
      isActive: true,
    });

    return res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const superAdmin = getUserFromRequest(req);
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(401).json({ error: 'Unauthorized. Super Admin access required' });
    }

    await Event.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
};
