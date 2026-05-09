import * as React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Loader2, File, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { ProcessingState } from "@/components/ui/processing-state"
import { AnimatedBlock } from "./animated-block"
import { OnboardingPopover } from "@/components/ui/onboarding-popover"
import { detectMedia } from "@/services/api"

export function UploadZone({ className, onAnalyzeSuccess, onboardingStep, onNextOnboarding, onSkipOnboarding }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [detectionId, setDetectionId] = useState(null)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setError("")
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError("")
    }
  }

  const handleRemoveFile = (e) => {
    e.stopPropagation()
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAnalyze = async () => {
    if (!file && !url.trim()) return
    setIsProcessing(true)
    setError("")

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else {
        formData.append('url', url.trim())
      }
      
      const response = await detectMedia(formData)
      setDetectionId(response.data.detection_id)
      // The ProcessingState will handle the visual transition and call onComplete
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Detection failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const hasInput = !!file || url.trim().length > 0

  return (
    <AnimatedBlock
      className={cn(
        "flex flex-col w-full max-w-md transition-transform hover:scale-[1.01] duration-300",
        className
      )}
    >
      <div className="p-6 flex flex-col gap-6 w-full h-full relative min-h-[350px] justify-center">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center justify-center"
            >
              <ProcessingState detectionId={detectionId} onComplete={onAnalyzeSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-6"
            >
              <OnboardingPopover
                isOpen={onboardingStep === 1}
                title="Getting Started"
                description="Upload a file or paste a link to start detection"
                onNext={onNextOnboarding}
                onSkip={onSkipOnboarding}
                side="bottom"
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer relative overflow-hidden group",
                    isDragging ? "border-primary bg-accent/20" : "border-border/50 hover:border-primary/50",
                    file && "border-border/20 cursor-default"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleChange} 
                  className="hidden" 
                  accept="image/*,video/*"
                />

                {file ? (
                  <div className="flex flex-col items-center justify-center w-full animate-in fade-in duration-300">
                    <div className="relative p-4 bg-background/50 border border-border/50 rounded-lg w-full flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-md shrink-0">
                        <File className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden text-left">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <button 
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "p-3 rounded-full transition-colors",
                      isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      <Upload className={cn("w-6 h-6 transition-transform", isDragging && "scale-110")} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {isDragging ? "Release to upload" : "Drop media or click to upload"}
                      </p>
                      {!isDragging && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports images and videos
                        </p>
                      )}
                    </div>
                  </>
                )}
                </div>
              </OnboardingPopover>

              <div className="flex flex-col gap-3 items-center w-full">
                <Input 
                  placeholder="Paste media URL (YouTube, Twitter, etc.)" 
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError("") }}
                  disabled={isProcessing}
                  className="bg-transparent w-full"
                />
                
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                  </div>
                )}

                <div className={cn("w-full flex justify-center", !hasInput || isProcessing ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer")}>
                  <OnboardingPopover
                    isOpen={onboardingStep === 2}
                    title="Start Detection"
                    description="We scan and match content against registered assets"
                    onNext={onNextOnboarding}
                    onSkip={onSkipOnboarding}
                    isLast={true}
                    side="bottom"
                  >
                    <div>
                      <LiquidMetalButton label="Analyze" onClick={hasInput && !isProcessing ? handleAnalyze : undefined} />
                    </div>
                  </OnboardingPopover>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedBlock>
  )
}
