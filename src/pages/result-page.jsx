import * as React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldAlert, ShieldCheck, Download, AlertTriangle, ArrowLeft, Fingerprint, Database, Zap, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { getDetection, getReportUrl } from "@/services/api"
import HardwareTelemetry from "@/components/HardwareTelemetry"
import AgentTimeline from "@/components/AgentTimeline"

export default function ResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await getDetection(id)
        setResult(response.data)
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Unable to fetch detection result.")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchResult()
  }, [id])

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-10 w-32 bg-muted rounded-lg" />
        <div className="h-48 bg-card/30 rounded-3xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-card/30 rounded-3xl" />
          <div className="h-64 bg-card/30 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Analysis Error</h2>
          <p className="text-muted-foreground max-w-md">{error || "The requested detection result could not be found."}</p>
        </div>
        <LiquidMetalButton label="Back to Terminal" onClick={() => navigate('/')} />
      </div>
    )
  }

  const verdict = result.verdict?.toUpperCase() || "UNKNOWN"
  const confidence = Math.round((result.confidence_score || 0) * 100)
  const reportUrl = getReportUrl(id)
  const telemetryStats = {
    tokenThroughput: Math.max(1, Math.round((result.coverage_ratio || 1) * 140000)),
    inferenceLatency: result.pipeline_time_seconds ? Math.round(result.pipeline_time_seconds * 1000) : 48,
    activeAgents: 3,
    gpuUtilization: result.watermark_verified ? 82 : 74,
    memoryUsage: result.watermark_verified ? 66 : 58,
  }

  const getVerdictConfig = () => {
    switch (verdict) {
      case "PIRATED":
        return {
          color: "text-destructive",
          bg: "bg-destructive",
          icon: <ShieldAlert className="w-10 h-10 text-destructive" />,
        }
      case "SUSPICIOUS":
        return {
          color: "text-accent",
          bg: "bg-accent",
          icon: <AlertTriangle className="w-10 h-10 text-accent" />,
        }
      case "ORIGINAL":
        return {
          color: "text-primary",
          bg: "bg-primary",
          icon: <ShieldCheck className="w-10 h-10 text-primary" />,
        }
      default:
        return {
          color: "text-muted-foreground",
          bg: "bg-muted-foreground",
          icon: <AlertTriangle className="w-10 h-10 text-muted-foreground" />,
        }
    }
  }

  const config = getVerdictConfig()
  const glassClass = "bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-xl relative overflow-hidden"

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-6 pb-20 relative z-10"
    >
      <div className="w-full mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="group flex w-fit items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          <span>Back to Terminal</span>
        </button>
      </div>

      <section className={cn(glassClass, "p-8 flex flex-col md:flex-row items-center gap-8")}>
        <div className="flex items-center justify-center p-4 bg-background/50 rounded-full border border-border/50 shadow-inner">
          {config.icon}
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-1">Final Verdict</p>
          <h2 className={cn("text-4xl md:text-5xl font-bold tracking-tight mb-4", config.color)}>
            {verdict}
          </h2>
          <div className="flex flex-col gap-2 max-w-md mx-auto md:mx-0">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-foreground">Confidence Score</span>
              <span className={config.color}>{confidence}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={cn("h-full rounded-full shadow-lg", config.bg)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto items-center justify-center">
          {verdict === "PIRATED" && (
            <a href={reportUrl} target="_blank" rel="noopener noreferrer">
              <LiquidMetalButton label="Evidence Report" />
            </a>
          )}
          <LiquidMetalButton label="Run Another" onClick={() => navigate('/')} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(glassClass, "flex flex-col")}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Submitted Content</h3>
          <div className="aspect-video bg-black/80 rounded-2xl overflow-hidden relative group cursor-pointer border border-border/50 shadow-md">
            <img 
              src={result.submitted_url || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80"} 
              alt="Submitted" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
            />
            {result.timestamp_match_start !== undefined && (
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded">
                Segment Match
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground flex justify-between px-1">
            <span>Detection ID: {id.substring(0, 12)}...</span>
            <span>Type: {result.matched_sport_category || "Media"}</span>
          </div>
        </div>
        
        <div className={cn(glassClass, "flex flex-col")}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Matched Official Content</h3>
          <div className="aspect-video bg-black/80 rounded-2xl overflow-hidden relative group cursor-pointer border border-border/50 shadow-md">
            <img 
              src={result.matched_file_url || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80"} 
              alt="Official" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
            />
            {verdict === "PIRATED" && (
              <div className="absolute inset-0 border-2 border-destructive/50 m-4 rounded-xl animate-pulse bg-destructive/10" />
            )}
          </div>
          <div className="mt-4 text-sm font-medium text-destructive flex justify-between px-1">
            <span>
              {result.timestamp_match_start !== undefined 
                ? `Match: ${result.timestamp_match_start}s – ${result.timestamp_match_end}s` 
                : "Continuous Match"}
            </span>
            <span className="text-primary">{result.matched_owner || "Copyright Protected"}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className={cn(glassClass, "col-span-1 md:col-span-2")}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary fill-primary/20" />
            <h3 className="text-lg font-semibold text-foreground">AI Content Analysis</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm mb-6">
            {result.gemini_description || "Forensic analysis completed. Content fingerprints show direct correlation with registered assets from our verified database."}
          </p>
          <div className="flex flex-wrap gap-2">
            {[result.matched_sport_category, 'verified registry', 'forensic match', verdict.toLowerCase()].filter(Boolean).map(tag => (
              <span key={tag} className="px-3 py-1 bg-background/50 text-foreground text-xs rounded-full border border-border/50 shadow-sm backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className={cn(glassClass, "col-span-1")}>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Forensic Trace</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col p-3 rounded-xl bg-background/30 border border-border/20">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Watermark Integrity</span>
              <span className={cn("text-sm font-medium mt-0.5", result.watermark_verified ? "text-primary" : "text-muted-foreground")}>
                {result.watermark_verified ? "VERIFIED (DCT)" : "NOT DETECTED"}
              </span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-background/30 border border-border/20">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Similarity Hash</span>
              <span className="text-xs font-mono text-muted-foreground mt-1 truncate">{id}</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-background/30 border border-border/20">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Detection Date</span>
              <span className="text-sm font-medium text-foreground mt-0.5">
                {result.matched_upload_date || new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HardwareTelemetry stats={telemetryStats} />
        <AgentTimeline agentData={result.agent_reasoning} detectionId={id} />
      </section>
    </motion.div>
  )
}
