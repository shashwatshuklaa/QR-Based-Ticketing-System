import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  WifiOff,
  UploadCloud,
  Camera,
  Keyboard,
} from 'lucide-react';
import QRScanner, { playScanSound } from '../components/QRScanner';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';

export default function AdminScannerPage() {
  const navigate = useNavigate();
  const [gateName, setGateName] = useState('Main Gate');
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Offline queue state
  const [offlineScans, setOfflineScans] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Load offline scans stored in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('offline_scans') || '[]');
      setOfflineScans(stored);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveOfflineQueue = (queue) => {
    setOfflineScans(queue);
    localStorage.setItem('offline_scans', JSON.stringify(queue));
  };

  const processScan = async (qrId) => {
    if (!qrId || loading) return;
    setLoading(true);
    setScanResult(null);

    // If browser is offline, queue locally
    if (!navigator.onLine) {
      const offlineEntry = {
        qrId,
        gateName,
        scannedAt: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
      };
      const newQueue = [...offlineScans, offlineEntry];
      saveOfflineQueue(newQueue);
      playScanSound('success');
      setScanResult({
        status: 'queued',
        message: 'Queued for offline sync (No internet connection)',
        ticket: { qrId },
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          qrId,
          gateName,
          scannedOffline: false,
          deviceInfo: navigator.userAgent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success
        playScanSound('success');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setScanResult({
          status: 'success',
          message: 'Entry Granted',
          ticket: data.ticket,
        });
      } else if (res.status === 401) {
        navigate('/admin');
      } else {
        // Warning or failure (duplicate scan / already used / invalid)
        playScanSound('error');
        if (navigator.vibrate) navigator.vibrate(300);
        setScanResult({
          status: 'error',
          message: data.error || 'Scan Rejected',
          details: data.scannedAt
            ? `Scanned at ${new Date(data.scannedAt).toLocaleTimeString()} via ${data.scannedAtGate}`
            : null,
        });
      }
    } catch (err) {
      // Network failed during request -> Queue offline
      const offlineEntry = {
        qrId,
        gateName,
        scannedAt: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
      };
      saveOfflineQueue([...offlineScans, offlineEntry]);
      playScanSound('success');
      setScanResult({
        status: 'queued',
        message: 'Network issue. Saved in offline queue.',
        ticket: { qrId },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleSyncOfflineQueue = async () => {
    if (offlineScans.length === 0 || isSyncing) return;
    setIsSyncing(true);

    try {
      const res = await fetch('/api/scanner/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ offlineScans }),
      });

      const data = await res.json();
      if (res.ok) {
        const syncedCount = data.results.synced.length;
        setToast({
          message: `Successfully synchronized ${syncedCount} offline scans!`,
          type: 'success',
        });
        saveOfflineQueue([]);
      } else {
        setToast({ message: data.error || 'Sync failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Sync connection failed', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
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
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        {/* Gate Selector & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden xs:inline">Gate:</span>
            <select
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-gray-900 dark:focus:border-gray-100"
            >
              <option value="Main Gate" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Main Gate</option>
              <option value="Gate 1 (North)" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Gate 1 (North)</option>
              <option value="Gate 2 (South)" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Gate 2 (South)</option>
              <option value="VIP Entrance" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">VIP Entrance</option>
            </select>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Offline Alert Bar */}
      {offlineScans.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-200">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>{offlineScans.length} scans queued offline</span>
          </div>
          <Button
            size="sm"
            onClick={handleSyncOfflineQueue}
            loading={isSyncing}
            className="text-xs py-1"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Sync Now
          </Button>
        </div>
      )}

      {/* Main Scanner Section */}
      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Live Camera Scanner */}
        <QRScanner onScan={(code) => processScan(code)} />

        {/* Scan Status Banner */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`p-5 rounded-2xl border ${
                scanResult.status === 'success'
                  ? 'bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200'
                  : scanResult.status === 'queued'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                  : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : scanResult.status === 'queued' ? (
                  <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-bold">{scanResult.message}</h4>
                  {scanResult.ticket?.userName && (
                    <p className="text-sm font-semibold mt-1">
                      Attendee: {scanResult.ticket.userName}
                    </p>
                  )}
                  {scanResult.details && (
                    <p className="text-xs opacity-80 mt-1">{scanResult.details}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Code Input (Great for desktop / laptop testing) */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <Keyboard className="w-4 h-4" />
            <span>Manual Code Entry</span>
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Paste or type QR ID..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-900 dark:focus:border-gray-100"
            />
            <Button type="submit" loading={loading} size="sm">
              Validate
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
