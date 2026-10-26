import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  Users,
  CheckCircle,
  Clock,
  LogOut,
  Scan,
  RefreshCw,
} from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchDashboardData(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(apiUrl('/api/events'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.events || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0]._id);
        }
      }
    } catch (err) {
      setToast({ message: 'Failed to load events', type: 'error' });
    }
  };

  const fetchDashboardData = async (eventId) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/dashboard?eventId=${eventId}`), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentEntries(data.recentEntries || []);
      } else if (res.status === 401) {
        navigate('/admin');
      } else {
        setToast({ message: 'Failed to fetch dashboard data', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error loading stats', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-16 transition-colors duration-300">
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-gray-900 dark:text-white flex-shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Admin Event Console</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            to="/admin/scanner"
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Open Scanner</span>
          </Link>
          <Link
            to="/admin/registrations"
            className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Attendees</span>
          </Link>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign Out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Event Operations</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time gate check-ins and attendee statistics</p>
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Event:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium outline-none focus:border-gray-900 dark:focus:border-gray-100"
              >
                {events.map((e) => (
                  <option key={e._id} value={e._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Registered Users
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRegistered}</h3>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Total Tickets Sold
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</h3>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Checked In
              </p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.checkedIn}</h3>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Remaining Entries
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.remaining}</h3>
            </div>
          </div>
        )}

        {/* Recent Entries Feed */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Gate Check-Ins</h3>
            <button
              onClick={() => fetchDashboardData(selectedEventId)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {recentEntries.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentEntries.map((entry) => (
                <div key={entry._id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {entry.userId?.name || 'Attendee'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.userId?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {entry.gateName}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(entry.entryTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              No check-ins logged yet for this event. Open the scanner to begin!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
