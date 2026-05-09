import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ResultCard({ verdict, confidenceScore, matchedOwner, sportCategory, uploadedAt }) {
  const [displayedPercentage, setDisplayedPercentage] = useState(0)
  const targetPercentage = Math.min(100, Math.max(0, Math.round(confidenceScore * 100)))
  const circumference = 2 * Math.PI * 54

  useEffect(() => {
    let current = 0
    const increment = targetPercentage / 30
    const timer = setInterval(() => {
      current += increment
      if (current >= targetPercentage) {
        setDisplayedPercentage(targetPercentage)
        clearInterval(timer)
      } else {
        setDisplayedPercentage(Math.round(current))
      }
    }, 30)
    return () => clearInterval(timer)
  }, [targetPercentage])

  const dashOffset = circumference - (displayedPercentage / 100) * circumference

  const verdictColors = {
    Pirated: { bg: 'bg-dap-danger', glow: 'shadow-lg shadow-dap-danger/50' },
    Suspicious: { bg: 'bg-dap-accent', glow: 'shadow-lg shadow-dap-accent/50' },
    Original: { bg: 'bg-dap-success', glow: 'shadow-lg shadow-dap-success/50' },
    Unknown: { bg: 'bg-dap-text-secondary', glow: 'shadow-lg shadow-dap-text-secondary/30' },
  }
  const colors = verdictColors[verdict] || verdictColors.Unknown

  return (
    <motion.div
      className="border border-dap-border bg-dap-bg/50 backdrop-blur-sm p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-6">
          {/* Verdict badge with pulsing animation */}
          <motion.div
            className={`inline-block px-6 py-3 font-mono text-xs uppercase tracking-widest text-white ${colors.bg} ${colors.glow}`}
            animate={verdict === 'Pirated' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            [{verdict.toUpperCase()}]
          </motion.div>

          {/* Confidence percentage with count-up */}
          <div className="space-y-2">
            <motion.div className="text-5xl font-mono font-bold text-dap-primary">
              {displayedPercentage}%
            </motion.div>
            <p className="font-mono text-xs text-dap-text-secondary uppercase tracking-[0.2em]">Confidence Score</p>
          </div>
        </div>

        {/* Circular progress ring */}
        <motion.div
          className="relative h-48 w-48"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <svg viewBox="0 0 120 120" className="h-full w-full">
            {/* Static background ring */}
            <circle cx="60" cy="60" r="54" className="stroke-dap-border fill-transparent stroke-[8]" />
            
            {/* Animated progress ring */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="transparent"
              stroke="#3A6EA5"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>

          {/* Center stats */}
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <p className="font-mono text-2xl font-bold text-dap-primary">{displayedPercentage}%</p>
              <p className="font-mono text-xs text-dap-text-secondary uppercase tracking-[0.15em]">match</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info cards */}
      <motion.div
        className="mt-10 grid gap-4 sm:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div
          className="border-l-4 border-dap-primary bg-dap-border/20 p-4"
          whileHover={{ x: 4 }}
        >
          <p className="font-mono text-xs text-dap-text-secondary uppercase tracking-[0.15em]">[Owner]</p>
          <p className="mt-2 font-mono text-sm text-dap-text-primary">{matchedOwner || 'UNKNOWN'}</p>
        </motion.div>

        <motion.div
          className="border-l-4 border-dap-accent bg-dap-border/20 p-4"
          whileHover={{ x: 4 }}
        >
          <p className="font-mono text-xs text-dap-text-secondary uppercase tracking-[0.15em]">[Sport]</p>
          <p className="mt-2 font-mono text-sm text-dap-text-primary">{sportCategory || 'UNKNOWN'}</p>
        </motion.div>

        <motion.div
          className="border-l-4 border-dap-success bg-dap-border/20 p-4"
          whileHover={{ x: 4 }}
        >
          <p className="font-mono text-xs text-dap-text-secondary uppercase tracking-[0.15em]">[Uploaded]</p>
          <p className="mt-2 font-mono text-sm text-dap-text-primary">{uploadedAt || 'N/A'}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
