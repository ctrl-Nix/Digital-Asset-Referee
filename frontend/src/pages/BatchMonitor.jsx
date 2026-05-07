import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  Search, 
  User,
  ArrowLeft,
  List,
  Play,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink
} from 'lucide-react'
import { auth } from '../services/firebase'
import { batchDetect, getReportUrl } from '../services/api'

export default function BatchMonitor() {
  const [urlsText, setUrlsText] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progressIndex, setProgressIndex] = useState(0)
  
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin')
      }
    })
    return unsubscribe
  }, [navigate])

  const urlLines = urlsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const isValid = urlLines.length > 0 && urlLines.length <= 10

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isValid) return

    setLoading(true)
    setError('')
    setResults([])
    setProgressIndex(1)

    // Simulating sequential log
    const logInterval = setInterval(() => {
        setProgressIndex(prev => Math.min(prev + 1, urlLines.length))
    }, 1500)

    try {
      const response = await batchDetect(urlLines)
      setResults(response.data || [])
      clearInterval(logInterval)
      setProgressIndex(urlLines.length)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Batch detection failed.')
      clearInterval(logInterval)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Register Asset', icon: PlusSquare, path: '/admin/register' },
  ]

  return (
    <div className="min-h-screen bg-bg-void text-text-primary flex">
      
      {/* Sidebar */}
      <aside className="w-60 bg-[#0C0F14] border-r border-white/[0.07] flex flex-col fixed inset-y-0 z-50">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-brand-primary flex items-center justify-center rounded">
              <span className="font-display font-black text-bg-void text-xl">G</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-white tracking-tighter leading-none">GUARD</span>
              <span className="font-mono text-[9px] text-brand-primary tracking-widest leading-none mt-1">SECURITY</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all group ${
                  isActive 
                    ? 'bg-[#1A2130] text-brand-primary border-l-[3px] border-l-brand-primary' 
                    : 'text-brand-neutral hover:bg-[#1A2130] hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-brand-neutral group-hover:text-white'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.07] space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-mono text-[10px] text-brand-neutral truncate">{auth.currentUser?.email}</span>
              <span className="font-mono text-[9px] text-brand-primary uppercase tracking-tighter">Verified Owner</span>
            </div>
          </div>
          <button
            onClick={() => { auth.signOut(); navigate('/admin') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs uppercase tracking-widest text-brand-secondary hover:bg-brand-secondary/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8">
        
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 font-mono text-[10px] text-brand-neutral hover:text-brand-primary transition-colors uppercase tracking-widest mb-4">
              <ArrowLeft className="w-3 h-3" />
              Back to Dashboard
            </Link>
            <h1 className="font-display font-bold text-3xl uppercase tracking-wider text-white">Batch Intelligence Scan</h1>
            <p className="font-body text-brand-neutral mt-2">Concurrent forensic analysis for high-volume content streams</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Input */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end pl-1">
                  <label className="font-mono text-[11px] text-brand-primary uppercase tracking-widest">Scan Queue</label>
                  <span className="font-mono text-[10px] text-brand-neutral">{urlLines.length}/10 URLs</span>
                </div>
                <textarea
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  placeholder="https://social-platform.com/video/123&#10;https://illegal-stream.net/live/456"
                  className="w-full bg-[#12171F] border border-white/10 rounded-lg p-4 font-mono text-xs text-white h-64 focus:outline-none focus:border-brand-primary transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full bg-brand-primary text-bg-void font-display font-bold uppercase tracking-widest rounded-lg py-4 flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-bg-void border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Initiate Batch Scan
              </button>

              {loading && (
                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 space-y-3">
                   <div className="flex items-center gap-3 text-brand-primary font-mono text-[10px] uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                      Processing Intelligence Log
                   </div>
                   <div className="space-y-1">
                      {urlLines.slice(0, progressIndex).map((url, i) => (
                        <div key={i} className="font-mono text-[9px] text-brand-neutral truncate opacity-60">
                           {`[LOG] ANALYZING_SOURCE: ${url.substring(0, 40)}...`}
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            {/* Right: Results Table */}
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between px-2">
                 <h2 className="font-display font-bold text-xl uppercase tracking-wider text-white">Batch Results</h2>
                 <List className="w-5 h-5 text-brand-neutral opacity-50" />
               </div>

               <div className="bg-[#12171F] border border-white/[0.07] rounded-lg overflow-hidden min-h-[400px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#1A2130] border-b border-white/[0.07]">
                        <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Source URL</th>
                        <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Verdict</th>
                        <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Confidence</th>
                        <th className="px-6 py-4 font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {results.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#1A2130] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs text-brand-neutral truncate max-w-[200px]" title={item.url}>
                              {item.url}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             {item.status === 'failed' ? (
                                <span className="flex items-center gap-2 text-red-500 font-mono text-[10px] font-bold uppercase" title={item.error}>
                                   <AlertTriangle className="w-3 h-3" /> Error
                                </span>
                             ) : item.verdict === 'Pirated' ? (
                                <span className="flex items-center gap-2 text-brand-secondary font-mono text-[10px] font-bold uppercase">
                                   <AlertTriangle className="w-3 h-3" /> Pirated
                                </span>
                             ) : item.verdict === 'Original' ? (
                                <span className="flex items-center gap-2 text-brand-primary font-mono text-[10px] font-bold uppercase">
                                   <CheckCircle2 className="w-3 h-3" /> Original
                                </span>
                             ) : (
                                <span className="font-mono text-[10px] text-brand-neutral uppercase">{item.verdict || 'Unknown'}</span>
                             )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-white">
                            {item.status === 'failed' ? '---' : typeof item.confidence_score === 'number' ? `${Math.round(item.confidence_score * 100)}%` : '---'}
                          </td>
                          <td className="px-6 py-4">
                            {item.status === 'success' && item.verdict === 'Pirated' && item.detection_id ? (
                               <button 
                                 onClick={() => window.open(getReportUrl(item.detection_id), '_blank')}
                                 className="text-brand-secondary hover:text-white transition-colors"
                               >
                                 <Download className="w-4 h-4" />
                               </button>
                            ) : item.status === 'success' ? (
                               <Link to={`/result/${item.detection_id || ''}`} className="text-brand-primary hover:text-white transition-colors">
                                 <ExternalLink className="w-4 h-4" />
                               </Link>
                            ) : (
                               <span className="text-white/20" title={item.error}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {results.length === 0 && !loading && (
                        <tr>
                          <td colSpan="4" className="px-6 py-24 text-center">
                             <div className="opacity-20 flex flex-col items-center gap-3">
                                <Search className="w-12 h-12 text-brand-neutral" />
                                <span className="font-mono text-xs uppercase tracking-[0.2em]">Queue Empty — Awaiting Input</span>
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

      </main>
    </div>
  )
}
