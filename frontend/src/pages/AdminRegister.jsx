import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  ShieldCheck, 
  User,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react'
import { auth } from '../services/firebase'
import { registerAsset } from '../services/api'
import UploadZone from '../components/UploadZone'
import Badge from '../components/ui/Badge'

export default function AdminRegister() {
  const [file, setFile] = useState(null)
  const [ownerName, setOwnerName] = useState('')
  const [sportCategory, setSportCategory] = useState('')
  const [contentId, setContentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin')
      } else {
        setOwnerName(user.displayName || user.email || '')
        // Auto-generate a content ID prefix
        setContentId(`ASSET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`)
      }
    })
    return unsubscribe
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    
    if (!file) return setError('Media file is required for registration.')
    if (!sportCategory) return setError('Please select a sport category.')

    setLoading(true)
    try {
      const user = auth.currentUser
      const idToken = await user.getIdToken()
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('owner_name', ownerName)
      formData.append('sport_category', sportCategory)
      formData.append('content_id', contentId)

      await registerAsset(formData, idToken)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to register asset.')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Register Asset', icon: PlusSquare, path: '/admin/register' },
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-bg-void flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#12171F] border border-white/[0.07] rounded-2xl p-12 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-brand-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl text-white">Asset Securely Registered</h2>
            <Badge verdict="ORIGINAL" />
          </div>
          <p className="font-body text-brand-neutral text-sm">
            The media asset has been fingerprinted and added to the global protection registry.
          </p>
          <Link 
            to="/admin/dashboard" 
            className="block w-full py-4 bg-brand-primary text-bg-void font-display font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    )
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
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 font-mono text-[10px] text-brand-neutral hover:text-brand-primary transition-colors uppercase tracking-widest mb-4">
              <ArrowLeft className="w-3 h-3" />
              Back to Dashboard
            </Link>
            <h1 className="font-display font-bold text-3xl uppercase tracking-wider text-white">Register New Asset</h1>
            <p className="font-body text-brand-neutral mt-2">Initialize media fingerprinting for rights protection</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Media Upload */}
            <div className="space-y-4">
              <label className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest block pl-1">Media Source</label>
              <div className="relative">
                 <UploadZone 
                    onFileSelect={setFile}
                    onUrlChange={() => {}}
                    compact={true}
                 />
              </div>
              {file && (
                <div className="bg-[#12171F] border border-white/10 rounded-lg p-4 flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-primary/10 rounded flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-brand-primary" />
                   </div>
                   <div className="flex-1 truncate">
                      <p className="font-mono text-xs text-white truncate">{file.name}</p>
                      <p className="font-mono text-[10px] text-brand-neutral">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                   </div>
                </div>
              )}
            </div>

            {/* Right Column: Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest block pl-1">Content Identifier</label>
                <input
                  type="text"
                  value={contentId}
                  onChange={(e) => setContentId(e.target.value)}
                  className="w-full bg-[#12171F] border border-white/10 rounded-md px-4 py-3 font-mono text-xs text-brand-primary focus:outline-none focus:border-brand-primary transition-all"
                  placeholder="AUTO-GENERATING..."
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest block pl-1">Rights Holder</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-[#12171F] border border-white/10 rounded-md px-4 py-3 font-body text-sm text-white focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest block pl-1">Sport Category</label>
                <select
                  value={sportCategory}
                  onChange={(e) => setSportCategory(e.target.value)}
                  className="w-full bg-[#12171F] border border-white/10 rounded-md px-4 py-3 font-body text-sm text-white focus:outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  <option value="Football">Football / Soccer</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Cricket">Cricket</option>
                  <option value="UFC">UFC / MMA</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Other">Other Global Sports</option>
                </select>
              </div>

              {error && (
                <div className="p-4 bg-brand-secondary/10 border border-brand-secondary/20 rounded-lg text-brand-secondary font-mono text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-bg-void font-display font-bold uppercase tracking-widest rounded-lg py-4 flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-bg-void border-t-transparent rounded-full animate-spin" />
                    Fingerprinting Asset...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Register Asset
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  )
}
