import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_STEPS = [
  "Normalizing media",
  "Generating fingerprint",
  "Matching against registry",
  "Running AI analysis",
]

export default function LoadingSteps({ steps = DEFAULT_STEPS, currentStep = 0 }) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      {steps.map((step, index) => {
        const isCompleted = currentStep > index
        const isActive = currentStep === index
        return (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: isCompleted || isActive ? 1 : 0.4, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border shadow-inner",
                isCompleted
                  ? "bg-primary border-primary text-primary-foreground"
                  : isActive
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border/50 text-muted-foreground bg-background/50"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Circle className={cn("w-3 h-3", isActive ? "text-primary" : "text-muted-foreground")} />
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium tracking-tight",
                isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
