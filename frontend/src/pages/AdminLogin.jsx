import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { Shield, Lock, AlertCircle } from 'lucide-react'
import { auth } from '../services/firebase'
import { signIn } from '../services/auth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/admin/dashboard')
      }
    })
    return unsubscribe
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-void flex flex-col items-center justify-center relative overflow-hidden px-4">
      
      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#12171F] border border-white/[0.07] rounded-xl p-12 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center space-y-6 mb-10">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-brand-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-mono text-xs text-brand-primary uppercase tracking-[0.3em]">Rights Holder Portal</h2>
            <p className="font-body text-brand-neutral text-sm">Sign in to manage your protected assets</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest block pl-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-void border border-white/10 rounded-md px-4 py-3 font-body text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest block pl-1">Security Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-void border border-white/10 rounded-md px-4 py-3 font-body text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ x: -10 }} 
              animate={{ x: [0, -10, 10, -10, 10, 0] }}
              className="flex items-center gap-2 text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20 p-3 rounded font-mono text-xs"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-brand-primary text-bg-void font-display font-bold uppercase tracking-widest rounded-lg py-4 transition-all duration-200 hover:brightness-110 hover:scale-[1.01] disabled:opacity-40"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px] text-brand-neutral uppercase tracking-widest opacity-60">
            <Lock className="w-3 h-3" />
            Secured access — verified rights holders only
          </div>
          
          <Link 
            to="/admin/register" 
            className="font-mono text-[11px] text-brand-primary hover:underline uppercase tracking-widest"
          >
            Request Access
          </Link>
        </div>
      </motion.div>

      <Link 
        to="/" 
        className="mt-8 font-mono text-xs text-brand-neutral hover:text-white transition-colors"
      >
        ← Back to Detection Terminal
      </Link>
    </div>
  )
}
