import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode,
  LogOut,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  MapPin,
  IndianRupee,
  Shield,
  Loader2,
} from 'lucide-react';
import Button from '../components/Button';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { safeJsonFetch } from '../utils/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchTickets();
    }
  }, [user, authLoading, navigate]);

  const fetchTickets = async () => {
    try {
      const data = await safeJsonFetch('/api/tickets', { credentials: 'include' });
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setToast({ message: error.message || 'Failed to fetch tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const downloadTicket = (ticket) => {
    const link = document.createElement('a');
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket._id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-16 transition-colors duration-300">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* QR Pass Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Official Event Pass"
      >
        {selectedTicket && (
          <div className="text-center py-2">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner mb-4 inline-block">
              <img
                src={selectedTicket.qrCode}
                alt="Ticket QR Code"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {selectedTicket.eventId?.name || 'Event Ticket'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-4">
              ID: {selectedTicket._id}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Present this QR code on your phone or printed ticket at the venue gate for check-in.
            </p>
            <Button
              onClick={() => downloadTicket(selectedTicket)}
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4" />
              Download QR Image
            </Button>
          </div>
        )}
      </Modal>

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-gray-900 dark:text-white flex-shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Attendee Dashboard</h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:inline">
            Hello, <strong className="text-gray-900 dark:text-white">{user?.name || user?.email}</strong>
          </span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-sm" aria-label="Sign Out">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Tickets</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View, display, and download your entry passes
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center text-sm font-medium bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Browse More Events
          </Link>
        </div>

        {tickets.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {ticket.eventId?.name || 'Event'}
                    </h3>
                    {ticket.scanStatus === 'used' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Valid / Unused
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-4">
                    TICKET #{ticket._id.slice(-8).toUpperCase()}
                  </p>

                  <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-xl mb-6">
                    {ticket.eventId?.venue && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>{ticket.eventId.venue}</span>
                      </div>
                    )}
                    {ticket.eventId?.startDate && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>{new Date(ticket.eventId.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <IndianRupee className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>Paid: ₹{ticket.amount}</span>
                    </div>

                    {ticket.scannedAt && (
                      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                        Entry logged at{' '}
                        <strong>{new Date(ticket.scannedAt).toLocaleTimeString()}</strong> at gate{' '}
                        <strong>{ticket.scannedAtGate || 'Main Gate'}</strong>.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowQRModal(true);
                    }}
                    variant="outline"
                    className="flex-1 text-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    View QR Pass
                  </Button>
                  <Button
                    onClick={() => downloadTicket(ticket)}
                    className="flex-1 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 max-w-lg mx-auto transition-colors">
            <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Tickets Found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You haven't purchased any tickets yet. Browse available events and register now!
            </p>
            <Link
              to="/"
              className="inline-block bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Browse Events
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
