import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import UploadZone from '../components/UploadZone'
import LoadingSteps from '../components/ui/LoadingSteps'
import { detectMedia, chatWithAI } from '../services/api'
import Card from '../components/ui/Card'

export default function DetectionPortal() {
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiInfo, setAiInfo] = useState(null)
  const navigate = useNavigate()

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setUrl('')
    setError('')
  }

  const handleUrlChange = (value) => {
    setUrl(value)
    setFile(null)
    setError('')
  }

  const canSubmit = !!file || url.trim().length > 0

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else {
        formData.append('url', url.trim())
      }
      const response = await detectMedia(formData)
      
      try {
        const aiRes = await chatWithAI("Analyze sports media piracy patterns")
        setAiInfo(aiRes.data)
      } catch (err) {
        console.error('AI Chat failed:', err)
      }

      navigate(`/result/${response.data.detection_id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Detection failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-void text-text-primary relative overflow-hidden">
      <Navbar />

      {/* Radial Gradient Background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ background: 'radial-gradient(circle at center, rgba(0,229,160,0.04) 0%, transparent 60%)' }} 
      />

      <main className="relative z-10 mx-auto max-w-5xl px-4 flex flex-col items-center justify-center min-h-screen pt-16">
        
        {/* Hero Section */}
        <motion.div
          className="text-center space-y-6 mb-16 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[52px] text-white tracking-tight">
            Is this asset authentic?
          </h1>
          <p className="font-body text-lg text-brand-neutral max-w-2xl mx-auto">
            Submit any digital media for instant verification against our verified registry
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 pt-8">
            <div className="text-center">
              <div className="font-mono text-xl text-brand-primary font-medium">26K+</div>
              <div className="font-body text-sm text-brand-neutral mt-1">Assets Trained</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="font-mono text-xl text-brand-primary font-medium">88%</div>
              <div className="font-body text-sm text-brand-neutral mt-1">Detection Accuracy</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="font-mono text-xl text-brand-primary font-medium">&lt; 15s</div>
              <div className="font-body text-sm text-brand-neutral mt-1">Avg Scan Time</div>
            </div>
          </div>
        </motion.div>

        {/* Upload Zone / Scanning State */}
        <motion.div
          className="w-full relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {loading ? (
            <div className="w-full max-w-2xl mx-auto bg-bg-surface border border-white/10 rounded-2xl p-12 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0C0F14]/80 backdrop-blur-sm z-0" />
              <div className="relative z-10 w-full">
                <LoadingSteps />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
              <UploadZone
                accept="image/*,video/*"
                maxSizeMB={200}
                onFileSelect={handleFileSelect}
                onUrlChange={handleUrlChange}
              />
              
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full h-13 bg-[#00E5A0] text-[#050709] font-display font-semibold uppercase tracking-wide rounded-lg py-4 transition-all duration-200 hover:brightness-110 hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100"
              >
                Initiate Scan
              </button>
            </form>
          )}

          {aiInfo && (
            <Card className="p-6 mt-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <h2 className="font-display font-bold text-lg text-white">
                  AMD AI Inference
                </h2>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-brand-neutral uppercase">Hardware</span>
                  <span className="text-white">{aiInfo.hardware}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-brand-neutral uppercase">Backend</span>
                  <span className="text-white">{aiInfo.backend}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-brand-neutral uppercase">Speed</span>
                  <span className="text-brand-primary font-bold">{aiInfo.speed}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="font-mono text-[10px] text-brand-neutral uppercase mb-1">AI Response</p>
                <p className="font-body text-sm text-white/80 leading-relaxed">
                  {aiInfo.reply}
                </p>
              </div>
            </Card>
          )}
        </motion.div>

      </main>
    </div>
  )
}
