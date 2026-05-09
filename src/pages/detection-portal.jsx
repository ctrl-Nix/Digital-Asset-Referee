import * as React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { TextScramble } from "@/components/ui/text-scramble"
import { UploadZone } from "@/components/ui/upload-zone"
import { useState, useEffect } from "react"

export default function DetectionPortal() {
  const navigate = useNavigate()
  const [onboardingStep, setOnboardingStep] = useState(0)

  useEffect(() => {
    const hasSeen = localStorage.getItem("seenOnboarding")
    if (!hasSeen) {
      setTimeout(() => setOnboardingStep(1), 800)
    }
  }, [])

  const handleSkipOnboarding = () => {
    setOnboardingStep(0)
    localStorage.setItem("seenOnboarding", "true")
  }

  const handleNextOnboarding = () => {
    if (onboardingStep >= 3) {
      handleSkipOnboarding()
    } else {
      setOnboardingStep(prev => prev + 1)
    }
  }

  const handleAnalyzeSuccess = (detectionId) => {
    navigate(`/result/${detectionId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 text-center"
    >
      <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          <TextScramble text="Digital Asset Protector" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Detect unauthorized sports media instantly.
        </p>
      </div>

      <UploadZone 
        onAnalyzeSuccess={handleAnalyzeSuccess} 
        onboardingStep={onboardingStep}
        onNextOnboarding={handleNextOnboarding}
        onSkipOnboarding={handleSkipOnboarding}
      />
    </motion.div>
  )
}
