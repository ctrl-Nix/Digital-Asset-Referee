import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function ForensicScanner({ className }) {
  return (
    <div className={cn("relative w-40 h-40 sm:w-44 sm:h-44", className)}>
      <div className="absolute inset-0 rounded-full border border-primary/30 bg-background/50 shadow-inner" />
      <div
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(56,189,248,0.08) 11px)",
        }}
      />

      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-1/2 top-1/2 h-[2px] w-1/2 -translate-y-1/2 origin-left bg-gradient-to-r from-primary via-primary/40 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
      </motion.div>

      <motion.div
        className="absolute inset-6 rounded-full border border-primary/20"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-12 rounded-full border border-primary/10"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      />

      {[{ top: "22%", left: "64%" }, { top: "70%", left: "30%" }, { top: "38%", left: "28%" }].map(
        (pos, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{ top: pos.top, left: pos.left }}
          >
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-primary/30 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </div>
        )
      )}
    </div>
  )
}
