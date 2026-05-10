import * as React from "react"
import { motion } from "framer-motion"
import { Radar } from "lucide-react"

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function GlobalRadar({ detections = [] }) {
  const nodes = React.useMemo(() => {
    return detections.slice(0, 18).map((det, index) => {
      const seed = hashCode(det.detection_id || `${index}`)
      const angle = (seed % 360) * (Math.PI / 180)
      const radius = 12 + (Math.abs(seed) % 38)
      const x = 50 + Math.cos(angle) * radius
      const y = 50 + Math.sin(angle) * radius
      return {
        id: det.detection_id || `${index}`,
        verdict: det.verdict || det.agent_verdict,
        x,
        y,
      }
    })
  }, [detections])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-bg-surface border border-white/[0.07] rounded-lg p-6 relative overflow-hidden h-full"
    >
      <div className="absolute -top-10 left-10 w-40 h-40 bg-brand-primary/5 blur-3xl rounded-full" />
      <div className="absolute bottom-10 right-6 w-32 h-32 bg-brand-secondary/5 blur-3xl rounded-full" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
            <Radar className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-neutral">Global Interception</p>
            <h3 className="text-lg font-display font-bold text-white">3D Radar Sweep</h3>
          </div>
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/20">
          {nodes.length} Active Nodes
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-sm aspect-square">
        <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.01]" />
        <div className="absolute inset-[12%] rounded-full border border-white/[0.05]" />
        <div className="absolute inset-[28%] rounded-full border border-white/[0.03]" />
        <div className="absolute inset-[44%] rounded-full border border-white/[0.02]" />

        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute left-1/2 top-1/2 h-1 w-1/2 -translate-y-1/2 origin-left bg-gradient-to-r from-brand-primary via-brand-primary/30 to-transparent shadow-[0_0_20px_rgba(0,229,160,0.35)]" />
        </motion.div>

        {nodes.map((node, idx) => {
          const isInfringement = node.verdict === "Pirated" || node.verdict === "INFRINGEMENT";
          const isSuspicious = node.verdict === "Suspicious";
          
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: [1, 1.4, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: idx * 0.2 }}
              className={cn(
                "absolute w-2.5 h-2.5 rounded-full",
                isInfringement
                  ? "bg-brand-secondary shadow-[0_0_12px_rgba(255,79,79,0.8)]"
                  : isSuspicious
                    ? "bg-yellow-500 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
                    : "bg-brand-primary shadow-[0_0_10px_rgba(0,229,160,0.6)]"
              )}
              style={{ top: `${node.y}%`, left: `${node.x}%` }}
            />
          );
        })}

        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/80 via-transparent to-transparent rounded-full" />
      </div>
    </motion.div>
  )
}

function hashCode(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}
