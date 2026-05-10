import * as React from "react"
import { useState, useEffect } from "react"
import ForensicScanner from "@/components/ForensicScanner"
import LoadingSteps from "@/components/LoadingSteps"

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
      <ForensicScanner />

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

      <LoadingSteps steps={STEPS} currentStep={currentStep} />
    </div>
  )
}
