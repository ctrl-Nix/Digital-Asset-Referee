import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  Database, 
  Search, 
  AlertTriangle,
  User,
  Calendar,
  Play,
  Square,
  Radio,
  ExternalLink,
  Clock,
  Zap
} from 'lucide-react'
import { auth } from '../services/firebase'
import { getAssets, getSchedulerStatus, startScheduler, stopScheduler } from '../services/api'
import { signOut } from '../services/auth'
import { useAnomalyListener } from '../hooks/useAnomalyListener'
import { useAutoScanListener } from '../hooks/useAutoScanListener'
import AnomalyAlert from '../components/AnomalyAlert'
import AssetTable from '../components/AssetTable'
import StatCard from '../components/ui/StatCard'
import HardwareTelemetry from '../components/HardwareTelemetry'
import GlobalRadar from '../components/GlobalRadar'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [schedulerStatus, setSchedulerStatus] = useState(null)
  const [schedulerLoading, setSchedulerLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Real-time Firestore listener for auto-scan detections
  const { detections: autoScanDetections, infringements: autoScanInfringements } = useAutoScanListener(10)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/admin')
      } else {
        setUser(currentUser)
      }
    })
    return unsubscribe
  }, [navigate])

  useEffect(() => {
    const fetchAssets = async () => {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const token = await user.getIdToken()
        const response = await getAssets(token)
        setAssets(response.data.assets || [])
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load assets.')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [user])

  // Poll scheduler status every 10s
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getSchedulerStatus()
        setSchedulerStatus(res.data)
      } catch (e) {
        // Scheduler endpoint may not be available
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const ownerName = useMemo(() => user?.displayName || user?.email || '', [user])
  const alerts = useAnomalyListener(ownerName)

  const totalDetections = useMemo(
    () => assets.reduce((sum, asset) => sum + (asset.detection_count || 0), 0),
    [assets]
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  const handleSchedulerToggle = async () => {
    setSchedulerLoading(true)
    try {
      if (schedulerStatus?.running) {
        await stopScheduler()
      } else {
        await startScheduler({ interval_minutes: 5 })
      }
      // Refresh status
      const res = await getSchedulerStatus()
      setSchedulerStatus(res.data)
    } catch (e) {
      console.error('Scheduler toggle error:', e)
    } finally {
      setSchedulerLoading(false)
    }
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Register Asset', icon: PlusSquare, path: '/admin/register' },
  ]

  // Verdict color helper
  const getVerdictStyle = (verdict) => {
    switch(verdict) {
      case 'INFRINGEMENT': return { color: '#FF4F4F', bg: 'rgba(255,79,79,0.08)' }
      case 'SUSPICIOUS': return { color: '#FFB340', bg: 'rgba(255,179,64,0.08)' }
      case 'FAIR_USE': return { color: '#00E5A0', bg: 'rgba(0,229,160,0.08)' }
      default: return { color: '#8A9BB0', bg: 'rgba(138,155,176,0.08)' }
    }
  }

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
              <span className="font-mono text-[10px] text-brand-neutral truncate">{user?.email}</span>
              <span className="font-mono text-[9px] text-brand-primary uppercase tracking-tighter">Verified Owner</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs uppercase tracking-widest text-brand-secondary hover:bg-brand-secondary/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h1 className="font-mono text-xs text-brand-neutral uppercase tracking-[0.4em]">Dashboard</h1>
            <div className="flex items-center gap-2 font-body text-sm text-brand-neutral opacity-60">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scheduler Toggle */}
            <button
              onClick={handleSchedulerToggle}
              disabled={schedulerLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded font-mono text-xs uppercase tracking-widest transition-all ${
                schedulerStatus?.running
                  ? 'bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary/20'
                  : 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20'
              } disabled:opacity-50`}
            >
              {schedulerStatus?.running ? (
                <>
                  <Square className="w-3 h-3" />
                  Stop Scanner
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Start Scanner
                </>
              )}
            </button>

            <Link
              to="/admin/register"
              className="bg-brand-primary text-bg-void px-6 py-2.5 rounded font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <PlusSquare className="w-4 h-4" />
              Register New Asset
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && <AnomalyAlert alert={alerts[0]} />}

        {/* Auto-scan infringement alerts */}
        <AnimatePresence>
          {autoScanInfringements.slice(0, 3).map((det, i) => (
            <motion.div
              key={det.detection_id || i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#FF4F4F]/8 border border-[#FF4F4F]/20 rounded-lg p-3 mb-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-[#FF4F4F] animate-pulse" />
                </div>
                <Zap className="w-3 h-3 text-[#FF4F4F]" />
                <span className="font-mono text-[10px] text-[#FF4F4F] uppercase tracking-wider font-bold">
                  {det.agent_verdict}
                </span>
                <span className="font-mono text-[10px] text-white/50">
                  {det.platform && `[${det.platform}]`}
                </span>
                <span className="font-body text-xs text-white/60 truncate max-w-[300px]">
                  {det.source_metadata?.title || det.source_url || 'Auto-scan detection'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-white/30">
                  {det.confidence_score ? `${(det.confidence_score * 100).toFixed(0)}%` : ''}
                </span>
                {det.detection_id && (
                  <Link
                    to={`/result/${det.detection_id}`}
                    className="text-white/30 hover:text-brand-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hardware Telemetry */}
        <HardwareTelemetry />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard 
            label="Registered Assets" 
            value={assets.length} 
            icon={Database} 
            accentColor="#00E5A0" 
          />
          <StatCard 
            label="Total Detections" 
            value={totalDetections} 
            icon={Search} 
            accentColor="#00E5A0" 
          />
          <StatCard 
            label="Piracy Alerts" 
            value={alerts.length + autoScanInfringements.length} 
            icon={AlertTriangle} 
            accentColor="#FF4F4F" 
          />
          <StatCard 
            label="Auto-Scans" 
            value={schedulerStatus?.total_scans || 0} 
            icon={Radio} 
            accentColor="#3B82F6" 
          />
        </div>

        {/* Scheduler Status + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Scheduler Status Card */}
          <div className="bg-[#12171F] border border-white/[0.07] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Radio className="w-3 h-3" />
                Auto-Scanner
              </h3>
              <div className={`w-2 h-2 rounded-full ${schedulerStatus?.running ? 'bg-[#00E5A0] animate-pulse' : 'bg-white/20'}`} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-white/30 uppercase">Status</span>
                <span className={schedulerStatus?.running ? 'text-[#00E5A0]' : 'text-white/50'}>
                  {schedulerStatus?.running ? 'SCANNING' : 'IDLE'}
                </span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-white/30 uppercase">Total Scans</span>
                <span className="text-white/60">{schedulerStatus?.total_scans || 0}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-white/30 uppercase">Total Detections</span>
                <span className="text-white/60">{schedulerStatus?.total_detections || 0}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-white/30 uppercase">Last Scan</span>
                <span className="text-white/60">
                  {schedulerStatus?.last_scan_time 
                    ? new Date(schedulerStatus.last_scan_time).toLocaleTimeString()
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-white/30 uppercase">Last Infringements</span>
                <span className={schedulerStatus?.last_scan_infringements > 0 ? 'text-[#FF4F4F]' : 'text-white/60'}>
                  {schedulerStatus?.last_scan_infringements || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Live Auto-Scan Feed */}
          <div className="lg:col-span-2 bg-[#12171F] border border-white/[0.07] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
                Live Detection Feed
              </h3>
              <span className="font-mono text-[9px] text-white/20 uppercase">
                {autoScanDetections.length} recent
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {autoScanDetections.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="w-6 h-6 text-white/10 mx-auto mb-2" />
                  <p className="font-mono text-[10px] text-white/20 uppercase">No auto-scan detections yet</p>
                  <p className="font-mono text-[9px] text-white/10 mt-1">Start the scanner to begin monitoring</p>
                </div>
              ) : (
                autoScanDetections.map((det, i) => {
                  const vs = getVerdictStyle(det.agent_verdict)
                  return (
                    <motion.div
                      key={det.detection_id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: vs.color }} />
                      <span
                        className="font-mono text-[9px] uppercase tracking-wider font-bold min-w-[80px]"
                        style={{ color: vs.color }}
                      >
                        {det.agent_verdict || 'PENDING'}
                      </span>
                      <span className="font-mono text-[9px] text-white/30 min-w-[55px]">
                        [{det.platform || '?'}]
                      </span>
                      <span className="font-body text-[11px] text-white/50 truncate flex-1">
                        {det.source_metadata?.title || det.source_url || '—'}
                      </span>
                      <span className="font-mono text-[9px] text-white/20 flex-shrink-0">
                        {det.confidence_score ? `${(det.confidence_score * 100).toFixed(0)}%` : ''}
                      </span>
                      <Link
                        to={`/result/${det.detection_id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <ExternalLink className="w-3 h-3 text-white/20 hover:text-brand-primary" />
                      </Link>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Global Piracy Monitor - Visual X-Factor */}
        <div className="mb-10">
          <div className="bg-[#12171F] border border-white/[0.07] rounded-lg overflow-hidden p-8 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                   Real-Time Global Piracy Monitor
                </h3>
                <p className="font-mono text-[10px] text-brand-neutral uppercase tracking-widest">Active Stream Interception Clusters</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    <span className="font-mono text-[9px] text-brand-neutral uppercase">Clean Nodes</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-secondary" />
                    <span className="font-mono text-[9px] text-brand-neutral uppercase">Infringement Detected</span>
                 </div>
              </div>
            </div>

            {/* Animated Radar Visualization */}
            <div className="h-64 mt-4">
              <GlobalRadar detections={autoScanDetections} />
            </div>
          </div>
        </div>

        {/* Asset Registry */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-display font-bold text-xl uppercase tracking-wider text-white">Asset Registry</h2>
            <div className="font-mono text-[10px] text-brand-neutral uppercase tracking-widest">
              Live Monitor: {assets.length} Elements
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white/[0.05] rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-brand-secondary/5 border border-brand-secondary/20 p-6 rounded-lg text-center">
               <AlertTriangle className="w-8 h-8 text-brand-secondary mx-auto mb-3" />
               <p className="font-mono text-sm text-brand-secondary">{error}</p>
            </div>
          ) : (
            <AssetTable assets={assets} />
          )}
        </div>

      </main>
    </div>
  )
}
