import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RotateCcw,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import { apiUrl } from '../utils/api';

export default function AdminRegistrationsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendees(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(apiUrl('/api/events'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.events || [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0]._id);
      }
    } catch (e) {
      setToast({ message: 'Failed to load events', type: 'error' });
    }
  };

  const fetchAttendees = async (eventId) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/users?eventId=${eventId}`), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
      } else {
        setToast({ message: 'Failed to fetch attendees', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetQR = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to reset the QR scan status for ${name}?`)) {
      return;
    }

    setResettingId(userId);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${userId}/reset-qr`), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `QR status reset successfully for ${name}`, type: 'success' });
        fetchAttendees(selectedEventId);
      } else {
        setToast({ message: data.error || 'Failed to reset QR', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Reset request failed', type: 'error' });
    } finally {
      setResettingId(null);
    }
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-16 transition-colors duration-300">
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900 dark:text-white hidden sm:block">Attendee Management</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Registered Attendees</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Search attendees, view QR check-in status, and reset pass status</p>
          </div>

          {events.length > 0 && (
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
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 flex items-center gap-3 transition-colors">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Attendees Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3.5">Attendee</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Ticket Status</th>
                  <th className="px-6 py-3.5">Entry Time</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredAttendees.length > 0 ? (
                  filteredAttendees.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{a.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">ID: {a._id.slice(-6)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 dark:text-gray-200">{a.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{a.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {a.ticket ? (
                          a.ticket.scanStatus === 'used' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Unused
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No Ticket</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                        {a.ticket?.scannedAt ? (
                          <>
                            {new Date(a.ticket.scannedAt).toLocaleTimeString()} ({a.ticket.scannedAtGate || 'Gate'})
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.ticket && a.ticket.scanStatus === 'used' && (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={resettingId === a._id}
                            onClick={() => handleResetQR(a._id, a.name)}
                            className="text-xs py-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset Pass
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      {loading ? 'Loading attendees...' : 'No attendees found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
