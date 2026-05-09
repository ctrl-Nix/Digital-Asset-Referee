import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  "Normalizing media",
  "Generating fingerprint",
  "Matching against registry",
  "Running AI analysis",
]

export function ProcessingState({ onComplete, detectionId }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    // Complete the entire process in about 5 seconds
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / 50) // 50 ticks of 100ms = 5 seconds
        if (next >= 100) {
          clearInterval(interval)
          return 100
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress >= 100 && detectionId && !isDone) {
      setIsDone(true)
      setTimeout(() => onComplete(detectionId), 600)
    }
  }, [progress, detectionId, onComplete, isDone])

  useEffect(() => {
    if (progress >= 100) setCurrentStep(4)
    else if (progress >= 75) setCurrentStep(3)
    else if (progress >= 50) setCurrentStep(2)
    else if (progress >= 25) setCurrentStep(1)
  }, [progress])

  return (
    <div className="flex flex-col items-center justify-center w-full gap-8 py-4">
      {/* Animated Indicator */}
      <div className="relative flex items-center justify-center mb-2">
        <div className="absolute inset-[-20%] border border-primary/30 rounded-full animate-ping [animation-duration:3s]" />
        <div className="absolute inset-[-50%] border border-primary/10 rounded-full animate-ping [animation-duration:3s] [animation-delay:1s]" />
        <div className="bg-background/80 backdrop-blur-md p-4 rounded-full border border-border/50 relative z-10 shadow-lg">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>

      {/* Status Text & Bar */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <h3 className="text-xl font-medium text-foreground tracking-tight">Analyzing content...</h3>
        
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground font-medium">Scanning against registered content...</p>
      </div>

      {/* Steps list */}
      <div className="flex flex-col gap-4 w-full max-w-sm mx-auto mt-2 pl-2 md:pl-8">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > index
          const isActive = currentStep === index
          const isPending = currentStep < index

          return (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-500 shadow-sm shrink-0",
                isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                isActive ? "border-primary text-primary bg-primary/10" : 
                "border-border/50 text-muted-foreground bg-background/50"
              )}>
                {isCompleted ? <Check className="w-3 h-3" strokeWidth={3} /> : 
                 isActive ? <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> : 
                 null}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors duration-500",
                isCompleted ? "text-foreground" : 
                isActive ? "text-foreground" : 
                "text-muted-foreground"
              )}>
                {step}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
