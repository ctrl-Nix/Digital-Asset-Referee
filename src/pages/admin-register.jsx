import * as React from "react"
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, ArrowLeft, Video, AlertTriangle, CheckCircle2 } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/services/firebase"
import { registerAsset } from "@/services/api"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { cn } from "@/lib/utils"

export default function AdminRegister() {
  const [title, setTitle] = useState("")
  const [sportCategory, setSportCategory] = useState("")
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = React.useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/admin")
      }
    })
    return unsubscribe
  }, [navigate])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!title || !file || !sportCategory) {
      setError("All fields are required for registry entry.")
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
      formData.append("sport_category", sportCategory)
      
      await registerAsset(formData, token)
      
      setSuccess(true)
      setTimeout(() => {
        navigate("/admin/dashboard")
      }, 2000)
    } catch (err) {
      setError(err.message || "Failed to register asset.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-16 text-center space-y-8 shadow-2xl"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Mission Success</h2>
            <p className="text-muted-foreground font-medium">Asset securely fingerprinted and added to global registry.</p>
          </div>
          <LiquidMetalButton label="Back to Dashboard" onClick={() => navigate("/admin/dashboard")} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-8 pb-20 relative z-10">
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate("/admin/dashboard")} 
          className="group flex w-fit items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          <span>Back to Dashboard</span>
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Initialize Asset Protection</h1>
          <p className="text-muted-foreground mt-1 font-medium">Register high-fidelity reference media for global rights enforcement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* MEDIA SECTION */}
        <div className="flex flex-col gap-6">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Forensic Source</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-video border-2 border-dashed border-border/30 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all group overflow-hidden relative bg-card/20",
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-background/50">
                <Video className="w-12 h-12 text-primary mb-2" />
                <span className="text-sm font-bold text-foreground px-4 truncate max-w-full">{file.name}</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Target Locked</span>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted/20 rounded-2xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <Video className="w-10 h-10 text-muted-foreground" />
                </div>
                <span className="text-sm font-bold text-foreground">Secure Media Upload</span>
                <span className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest opacity-60">MP4, MOV, JPG, PNG supported</span>
              </>
            )}
          </div>
          
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Security Protocol</span>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed">
                By registering this asset, you confirm legal ownership. The system will generate a unique DCT watermark and forensic fingerprint for global monitoring.
             </p>
          </div>
        </div>

        {/* FIELDS SECTION */}
        <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset Identity</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => { setTitle(e.target.value); setError("") }} 
              placeholder="e.g. World Cup 2026 - Semi Final" 
              className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Domain Category</label>
            <select
              value={sportCategory}
              onChange={(e) => { setSportCategory(e.target.value); setError("") }}
              className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground appearance-none cursor-pointer"
            >
              <option value="">Select Domain</option>
              <option value="Football">Football / Soccer</option>
              <option value="Basketball">Basketball</option>
              <option value="Cricket">Cricket</option>
              <option value="UFC">UFC / MMA</option>
              <option value="Tennis">Tennis</option>
              <option value="Other">Custom Rights</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Content ID</label>
            <div className="w-full bg-muted/20 border border-border/30 rounded-2xl px-5 py-4 text-xs font-mono text-primary flex items-center gap-2">
              <span className="opacity-50">#</span>
              {title ? title.toUpperCase().replace(/\s+/g, '-').substring(0, 20) : "SECURE-GEN-XXXX"}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-wide animate-in shake duration-300">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="mt-4">
            <LiquidMetalButton label={isSubmitting ? "Fingerprinting..." : "Initiate Protection"} onClick={isSubmitting ? undefined : handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  )
}
