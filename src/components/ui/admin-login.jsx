import * as React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { Input } from "./input"
import { LiquidMetalButton } from "./liquid-metal-button"

export function AdminLogin({ onLogin, onCancel }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (password === "passwordadmin123") {
      onLogin()
    } else {
      setError("Incorrect password. Access denied.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative z-50">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[var(--radius)] p-8 w-full max-w-md shadow-2xl relative"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Admin Authorization</h2>
          <p className="text-sm text-muted-foreground mt-2">Enter the master password to access the control center.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Input 
              type="password" 
              placeholder="Enter password..." 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              className="bg-background/50 text-center text-lg tracking-widest"
              autoFocus
            />
            {error && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive font-medium text-center">
                {error}
              </motion.span>
            )}
          </div>
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="w-full flex justify-center">
              <LiquidMetalButton label="Authenticate" onClick={handleSubmit} />
            </div>
            <button 
              type="button" 
              onClick={onCancel}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Return to Upload
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
