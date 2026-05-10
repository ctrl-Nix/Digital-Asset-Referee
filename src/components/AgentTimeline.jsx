import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, ShieldAlert, ShieldCheck, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

const AGENTS = [
  { key: "investigator", name: "Forensic Investigator" },
  { key: "vision_analyst", name: "Vision Analyst" },
  { key: "chief_referee", name: "Chief Referee" },
]

const LEVEL_STYLES = {
  info: "text-muted-foreground",
  success: "text-primary",
  warning: "text-accent",
  danger: "text-destructive",
}
const TYPEWRITER_SPEED_MS = 18 // Character reveal cadence for terminal-style animation.

export default function AgentTimeline({ agentData, detectionId, isLive = false }) {
  const [agentStates, setAgentStates] = useState({
    investigator: { status: "pending", data: null },
    vision_analyst: { status: "pending", data: null },
    chief_referee: { status: "pending", data: null },
  })
  const [entries, setEntries] = useState([])
  const lastStatusRef = useRef({})
  const bottomRef = useRef(null)

  const pushEntry = useCallback((entry) => {
    setEntries((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...entry },
    ])
  }, [])

  useEffect(() => {
    setEntries([])
    setAgentStates({
      investigator: { status: "pending", data: null },
      vision_analyst: { status: "pending", data: null },
      chief_referee: { status: "pending", data: null },
    })
    lastStatusRef.current = {}
    pushEntry({
      level: "info",
      text: "Initializing agent telemetry stream...",
      animate: true,
    })
  }, [detectionId, agentData, isLive, pushEntry])

  useEffect(() => {
    if (!isLive) return

    const timers = []
    setAgentStates((prev) => ({
      ...prev,
      investigator: { status: "running", data: null },
    }))

    timers.push(
      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          investigator: { status: "complete", data: null },
          vision_analyst: { status: "running", data: null },
        }))
      }, 1800)
    )

    timers.push(
      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          vision_analyst: { status: "complete", data: null },
          chief_referee: { status: "running", data: null },
        }))
      }, 4200)
    )

    timers.push(
      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          chief_referee: { status: "complete", data: null },
        }))
      }, 6400)
    )

    return () => timers.forEach(clearTimeout)
  }, [isLive])

  useEffect(() => {
    if (!agentData || isLive) return

    const timers = []
    const keys = ["investigator", "vision_analyst", "chief_referee"]

    keys.forEach((key, index) => {
      timers.push(
        setTimeout(() => {
          setAgentStates((prev) => ({
            ...prev,
            [key]: { status: "running", data: null },
          }))
        }, index * 700)
      )

      timers.push(
        setTimeout(() => {
          setAgentStates((prev) => ({
            ...prev,
            [key]: { status: "complete", data: agentData[key] || null },
          }))
        }, index * 700 + 500)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [agentData, isLive])

  useEffect(() => {
    if (!detectionId || isLive || agentData) return

    const apiBase = import.meta.env.VITE_API_URL
    const eventSource = new EventSource(`${apiBase}/detect/stream/${detectionId}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.error) {
          pushEntry({ level: "danger", text: data.error, animate: true })
          eventSource.close()
          return
        }

        if (data.pipeline_complete) {
          pushEntry({
            level: "success",
            text: `Pipeline complete • Verdict: ${data.final_verdict || "UNKNOWN"}`,
            animate: true,
          })
          eventSource.close()
          return
        }

        for (const key of ["investigator", "vision_analyst", "chief_referee"]) {
          if (data[key]) {
            setAgentStates((prev) => ({
              ...prev,
              [key]: { status: "complete", data: data[key] },
            }))
          }
        }
      } catch (e) {
        pushEntry({ level: "warning", text: "Telemetry parse warning.", animate: true })
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }, [agentData, detectionId, isLive, pushEntry])

  useEffect(() => {
    const updates = []
    for (const agent of AGENTS) {
      const status = agentStates[agent.key].status
      const previous = lastStatusRef.current[agent.key]
      if (status && status !== previous) {
        lastStatusRef.current[agent.key] = status
        if (status === "running") {
          updates.push({
            level: "info",
            text: `${agent.name} online — awaiting analysis payload.`,
            animate: true,
          })
        }
        if (status === "complete") {
          updates.push(buildAgentSummary(agent.name, agentStates[agent.key].data))
        }
      }
    }
    updates.forEach(pushEntry)
  }, [agentStates, pushEntry])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries])

  const headerIcon = useMemo(() => {
    const verdict = agentStates.chief_referee?.data?.verdict
    if (verdict === "INFRINGEMENT") return ShieldAlert
    if (verdict === "FAIR_USE") return ShieldCheck
    return AlertTriangle
  }, [agentStates])

  const HeaderIcon = headerIcon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-background/60 border border-border/40 shadow-inner">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Agent Stream</p>
            <h3 className="text-lg font-bold text-foreground">Cyber-Terminal Feed</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <HeaderIcon className="w-3 h-3" />
          Live
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-background/60 border border-border/30 rounded-2xl p-4 font-mono text-xs">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/80" />
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 scrollbar-hide">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-2 py-1.5",
                  entry.level === "danger" && "bg-destructive/10 border border-destructive/30",
                  entry.level === "success" && "bg-primary/10 border border-primary/20",
                  entry.level === "warning" && "bg-accent/10 border border-accent/20"
                )}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className={cn("flex-1", LEVEL_STYLES[entry.level] || "text-foreground")}>
                  <TypewriterText text={entry.text} animate={entry.animate} />
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>
    </motion.div>
  )
}

function TypewriterText({ text, animate }) {
  const [display, setDisplay] = useState(animate ? "" : text)

  useEffect(() => {
    if (!animate) {
      setDisplay(text)
      return
    }
    let index = 0
    const timer = setInterval(() => {
      index += 1
      setDisplay(text.slice(0, index))
      if (index >= text.length) clearInterval(timer)
    }, TYPEWRITER_SPEED_MS)
    return () => clearInterval(timer)
  }, [animate, text])

  return <span>{display}</span>
}

function buildAgentSummary(agentName, data) {
  if (!data) {
    return {
      level: "info",
      text: `${agentName} completed. Awaiting payload.`,
      animate: true,
    }
  }

  if (agentName === "Forensic Investigator") {
    const owner = data.top_match?.owner_name || "Unknown asset"
    const similarity = typeof data.top_match?.combined_similarity === "number"
      ? `${Math.round(data.top_match.combined_similarity * 100)}%`
      : "N/A"
    const watermark = data.watermark_detected ? "Watermark verified" : "Watermark not detected"
    return {
      level: data.watermark_detected ? "success" : "warning",
      text: `${agentName} report: match ${owner} • similarity ${similarity} • ${watermark}.`,
      animate: true,
    }
  }

  if (agentName === "Vision Analyst") {
    const description = data.scene_description || "Scene description pending."
    return {
      level: "info",
      text: `${agentName} scene summary: ${truncate(description, 120)}`,
      animate: true,
    }
  }

  if (agentName === "Chief Referee") {
    const verdict = data.verdict || "UNKNOWN"
    const confidence = typeof data.confidence === "number"
      ? `${Math.round(data.confidence * 100)}%`
      : "N/A"
    return {
      level: verdict === "INFRINGEMENT" ? "danger" : verdict === "SUSPICIOUS" ? "warning" : "success",
      text: `${agentName} verdict: ${verdict} • confidence ${confidence}.`,
      animate: true,
    }
  }

  return { level: "info", text: `${agentName} completed.`, animate: true }
}

function truncate(text, max) {
  if (!text) return ""
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}
