import * as React from "react"
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { onAuthStateChanged } from "firebase/auth"
import { 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  Search, 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ExternalLink,
  Zap,
  Terminal,
  Activity
} from "lucide-react"
import { auth } from "@/services/firebase"
import { batchDetect, getReportUrl } from "@/services/api"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { cn } from "@/lib/utils"

export default function BatchMonitor() {
  const [urlsText, setUrlsText] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progressIndex, setProgressIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/admin")
      }
    })
    return unsubscribe
  }, [navigate])

  const urlLines = urlsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const isValid = urlLines.length > 0 && urlLines.length <= 10

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!isValid) return

    setLoading(true)
    setError("")
    setResults([])
    setProgressIndex(1)

    const logInterval = setInterval(() => {
        setProgressIndex(prev => Math.min(prev + 1, urlLines.length))
    }, 1200)

    try {
      const response = await batchDetect(urlLines)
      setResults(response.data || [])
      clearInterval(logInterval)
      setProgressIndex(urlLines.length)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Batch detection failed.")
      clearInterval(logInterval)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 flex flex-col gap-8 pb-20 relative z-10">
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate("/admin/dashboard")} 
          className="group flex w-fit items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          <span>Back to Dashboard</span>
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Batch Intelligence</h1>
            <p className="text-muted-foreground mt-1 font-medium">Concurrent forensic analysis for high-volume content streams.</p>
          </div>
          <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Multi-Node Processing</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT PANEL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-end pl-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scan Queue</label>
              <span className="text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">{urlLines.length}/10 URLs</span>
            </div>
            
            <div className="relative group">
              <textarea
                value={urlsText}
                onChange={(e) => { setUrlsText(e.target.value); setError("") }}
                placeholder="https://platform.com/live/123&#10;https://stream.net/match/456"
                className="w-full bg-background/50 border border-border/50 rounded-2xl p-5 font-mono text-xs text-foreground h-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
              />
              <div className="absolute top-4 right-4 opacity-20 group-focus-within:opacity-50 transition-opacity">
                <Terminal className="w-4 h-4" />
              </div>
            </div>

            <LiquidMetalButton 
              label={loading ? "Scanning..." : "Initiate Scan"} 
              onClick={handleSubmit}
              disabled={!isValid || loading}
            />

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[10px] font-black uppercase tracking-wide">
                {error}
              </div>
            )}
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4 shadow-lg"
              >
                <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Forensic Stream Log
                </div>
                <div className="space-y-2 overflow-hidden h-32 relative">
                  {urlLines.slice(0, progressIndex).map((url, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="font-mono text-[9px] text-muted-foreground truncate border-l border-primary/30 pl-3 py-1"
                    >
                      {`> ANALYZING: ${url.substring(0, 35)}...`}
                    </motion.div>
                  ))}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/0 to-transparent" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RESULTS PANEL */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl overflow-hidden shadow-xl min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-border/20 flex items-center justify-between bg-background/20">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Scan Intelligence Results</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{results.length} Identifiers</span>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background/40 border-b border-border/10">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target URL</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Verdict</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Confidence</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[240px] group-hover:text-foreground transition-colors" title={item.url}>
                          {item.url}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         {item.status === "failed" ? (
                            <span className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-tighter">
                               <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                         ) : item.verdict === "Pirated" ? (
                            <span className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-tighter">
                               <AlertTriangle className="w-3 h-3" /> Pirated
                            </span>
                         ) : item.verdict === "Original" ? (
                            <span className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-tighter">
                               <CheckCircle2 className="w-3 h-3" /> Original
                            </span>
                         ) : (
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{item.verdict || "UNKNOWN"}</span>
                         )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[60px] h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round((item.confidence_score || 0) * 100)}%` }}
                              className="h-full bg-primary"
                            />
                          </div>
                          <span className="font-mono text-xs text-foreground font-bold">
                            {item.status === "failed" ? "---" : `${Math.round((item.confidence_score || 0) * 100)}%`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {item.status === "success" && item.verdict === "Pirated" && item.detection_id && (
                             <a 
                               href={getReportUrl(item.detection_id)} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                             >
                               <Download className="w-4 h-4" />
                             </a>
                          )}
                          {item.status === "success" && item.detection_id && (
                             <Link 
                               to={`/result/${item.detection_id}`} 
                               className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
                             >
                               <ExternalLink className="w-4 h-4" />
                             </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-32 text-center">
                         <div className="flex flex-col items-center gap-4 opacity-30">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center border border-border/50">
                              <Search className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scanner Offline — Awaiting Transmission</span>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
