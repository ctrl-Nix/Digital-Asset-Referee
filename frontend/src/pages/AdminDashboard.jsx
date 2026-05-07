import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  Database, 
  Search, 
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react'
import { auth } from '../services/firebase'
import { getAssets } from '../services/api'
import { signOut } from '../services/auth'
import { useAnomalyListener } from '../hooks/useAnomalyListener'
import AnomalyAlert from '../components/AnomalyAlert'
import AssetTable from '../components/AssetTable'
import StatCard from '../components/ui/StatCard'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

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

          <Link
            to="/admin/register"
            className="bg-brand-primary text-bg-void px-6 py-2.5 rounded font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <PlusSquare className="w-4 h-4" />
            Register New Asset
          </Link>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && <AnomalyAlert alert={alerts[0]} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
            value={alerts.length} 
            icon={AlertTriangle} 
            accentColor="#FF4F4F" 
          />
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

            {/* Mock Map / Radar Visual */}
            <div className="h-48 w-full bg-[#0C0F14] rounded-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #00E5A0 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
               <div className="absolute w-full h-[1px] bg-brand-primary/10 top-1/2 -translate-y-1/2" />
               <div className="absolute h-full w-[1px] bg-brand-primary/10 left-1/2 -translate-x-1/2" />
               
               {/* Pulsing Alert Nodes */}
               <div className="absolute top-1/4 left-1/3 group">
                  <div className="w-3 h-3 bg-brand-secondary rounded-full animate-ping opacity-75" />
                  <div className="absolute inset-0 w-3 h-3 bg-brand-secondary rounded-full" />
                  <div className="absolute top-4 left-0 bg-bg-void/90 border border-brand-secondary/30 px-2 py-1 rounded text-[8px] font-mono text-brand-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                     UFC Live_Stream_04 (London)
                  </div>
               </div>

               <div className="absolute bottom-1/3 right-1/4 group">
                  <div className="w-3 h-3 bg-brand-secondary rounded-full animate-ping opacity-75" />
                  <div className="absolute inset-0 w-3 h-3 bg-brand-secondary rounded-full" />
                  <div className="absolute top-4 left-0 bg-bg-void/90 border border-brand-secondary/30 px-2 py-1 rounded text-[8px] font-mono text-brand-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                     EPL_Full_Match_Replay (Nairobi)
                  </div>
               </div>

               <span className="font-mono text-[10px] text-brand-primary opacity-40 uppercase tracking-[0.5em]">Forensic Scan Active</span>
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
