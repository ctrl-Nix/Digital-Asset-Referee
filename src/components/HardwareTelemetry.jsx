import * as React from "react"
import { motion } from "framer-motion"
import { Cpu, Gauge, Timer, Users, Zap, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_STATS = {
  hardwareBase: "AMD Instinct MI300X",
  tokenThroughput: 142000,
  inferenceLatency: 42,
  activeAgents: 3,
  gpuUtilization: 78,
  memoryUsage: 64,
}

const METRICS = [
  {
    key: "tokenThroughput",
    label: "vLLM Token Throughput",
    unit: "tok/s",
    icon: Zap,
    color: "text-primary",
    format: (value) => `${formatCompact(value)} tok/s`,
  },
  {
    key: "inferenceLatency",
    label: "Inference Latency",
    unit: "ms",
    icon: Timer,
    color: "text-accent",
    format: (value) => `${Math.round(value)} ms`,
  },
  {
    key: "activeAgents",
    label: "Active Agents",
    unit: "",
    icon: Users,
    color: "text-foreground",
    format: (value) => `${Math.round(value)}`,
  },
  {
    key: "gpuUtilization",
    label: "GPU Utilization",
    unit: "%",
    icon: Gauge,
    color: "text-primary",
    format: (value) => `${Math.round(value)}%`,
  },
  {
    key: "memoryUsage",
    label: "Memory Usage",
    unit: "%",
    icon: HardDrive,
    color: "text-muted-foreground",
    format: (value) => `${Math.round(value)}%`,
  },
]

export default function HardwareTelemetry({ stats }) {
  const merged = React.useMemo(() => ({ ...DEFAULT_STATS, ...stats }), [stats])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-sm relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-12 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 blur-3xl rounded-full" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-background/60 rounded-2xl border border-border/40 shadow-inner">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Hardware Base</p>
            <h3 className="text-lg font-bold text-foreground">{merged.hardwareBase}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Telemetry Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 relative z-10">
        {METRICS.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * idx }}
              className="bg-background/40 border border-border/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-inner"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-background/70 border border-border/40", metric.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <AnimatedValue value={merged[metric.key]} format={metric.format} className={metric.color} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function AnimatedValue({ value, format, className }) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    let start = null
    const numeric = Number(value) || 0
    const duration = 700

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(numeric * eased)
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [value])

  return (
    <p className={cn("text-lg font-bold text-foreground", className)}>
      {format ? format(displayValue) : Math.round(displayValue)}
    </p>
  )
}

function formatCompact(value) {
  if (!Number.isFinite(value)) return "0"
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}
