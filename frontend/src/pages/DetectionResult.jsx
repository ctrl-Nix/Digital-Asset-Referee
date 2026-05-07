import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Download, ShieldAlert, ArrowLeft, Info, Fingerprint, Database, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import ComparisonView from '../components/ComparisonView'
import Badge from '../components/ui/Badge'
import ConfidenceRing from '../components/ui/ConfidenceRing'
import Card from '../components/ui/Card'
import { getDetection, getReportUrl } from '../services/api'

export default function DetectionResult() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getDetection(id)
        setResult(response.data)
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Unable to fetch detection result.')
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [id])

  const reportUrl = result ? getReportUrl(id) : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-void text-text-primary">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-32 space-y-12 animate-pulse">
          <div className="h-40 bg-white/[0.05] rounded-2xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-white/[0.05] rounded-2xl" />
            <div className="h-64 bg-white/[0.05] rounded-2xl" />
          </div>
          <div className="h-32 bg-white/[0.05] rounded-2xl w-full" />
        </main>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-bg-void text-text-primary flex flex-col items-center justify-center p-4">
        <Navbar />
        <ShieldAlert className="w-16 h-16 text-brand-secondary mb-4 opacity-50" />
        <h2 className="font-display font-bold text-2xl mb-2 text-white">Analysis Failed</h2>
        <p className="font-mono text-sm text-brand-neutral mb-8">{error || "Asset not found"}</p>
        <Link to="/" className="font-display text-sm font-semibold border border-brand-primary text-brand-primary rounded-md px-6 py-3 hover:bg-brand-primary hover:text-bg-void transition-all">
          Back to Terminal
        </Link>
      </div>
    )
  }

  const getVerdictGradient = (verdict) => {
    switch (verdict?.toUpperCase()) {
      case 'PIRATED': return 'from-brand-secondary/15 to-transparent';
      case 'SUSPICIOUS': return 'from-brand-warning/15 to-transparent';
      case 'ORIGINAL': return 'from-brand-primary/15 to-transparent';
      default: return 'from-white/5 to-transparent';
    }
  }

  return (
    <div className="min-h-screen bg-bg-void text-text-primary pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-24 space-y-8">
        
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-brand-neutral hover:text-brand-primary transition-colors mb-4">
          <ArrowLeft className="w-3 h-3" />
          Run Another Scan
        </Link>

        {/* Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full bg-gradient-to-r ${getVerdictGradient(result.verdict)} border border-white/[0.07] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8`}
        >
          <div className="space-y-4 text-center md:text-left">
            <div>
              <p className="font-mono text-[11px] text-brand-neutral uppercase tracking-[0.2em] mb-2">Verdict</p>
              <Badge verdict={result.verdict?.toUpperCase()} />
            </div>
            
            <div className="font-mono text-[13px] text-brand-neutral flex items-center justify-center md:justify-start gap-3">
              <span>{result.matched_owner || 'UNKNOWN OWNER'}</span>
              <span className="opacity-30">|</span>
              <span>{result.matched_sport_category || 'UNSPECIFIED'}</span>
              <span className="opacity-30">|</span>
              <span>{result.matched_upload_date || 'DATE UNKNOWN'}</span>
            </div>
          </div>

          <ConfidenceRing score={Math.round(result.confidence_score * 100)} />
        </motion.div>

        {/* Comparison View */}
        {result.matched_content_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ComparisonView 
              submittedUrl={result.submitted_url}
              originalUrl={result.matched_file_url}
              similarityScore={Math.round((result.similarity_score || 0) * 100)}
              matchStart={result.timestamp_match_start}
              matchEnd={result.timestamp_match_end}
              heatmapImage={result.heatmap_image}
            />
          </motion.div>
        )}

        {/* AI Analysis & Evidence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Forensic Trace & AI Analysis */}
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Forensic Trace */}
            <Card className="lg:col-span-1 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs text-brand-primary uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Digital Forensic Trace
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-bg-void/50 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-[9px] text-brand-neutral uppercase tracking-tighter">DCT Watermark</p>
                    <p className={`font-mono text-xs font-bold ${result.watermark_verified ? 'text-brand-primary' : 'text-brand-neutral'}`}>
                      {result.watermark_verified ? 'VERIFIED' : 'NOT DETECTED'}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.watermark_verified ? 'bg-brand-primary/10 text-brand-primary' : 'bg-white/5 text-brand-neutral'}`}>
                    <Fingerprint className="w-4 h-4" />
                  </div>
                </div>

                {result.watermark_verified && (
                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg animate-pulse">
                     <p className="font-mono text-[9px] text-brand-primary uppercase mb-1">Decoded Payload</p>
                     <p className="font-mono text-[10px] text-white break-all">{result.watermark_payload}</p>
                  </div>
                )}

                <div className="p-4 bg-bg-void/50 border border-white/5 rounded-lg">
                   <p className="font-mono text-[9px] text-brand-neutral uppercase tracking-tighter mb-2">Hash Signature</p>
                   <div className="flex items-center gap-2 font-mono text-[10px] text-brand-primary truncate">
                      <Database className="w-3 h-3" />
                      {result.detection_id?.substring(0, 16) || result.id?.substring(0, 16) || 'N/A'}...
                   </div>
                </div>
              </div>
            </Card>

            {/* AI Analysis Panel */}
            <Card className="lg:col-span-2 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Zap className="w-5 h-5 fill-current" />
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider">AI Content Analysis</h3>
                </div>
                <Info className="w-4 h-4 text-brand-neutral opacity-50" />
              </div>
              
              <div className="relative">
                <span className="absolute -top-4 -left-2 text-6xl text-brand-primary/20 font-serif">"</span>
                <blockquote className="font-body italic text-lg text-white/90 pl-6 leading-relaxed">
                  {result.gemini_description || "No specific AI descriptive analysis available for this content payload."}
                </blockquote>
              </div>
            </Card>
          </div>

          {/* Evidence Report */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`h-full border-l-[3px] p-6 flex flex-col justify-between space-y-6 ${result.verdict?.toUpperCase() === 'PIRATED' ? 'border-l-brand-secondary' : 'border-l-brand-neutral/30'}`}>
              <div className="space-y-4">
                <h3 className={`font-mono text-xs uppercase tracking-widest ${result.verdict?.toUpperCase() === 'PIRATED' ? 'text-brand-secondary' : 'text-brand-neutral'}`}>Evidence Report</h3>
                <p className="font-body text-sm text-brand-neutral leading-relaxed">
                  {result.verdict?.toUpperCase() === 'PIRATED' 
                    ? "Forensic evidence package ready for DMCA takedown submission and rights protection enforcement."
                    : "No piracy evidence report generated for non-violating content."}
                </p>
              </div>

              {result.verdict?.toUpperCase() === 'PIRATED' && (
                <a 
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 border border-brand-secondary text-brand-secondary rounded-lg font-display text-sm font-semibold hover:bg-brand-secondary hover:text-white transition-all group"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  Download Evidence Report
                </a>
              )}
            </Card>
          </motion.div>

        </div>

      </main>
    </div>
  )
}
