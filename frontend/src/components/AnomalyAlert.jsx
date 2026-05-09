import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export default function AnomalyAlert({ alert }) {
  const [visible, setVisible] = useState(true)
  if (!visible || !alert) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FF4F4F]/10 border border-[#FF4F4F]/30 border-l-[4px] border-l-[#FF4F4F] p-4 mb-8 rounded flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-[#FF4F4F] animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#FF4F4F] animate-ping opacity-75" />
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF4F4F]" />
          <span className="font-mono text-xs font-bold text-[#FF4F4F] uppercase tracking-widest">Anomaly Detected:</span>
          <span className="font-body text-sm text-white">
            Asset {alert.owner_name || 'UNKNOWN'} is spreading without authorization ({alert.detection_count} detections in 24h)
          </span>
        </div>
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="text-white/40 hover:text-white transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

