import * as React from "react"
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Lock, Shield, AlertCircle } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/services/firebase"
import { signIn } from "@/services/auth"
import { Input } from "@/components/ui/input"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/admin/dashboard")
      }
    })
    return unsubscribe
  }, [navigate])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      navigate("/admin/dashboard")
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 relative z-50">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 text-center relative z-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 rotate-3">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Rights Holder Portal</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to manage your protected assets</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
            <Input 
              type="email" 
              placeholder="admin@example.com" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError("") }}
              className="bg-background/40 border-border/40 focus:border-primary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Security Key</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              className="bg-background/40 border-border/40 focus:border-primary/50"
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="flex items-center gap-2 text-xs text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="flex flex-col items-center gap-6 mt-2">
            <div className="w-full flex justify-center">
              <LiquidMetalButton label={loading ? "Authenticating..." : "Sign In"} onClick={handleSubmit} />
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Link 
                to="/admin/register" 
                className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
              >
                Request Access
              </Link>
              <Link 
                to="/" 
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Return to Terminal
              </Link>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
