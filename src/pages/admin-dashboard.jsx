import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Database, 
  PlusCircle, 
  Settings, 
  Menu, 
  X,
  Search,
  AlertTriangle,
  Radar,
  TrendingUp,
  TrendingDown,
  Activity,
  Video,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  Calendar,
  ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/services/firebase"
import { getAssets, registerAsset, listDetections, getSchedulerStatus, getMonitorConfig, updateMonitorConfig, runManualScan } from "@/services/api"
import { signOut } from "@/services/auth"
import { useAnomalyListener } from "@/hooks/useAnomalyListener"
import { useAutoScanListener } from "@/hooks/useAutoScanListener"
import HardwareTelemetry from "@/components/HardwareTelemetry"
import GlobalRadar from "@/components/GlobalRadar"
import AgentTimeline from "@/components/AgentTimeline"

// Telemetry values are derived from scan batch size to keep motion reactive without new API fields.
const TELEMETRY_BASE = {
  throughputPerItem: 1800,
  latencyActiveMs: 42,
  latencyIdleMs: 68,
  latencyJitter: 9,
  activeAgents: 3,
  idleAgents: 1,
  gpuActiveBase: 74,
  gpuIdleBase: 36,
  gpuJitter: 12,
  memoryActiveBase: 62,
  memoryIdleBase: 28,
  memoryJitter: 8,
}

// Sub-components
function StatCard({ title, value, trend, trendUp, icon: Icon, delay, color = "text-primary" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:-translate-y-1 transition-transform"
    >
      <div className="flex justify-between items-center text-muted-foreground">
        <span className="text-xs font-semibold uppercase tracking-widest">{title}</span>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="text-3xl font-bold text-foreground mt-2">{value}</div>
      {trend && (
        <div className={cn("text-xs font-medium flex items-center gap-1", trendUp ? "text-primary" : "text-destructive")}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend}</span>
        </div>
      )}
    </motion.div>
  )
}

function AlertBanner({ alert, onViewDetails, onDismiss }) {
  if (!alert) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full bg-destructive/10 border border-destructive/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="p-4 bg-destructive/20 rounded-2xl border border-destructive/30 group-hover:rotate-6 transition-transform">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">Emergency</span>
            <h3 className="text-lg font-bold text-destructive">Viral Spread Detected</h3>
          </div>
          <p className="text-sm text-foreground/80 mt-1 max-w-xl">
            Unauthorized broadcast of <strong>{alert.asset_title}</strong> intercepted. Platform: {alert.platform} | Source: {alert.source_name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
        <button onClick={onViewDetails} className="text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 px-6 py-3 border border-destructive/20 rounded-xl transition-all">
          Forensic Report
        </button>
        <LiquidMetalButton label="Take Action" onClick={onDismiss} />
      </div>
    </motion.div>
  )
}

function AssetTable({ assets, searchQuery, setSearchQuery, loading }) {
  const filtered = assets.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl overflow-hidden p-8 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 w-full bg-muted/20 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b border-border/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Registered Assets</h3>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search registry..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background/50 border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border/20 bg-background/20 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              <th className="p-5 font-medium">Asset Identity</th>
              <th className="p-5 font-medium">Internal ID</th>
              <th className="p-5 font-medium">Register Date</th>
              <th className="p-5 font-medium">Total Match</th>
              <th className="p-5 font-medium">Protection Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-muted-foreground">
                  Registry empty. No assets found matching your criteria.
                </td>
              </tr>
            ) : filtered.map((asset) => (
              <tr 
                key={asset.id} 
                className="border-b border-border/10 hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <td className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative shrink-0 border border-border/30">
                    <img src={asset.thumb || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=100&q=80"} alt="thumb" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">{asset.title}</span>
                </td>
                <td className="p-5 font-mono text-[11px] text-muted-foreground">{(asset.id || "").substring(0, 12)}...</td>
                <td className="p-5 text-muted-foreground">{asset.date}</td>
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-bold text-foreground">{asset.detections} Matches</span>
                  </div>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20 uppercase tracking-widest">
                    Active Guard
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActivityFeed({ detections = [], autoScanStatus, autoScanLoading }) {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    // Map detections to activities with live data
    const mapped = detections.map(d => {
      const verdict = d.verdict || d.agent_verdict || "Unknown"
      const isPirated = ["Pirated", "INFRINGEMENT"].includes(verdict)
      const isSuspicious = ["Suspicious", "SUSPICIOUS"].includes(verdict)
      const title = d.source_metadata?.title || d.source_metadata?.channel || d.matched_owner || d.source_url || "Media"
      const platform = d.platform ? ` • ${d.platform}` : ""
      const timestamp = d.detection_timestamp || d.timestamp || d.detection_time

      return {
        id: d.detection_id || `${title}-${timestamp}`,
        type: "match",
        text: `${isPirated ? "Infringement" : "Detection"}: ${title}${platform}`,
        time: timestamp ? new Date(timestamp).toLocaleTimeString() : "Recent",
        icon: isPirated ? ShieldAlert : isSuspicious ? AlertTriangle : Activity,
        color: isPirated ? "text-destructive" : isSuspicious ? "text-accent" : "text-primary"
      }
    })
    setActivities(mapped)
  }, [detections])

  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="flex justify-between items-center mb-8 relative z-10">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Live Pulse
        </h3>
        <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded-full border border-border/30">
          <span className={cn("w-2 h-2 rounded-full", autoScanStatus?.running ? "bg-primary animate-pulse" : "bg-muted-foreground/60")} />
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            {autoScanLoading ? "Syncing" : autoScanStatus?.running ? "Auto-Scan Live" : "Auto-Scan Idle"}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-6 flex-1 relative z-10">
        <AnimatePresence initial={false}>
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10 italic">No recent activity detected.</p>
          ) : activities.slice(0, 10).map((act) => (
            <motion.div 
              key={act.id}
              initial={{ opacity: 0, height: 0, x: -20 }}
              animate={{ opacity: 1, height: "auto", x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4 items-start group"
            >
              <div className="mt-0.5 p-2 bg-background/80 rounded-xl border border-border/50 group-hover:border-primary/30 group-hover:rotate-6 transition-all shrink-0">
                <act.icon className={cn("w-4 h-4", act.color)} />
              </div>
              <div className="flex flex-col flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{act.text}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{act.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AutoScanStatusCard({ status, loading, error, onManualScan, manualScanLoading }) {
  const running = status?.running
  const lastScan = status?.last_scan_time

  return (
    <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-background/60 rounded-2xl border border-border/40 shadow-inner">
            <Radar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Auto-Scan Core</p>
            <h3 className="text-lg font-bold text-foreground">Scheduler Status</h3>
          </div>
        </div>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border",
          running ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border/30"
        )}>
          {running ? "Active" : "Idle"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Last Scan</span>
          <span className="text-sm font-semibold text-foreground">{formatTimestamp(lastScan)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Last Batch</span>
          <span className="text-sm font-semibold text-foreground">{status?.last_scan_count ?? 0} items</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Infringements</span>
          <span className="text-sm font-semibold text-destructive">{status?.last_scan_infringements ?? 0}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Total Scans</span>
          <span className="text-sm font-semibold text-foreground">{status?.total_scans ?? 0}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LiquidMetalButton label={manualScanLoading ? "Scanning..." : "Run Manual Scan"} onClick={manualScanLoading ? undefined : onManualScan} />
        {loading && <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Syncing...</span>}
      </div>

      {error && (
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}

function StatusToast({ toast, onDismiss }) {
  if (!toast) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl border shadow-lg backdrop-blur-xl text-xs font-bold uppercase tracking-[0.2em]",
          toast.type === "error"
            ? "bg-destructive/15 text-destructive border-destructive/30"
            : "bg-primary/15 text-primary border-primary/30"
        )}
      >
        <div className="flex items-center gap-3">
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
          <button className="text-[10px] text-muted-foreground hover:text-foreground ml-2" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Awaiting scan"
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "Awaiting scan"
  return date.toLocaleString()
}

function RegisterAssetView({ onRegister, onCancel }) {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = React.useRef(null)

  const handleSubmit = async () => {
    if (!title || !file) {
      setError("Asset title and reference media are required.")
      return
    }
    setIsSubmitting(true)
    setError("")

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Unauthorized")
      const token = await user.getIdToken()
      
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("owner_name", user.displayName || user.email)
      formData.append("sport_category", "Other") // Default or add field
      
      await registerAsset(formData, token)
      
      setSuccess(true)
      onRegister()
      setTimeout(() => {
        setSuccess(false)
        onCancel()
      }, 1500)
    } catch (err) {
      setError(err.message || "Failed to register asset.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-16 shadow-lg flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-3xl font-bold text-foreground">Asset Secured</h3>
        <p className="text-muted-foreground mt-4">Forensic fingerprinting complete. Active monitoring initiated.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="mb-10 relative z-10">
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" /> Register New Asset
        </h2>
        <p className="text-muted-foreground mt-2">Initialize forensic monitoring for your digital property.</p>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset Identity</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => { setTitle(e.target.value); setError("") }} 
            placeholder="e.g. Premier League Live Match #482" 
            className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Reference Media</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed border-border/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all",
              file && "border-primary/50 bg-primary/5"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={e => { setFile(e.target.files[0]); setError("") }}
              accept="video/*,image/*"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <Video className="w-12 h-12 text-primary mb-4" />
                <span className="text-sm font-bold text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Target Secured</span>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted/50 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <span className="text-sm font-bold text-foreground">Click to upload reference media</span>
                <span className="text-xs text-muted-foreground mt-2 uppercase tracking-tighter opacity-60">High-fidelity forensic source required</span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/20">
          <LiquidMetalButton label={isSubmitting ? "Fingerprinting..." : "Initiate Protection"} onClick={isSubmitting ? undefined : handleSubmit} />
          <button onClick={onCancel} className="px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all border border-border/20 hover:border-border/50">
            Abort Mission
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [assets, setAssets] = useState([])
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState("Dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [schedulerStatus, setSchedulerStatus] = useState(null)
  const [schedulerLoading, setSchedulerLoading] = useState(false)
  const [schedulerError, setSchedulerError] = useState("")
  const [monitorConfig, setMonitorConfig] = useState({
    twitter_query: "",
    youtube_query: "",
    reddit_subreddit: "",
    interval_minutes: 5,
    max_results_per_platform: 3,
  })
  const [configLoading, setConfigLoading] = useState(true)
  const [configSaving, setConfigSaving] = useState(false)
  const [configError, setConfigError] = useState("")
  const [configSuccess, setConfigSuccess] = useState("")
  const [manualScanLoading, setManualScanLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/admin")
      } else {
        setUser(currentUser)
      }
    })
    return unsubscribe
  }, [navigate])

  const fetchAssets = async () => {
    if (!user) return
    setLoading(true)
    setError("")
    try {
      const token = await user.getIdToken()
      const response = await getAssets(token)
      
      // Map API assets to UI structure with live data
      const mappedAssets = (response.data.assets || []).map(asset => ({
        id: asset.content_id || asset.id || "UNKNOWN",
        title: asset.title || "Untitled Asset",
        date: asset.created_at ? new Date(asset.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString(),
        detections: asset.detection_count || 0,
        thumb: asset.file_url,
        highRisk: (asset.detection_count || 0) > 10
      }))
      
      setAssets(mappedAssets)
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load registry.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDetections = async () => {
    try {
      const response = await listDetections()
      setDetections(response.data.detections || [])
    } catch (err) {
      console.error("Failed to fetch detections", err)
    }
  }

  const fetchSchedulerStatus = useCallback(async () => {
    setSchedulerLoading(true)
    setSchedulerError("")
    try {
      const response = await getSchedulerStatus()
      setSchedulerStatus(response.data)
    } catch (err) {
      setSchedulerError(err.response?.data?.error || err.message || "Failed to load scheduler status.")
    } finally {
      setSchedulerLoading(false)
    }
  }, [])

  const fetchMonitorConfig = useCallback(async () => {
    setConfigLoading(true)
    setConfigError("")
    setConfigSuccess("")
    try {
      const response = await getMonitorConfig()
      setMonitorConfig({
        twitter_query: response.data?.twitter_query || "",
        youtube_query: response.data?.youtube_query || "",
        reddit_subreddit: response.data?.reddit_subreddit || "",
        interval_minutes: response.data?.interval_minutes ?? 5,
        max_results_per_platform: response.data?.max_results_per_platform ?? 3,
      })
    } catch (err) {
      setConfigError(err.response?.data?.error || err.message || "Failed to load monitor configuration.")
    } finally {
      setConfigLoading(false)
    }
  }, [])

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Real-time auto-scan listener with cleanup
  const ownerName = useMemo(() => user?.displayName || user?.email || "", [user])
  const anomalyAlerts = useAnomalyListener(ownerName)
  const { results: autoScanResults, loading: autoScanLoading, error: autoScanError, refresh: refreshAutoScans } = useAutoScanListener({ enabled: Boolean(user) })

  useEffect(() => {
    if (autoScanError) {
      showToast(autoScanError, "error")
    }
  }, [autoScanError, showToast])

  const handleSaveConfig = async () => {
    setConfigError("")
    setConfigSuccess("")
    const interval = Number(monitorConfig.interval_minutes)
    if (!Number.isFinite(interval) || interval < 1 || interval > 1440) {
      setConfigError("Interval must be between 1 and 1440 minutes.")
      return
    }

    setConfigSaving(true)
    try {
      const payload = {
        ...monitorConfig,
        interval_minutes: interval,
      }
      const response = await updateMonitorConfig(payload)
      setMonitorConfig(response.data?.config || payload)
      setConfigSuccess("Configuration saved.")
      showToast("Auto-scan configuration updated.", "success")
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Failed to update configuration."
      setConfigError(message)
      showToast(message, "error")
    } finally {
      setConfigSaving(false)
    }
  }

  const handleManualScan = async () => {
    if (manualScanLoading) return
    setManualScanLoading(true)
    try {
      const response = await runManualScan({
        ...monitorConfig,
        interval_minutes: Number(monitorConfig.interval_minutes) || 5,
      })
      showToast(response.data?.message || "Manual scan complete.", "success")
      await Promise.all([fetchAssets(), fetchDetections(), refreshAutoScans(), fetchSchedulerStatus()])
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Manual scan failed."
      showToast(message, "error")
    } finally {
      setManualScanLoading(false)
    }
  }

  // Initial data fetch and polling with cleanup
  useEffect(() => {
    if (user) {
      fetchAssets()
      fetchDetections()
      fetchSchedulerStatus()
      fetchMonitorConfig()
    }
  }, [user, fetchSchedulerStatus, fetchMonitorConfig])

  // Scheduler status polling with cleanup
  useEffect(() => {
    if (!user) return
    const timer = setInterval(fetchSchedulerStatus, 15000)
    return () => clearInterval(timer)
  }, [user, fetchSchedulerStatus])

  // Detections polling with cleanup
  useEffect(() => {
    if (!user) return
    const timer = setInterval(fetchDetections, 10000)
    return () => clearInterval(timer)
  }, [user])

  const [activeAnomaly, setActiveAnomaly] = useState(null)

  // Calculate metrics from live data
  const totalDetections = useMemo(
    () => assets.reduce((sum, asset) => sum + (asset.detections || 0), 0),
    [assets]
  )

  // Combine detections from both sources with real-time updates
  const combinedDetections = useMemo(() => {
    const map = new Map()
    detections.forEach((det) => {
      if (det?.detection_id) map.set(det.detection_id, det)
    })
    autoScanResults.forEach((det) => {
      if (det?.detection_id) map.set(det.detection_id, det)
    })
    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.detection_timestamp || 0).getTime()
      const bTime = new Date(b.detection_timestamp || 0).getTime()
      return bTime - aTime
    })
  }, [detections, autoScanResults])

  // Filter viral alerts from combined detections
  const autoScanAlerts = useMemo(() => {
    return autoScanResults.filter((det) =>
      ["Pirated", "INFRINGEMENT"].includes(det.verdict || det.agent_verdict)
    )
  }, [autoScanResults])

  // Extract agent reasoning from latest detection
  const latestAgentData = useMemo(() => {
    const match = combinedDetections.find((det) => det.agent_reasoning)
    return match?.agent_reasoning || null
  }, [combinedDetections])

  // Get latest detection ID for timeline
  const latestDetectionId = useMemo(() => {
    return combinedDetections[0]?.detection_id
  }, [combinedDetections])

  // Dynamic telemetry stats from live scan data
  const telemetryStats = useMemo(() => {
    const lastCount = schedulerStatus?.last_scan_count ?? combinedDetections.length
    const baseThroughput = Math.max(1, lastCount) * TELEMETRY_BASE.throughputPerItem
    return {
      tokenThroughput: baseThroughput,
      inferenceLatency: schedulerStatus?.running
        ? TELEMETRY_BASE.latencyActiveMs + (lastCount % TELEMETRY_BASE.latencyJitter)
        : TELEMETRY_BASE.latencyIdleMs,
      activeAgents: schedulerStatus?.running ? TELEMETRY_BASE.activeAgents : TELEMETRY_BASE.idleAgents,
      gpuUtilization: schedulerStatus?.running
        ? TELEMETRY_BASE.gpuActiveBase + (lastCount % TELEMETRY_BASE.gpuJitter)
        : TELEMETRY_BASE.gpuIdleBase,
      memoryUsage: schedulerStatus?.running
        ? TELEMETRY_BASE.memoryActiveBase + (lastCount % TELEMETRY_BASE.memoryJitter)
        : TELEMETRY_BASE.memoryIdleBase,
    }
  }, [schedulerStatus, combinedDetections.length])

  const intervalValue = Number(monitorConfig.interval_minutes)
  const isIntervalInvalid = !Number.isFinite(intervalValue) || intervalValue < 1 || intervalValue > 1440

  // Set active anomaly from live alerts with priority
  useEffect(() => {
    if (anomalyAlerts.length > 0) {
      const alert = anomalyAlerts[0]
      setActiveAnomaly({
        asset_title: alert.asset_title || alert.owner_name || "Owned Asset",
        platform: "Registry",
        source_name: alert.owner_name || "System",
        detection_id: alert.detection_id,
      })
      return
    }

    if (autoScanAlerts.length > 0) {
      const alert = autoScanAlerts[0]
      setActiveAnomaly({
        asset_title: alert.source_metadata?.title || alert.source_url || "Unauthorized Stream",
        platform: alert.platform || "Unknown",
        source_name: alert.source_metadata?.channel || alert.source_metadata?.author || "Unknown",
        detection_id: alert.detection_id,
      })
      return
    }

    setActiveAnomaly(null)
  }, [anomalyAlerts, autoScanAlerts])

  const handleLogout = async () => {
    await signOut()
    navigate("/admin")
  }

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Assets", icon: Database },
    { name: "Register Asset", icon: PlusCircle },
    { name: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background flex w-full relative overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card/10 backdrop-blur-2xl border-r border-border/20 transform transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-border/20 bg-background/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 rotate-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <span className="font-black text-xl tracking-tighter text-foreground uppercase">
              Guard
            </span>
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-3">
          <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 mt-4">Command Center</p>
          {navItems.map((item, i) => (
            <button 
              key={i}
              onClick={() => { setCurrentView(item.name); setSidebarOpen(false) }}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all w-full text-left group",
                currentView === item.name 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent hover:border-border/20"
              )}
            >
              <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", currentView === item.name ? "text-primary-foreground" : "text-primary")} />
              {item.name}
            </button>
          ))}
        </div>

        <div className="p-8 border-t border-border/20 bg-background/20 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 shadow-inner">
              {user?.email?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-bold text-foreground truncate uppercase tracking-tighter">{user?.displayName || "Administrator"}</span>
              <span className="text-[9px] font-bold text-muted-foreground truncate uppercase tracking-widest">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive/20 transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background/50">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-border/20 bg-background/40 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-6">
            <button className="lg:hidden text-foreground p-2 hover:bg-white/10 rounded-xl transition-all" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-foreground uppercase tracking-tight">{currentView}</h1>
              <div className="flex items-center gap-2 font-bold text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="h-8 w-px bg-border/20 hidden sm:block" />
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors hidden sm:block">
              Detection Terminal
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto pb-20">
            
            <AnimatePresence mode="wait">
              {currentView === "Dashboard" && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Commander Overview</h2>
                      <p className="text-muted-foreground mt-2 font-medium">Protecting {assets.length} assets across global interception nodes.</p>
                    </div>
                    <div className="flex gap-4 shrink-0">
                      <LiquidMetalButton label="Register Asset" onClick={() => setCurrentView("Register Asset")} />
                    </div>
                  </div>

                  <AlertBanner 
                    alert={activeAnomaly} 
                    onViewDetails={() => activeAnomaly?.detection_id && navigate(`/result/${activeAnomaly?.detection_id}`)}
                    onDismiss={() => setActiveAnomaly(null)}
                  />

                  {/* Live Stat Cards with real data */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Registry" value={assets.length} icon={Database} delay={0.1} />
                    <StatCard title="Global Matches" value={(schedulerStatus?.total_detections ?? totalDetections).toLocaleString()} icon={ShieldAlert} color="text-destructive" delay={0.2} />
                    <StatCard title="Live Alerts" value={anomalyAlerts.length + autoScanAlerts.length} icon={AlertTriangle} color="text-destructive" delay={0.3} />
                    <StatCard title="Uptime Index" value={schedulerStatus?.running ? "Active" : "Idle"} trend={schedulerStatus?.last_scan_time ? `Last scan ${formatTimestamp(schedulerStatus.last_scan_time)}` : ""} delay={0.4} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                      <HardwareTelemetry stats={telemetryStats} />
                      <GlobalRadar detections={combinedDetections} />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                      <AutoScanStatusCard
                        status={schedulerStatus}
                        loading={schedulerLoading}
                        error={schedulerError}
                        manualScanLoading={manualScanLoading}
                        onManualScan={handleManualScan}
                      />
                      <AgentTimeline agentData={latestAgentData} detectionId={latestDetectionId} />
                    </div>
                  </div>

                  {/* Live Activity Feed with real detections */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                      <AssetTable assets={assets} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={loading} />
                    </div>
                    <div className="lg:col-span-1 min-h-[400px]">
                      <ActivityFeed detections={combinedDetections} autoScanStatus={schedulerStatus} autoScanLoading={autoScanLoading} />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentView === "Assets" && (
                <motion.div 
                  key="assets"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Asset Registry</h2>
                      <p className="text-muted-foreground mt-2 font-medium">Comprehensive database of protected digital properties.</p>
                    </div>
                    <LiquidMetalButton label="Register Asset" onClick={() => setCurrentView("Register Asset")} />
                  </div>
                  <AssetTable assets={assets} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={loading} />
                </motion.div>
              )}

              {currentView === "Register Asset" && (
                <motion.div 
                  key="register"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <RegisterAssetView onRegister={fetchAssets} onCancel={() => setCurrentView("Dashboard")} />
                </motion.div>
              )}

              {currentView === "Settings" && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-2xl mx-auto bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-12"
                >
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Settings className="w-8 h-8 text-primary" />
                      <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">System Core</h2>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="flex flex-col gap-6 p-6 bg-background/50 rounded-2xl border border-border/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Auto-Scanner Configuration</h3>
                            <p className="text-xs text-muted-foreground mt-1">Update live queries and scan cadence for the monitoring core.</p>
                          </div>
                          <div className={cn(
                            "text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border",
                            configError
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {configLoading ? "Syncing" : configError ? "Attention" : "Ready"}
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Twitter Query</label>
                            <input
                              type="text"
                              value={monitorConfig.twitter_query}
                              disabled={configLoading}
                              onChange={(e) => setMonitorConfig((prev) => ({ ...prev, twitter_query: e.target.value }))}
                              placeholder="sports highlights clip"
                              className="w-full bg-background/70 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">YouTube Query</label>
                            <input
                              type="text"
                              value={monitorConfig.youtube_query}
                              disabled={configLoading}
                              onChange={(e) => setMonitorConfig((prev) => ({ ...prev, youtube_query: e.target.value }))}
                              placeholder="sports game highlights"
                              className="w-full bg-background/70 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Reddit Subreddit</label>
                            <input
                              type="text"
                              value={monitorConfig.reddit_subreddit}
                              disabled={configLoading}
                              onChange={(e) => setMonitorConfig((prev) => ({ ...prev, reddit_subreddit: e.target.value }))}
                              placeholder="sports"
                              className="w-full bg-background/70 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Interval (minutes)</label>
                            <input
                              type="number"
                              min="1"
                              max="1440"
                              value={monitorConfig.interval_minutes}
                              disabled={configLoading}
                              onChange={(e) => setMonitorConfig((prev) => ({ ...prev, interval_minutes: e.target.value }))}
                              className={cn(
                                "w-full bg-background/70 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-foreground placeholder:text-muted-foreground disabled:opacity-50",
                                isIntervalInvalid ? "border-destructive/50 focus:ring-destructive/20" : "focus:ring-primary/20"
                              )}
                            />
                            {isIntervalInvalid && (
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">Enter 1–1440 minutes.</p>
                            )}
                          </div>
                        </div>

                        {(configError || configSuccess) && (
                          <div className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-xl border",
                            configError
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {configError || configSuccess}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                          <LiquidMetalButton label={configSaving ? "Saving..." : "Save Configuration"} onClick={configSaving ? undefined : handleSaveConfig} />
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" />
                            {schedulerStatus?.running ? "Scheduler Active" : "Scheduler Idle"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 p-6 bg-background/50 rounded-2xl border border-border/30">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Forensic Sensitivity</h3>
                        <p className="text-xs text-muted-foreground">Adjust matching threshold for AI fingerprint correlation.</p>
                        <div className="flex items-center gap-6">
                          <input type="range" min="0" max="100" defaultValue="92" className="w-full accent-primary h-1.5 bg-muted rounded-full" />
                          <span className="text-xs font-black text-primary">92%</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 p-6 bg-background/50 rounded-2xl border border-border/30">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Active Interceptors</h3>
                        <div className="flex flex-col gap-3">
                           {['Slack Node #01', 'Telegram Scraper v4', 'Twitter Stream X1'].map(node => (
                             <div key={node} className="flex justify-between items-center py-2 border-b border-border/10 last:border-0">
                               <span className="text-xs font-bold text-foreground">{node}</span>
                               <span className="text-[9px] font-black text-primary uppercase tracking-widest">Online</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>

      <StatusToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default AdminDashboard
