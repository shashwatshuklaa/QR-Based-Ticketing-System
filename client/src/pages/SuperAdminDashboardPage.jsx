import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Crown,
  BarChart3,
  Calendar,
  Users,
  Plus,
  Trash2,
  LogOut,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [analytics, setAnalytics] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // New Event Form
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    ticketPrice: '',
    maxCapacity: '',
  });

  // New Admin Form
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    eventIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, adminsRes, eventsRes] = await Promise.all([
        fetch('/api/superadmin/analytics', { credentials: 'include' }),
        fetch('/api/superadmin/admins', { credentials: 'include' }),
        fetch('/api/events', { credentials: 'include' }),
      ]);

      if (analyticsRes.status === 401 || adminsRes.status === 401) {
        navigate('/super-admin');
        return;
      }

      const analyticsData = await analyticsRes.json();
      const adminsData = await adminsRes.json();
      const eventsData = await eventsRes.json();

      setAnalytics(analyticsData.analytics || []);
      setAdmins(adminsData.admins || []);
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData.events || []);
    } catch (e) {
      setToast({ message: 'Failed to load superadmin data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');

      setToast({ message: 'Event created successfully!', type: 'success' });
      setShowEventModal(false);
      setEventForm({
        name: '',
        description: '',
        venue: '',
        startDate: '',
        endDate: '',
        ticketPrice: '',
        maxCapacity: '',
      });
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteEvent = async (id, name) => {
    if (!window.confirm(`Delete event "${name}"?`)) return;
    try {
      const res = await fetch(`/api/superadmin/events/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setToast({ message: 'Event deleted', type: 'success' });
        loadData();
      }
    } catch (e) {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adminForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');

      setToast({ message: 'Admin account created successfully!', type: 'success' });
      setShowAdminModal(false);
      setAdminForm({ name: '', email: '', password: '', eventIds: [] });
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Delete admin account for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/superadmin/admins/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setToast({ message: 'Admin removed', type: 'success' });
        loadData();
      }
    } catch (e) {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/super-admin');
  };

  const totalRevenue = analytics.reduce((acc, a) => acc + (a.revenue || 0), 0);
  const totalTickets = analytics.reduce((acc, a) => acc + (a.totalTickets || 0), 0);
  const totalCheckedIn = analytics.reduce((acc, a) => acc + (a.checkedIn || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-16 transition-colors duration-300">
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Modal: Create Event */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Create New Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Event Name</label>
            <input
              type="text"
              required
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              placeholder="e.g. AI Hackathon 2026"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              placeholder="Event details..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Venue</label>
            <input
              type="text"
              required
              value={eventForm.venue}
              onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              placeholder="Convention Center"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                required
                value={eventForm.endDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Ticket Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={eventForm.ticketPrice}
                onChange={(e) => setEventForm({ ...eventForm, ticketPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
                placeholder="499"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Max Capacity</label>
              <input
                type="number"
                required
                min="1"
                value={eventForm.maxCapacity}
                onChange={(e) => setEventForm({ ...eventForm, maxCapacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
                placeholder="300"
              />
            </div>
          </div>
          <Button type="submit" className="w-full mt-4">
            Create & Publish Event
          </Button>
        </form>
      </Modal>

      {/* Modal: Create Admin Staff */}
      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title="Add Event Staff Admin"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Staff Name</label>
            <input
              type="text"
              required
              value={adminForm.name}
              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              placeholder="Security Gate Staff"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              placeholder="staff@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Assign to Events</label>
            <div className="space-y-2 max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-700 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
              {events.map((ev) => (
                <label key={ev._id} className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminForm.eventIds.includes(ev._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAdminForm({ ...adminForm, eventIds: [...adminForm.eventIds, ev._id] });
                      } else {
                        setAdminForm({
                          ...adminForm,
                          eventIds: adminForm.eventIds.filter((id) => id !== ev._id),
                        });
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500"
                  />
                  <span>{ev.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full mt-4">
            Save Admin Account
          </Button>
        </form>
      </Modal>

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 flex-shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Super Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign Out">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* Analytics Top Row */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Cross-Event Analytics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                <IndianRupee className="w-4 h-4" /> Total Gross Revenue
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" /> Total Tickets Issued
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalTickets}</h3>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                <CheckCircle2 className="w-4 h-4" /> Checked In Attendance
              </div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalCheckedIn}{' '}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({totalTickets > 0 ? ((totalCheckedIn / totalTickets) * 100).toFixed(0) : 0}%)
                </span>
              </h3>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Events & Analytics</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage all registered events and review gate performance</p>
            </div>
            <Button size="sm" onClick={() => setShowEventModal(true)}>
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Event Name</th>
                  <th className="px-4 py-3">Tickets Sold</th>
                  <th className="px-4 py-3">Checked In</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {analytics.map((a) => (
                  <tr key={a.eventId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">{a.eventName}</td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{a.totalTickets}</td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">
                      {a.checkedIn} ({a.checkInRate}%)
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-200">₹{a.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteEvent(a.eventId, a.eventName)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Management Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Admin Accounts & Gate Staff</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Authorize personnel for ticket scanning and gate management</p>
            </div>
            <Button size="sm" onClick={() => setShowAdminModal(true)}>
              <Plus className="w-4 h-4" />
              Add Staff Admin
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Login Email</th>
                  <th className="px-4 py-3">Assigned Events</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {admins.map((adm) => (
                  <tr key={adm._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">{adm.name}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400">{adm.email}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                      {adm.eventIds && adm.eventIds.length > 0
                        ? adm.eventIds.map((e) => e.name || e).join(', ')
                        : 'All Events'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteAdmin(adm._id, adm.name)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Remove admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
