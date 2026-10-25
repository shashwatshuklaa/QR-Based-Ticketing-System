import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/80 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/80 dark:border-red-800 dark:text-red-200',
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/80 dark:border-blue-800 dark:text-blue-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl ${colors[type] || colors.info} shadow-lg min-w-[300px] max-w-md`}
    >
      <div className="flex-shrink-0">{icons[type] || icons.info}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
