import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import Button from './Button';

/**
 * Web Audio API synthesizer for instant audio feedback without external MP3 files
 */
export const playScanSound = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      // Pleasant high-pitched double-beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Low warning buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.error('Audio playback error:', e);
  }
};

export default function QRScanner({ onScan, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    initCameras();
    return () => {
      stopScanning();
    };
  }, []);

  const initCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setSelectedCamera(devices[0].id);
      } else {
        setErrorMsg('No camera found on this device');
      }
    } catch (err) {
      setErrorMsg('Camera permission denied or not accessible');
    }
  };

  const startScanning = async () => {
    setErrorMsg('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        selectedCamera || { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDetected(decodedText);
        },
        (err) => {
          // Continuous frame error, ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      setIsScanning(false);
    }
  };

  const handleDetected = (rawText) => {
    try {
      // Decode whether payload is JSON with qrId or plain qrId string
      let qrId = rawText;
      if (rawText.startsWith('{') && rawText.includes('qrId')) {
        const parsed = JSON.parse(rawText);
        qrId = parsed.qrId;
      }
      onScan(qrId);
    } catch (e) {
      onScan(rawText);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          <h3 className="font-bold text-gray-900 dark:text-white">Gate QR Scanner</h3>
        </div>

        {cameras.length > 1 && (
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            disabled={isScanning}
            className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-gray-900 dark:focus:border-gray-100"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {c.label || `Camera ${c.id}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Video Viewport Container */}
      <div className="relative overflow-hidden rounded-xl bg-black min-h-[300px] flex items-center justify-center">
        <div id={scannerContainerId} className="w-full" />
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-gray-950/90">
            <Camera className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm font-medium">Camera is currently inactive</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click start below to begin checking passes</p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex gap-3">
        {!isScanning ? (
          <Button onClick={startScanning} className="w-full">
            Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="danger" className="w-full">
            Stop Camera
          </Button>
        )}
      </div>
    </div>
  );
}
