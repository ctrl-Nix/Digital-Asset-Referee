import { useMemo, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, Scan, Link2, File, CheckCircle2 } from 'lucide-react'

export default function UploadZone({ onFileSelect, onUrlChange, accept, maxSizeMB }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be less than ${maxSizeMB}MB.`)
      return
    }
    setError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (event) => {
    const file = event.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    onFileSelect(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fileSelectedText = useMemo(() => {
    if (!selectedFile) return null
    return `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
  }, [selectedFile])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <motion.div
        className={`w-full bg-[#12171F] border-2 rounded-2xl p-12 transition-all duration-200 ease-in-out cursor-pointer relative ${
          dragging 
            ? 'border-solid border-[#00E5A0] bg-[#00E5A0]/5 scale-[1.01]' 
            : 'border-dashed border-[#00E5A0]/25'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={(e) => {
          // Don't trigger file input if clicking URL input or remove button
          if (e.target.closest('.no-click-trigger')) return
          fileInputRef.current?.click()
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center space-y-6 pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00E5A0]/20 rounded-full animate-ping opacity-50" />
              <Shield className="w-12 h-12 text-[#00E5A0] relative z-10" />
              <Scan className="w-6 h-6 text-[#00E5A0] absolute inset-0 m-auto z-20 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display font-medium text-[20px] text-white">Drop your media here</h3>
              <p className="font-mono text-[13px] text-brand-neutral">
                JPG · PNG · MP4 · MOV · WebM — up to {maxSizeMB}MB
              </p>
            </div>

            <div className="flex items-center w-full max-w-xs mx-auto my-6 gap-4 pointer-events-auto no-click-trigger">
              <div className="h-px bg-white/10 flex-1" />
              <span className="font-mono text-xs text-brand-neutral uppercase tracking-widest">or</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="w-full max-w-sm mx-auto relative pointer-events-auto no-click-trigger">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-neutral" />
              <input
                type="url"
                placeholder="Paste a link to the content..."
                className="w-full bg-[#0C0F14] border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-brand-neutral/50 focus:outline-none focus:border-[#00E5A0] focus:ring-1 focus:ring-[#00E5A0]/15 transition-all"
                onChange={(e) => {
                  setSelectedFile(null)
                  onFileSelect(null)
                  onUrlChange(e.target.value)
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#00E5A0]/10 flex items-center justify-center">
              <File className="w-8 h-8 text-[#00E5A0]" />
            </div>
            
            <div className="space-y-2">
              <p className="font-mono text-sm text-white">{fileSelectedText}</p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00E5A0]" />
                <span className="font-mono text-xs text-[#00E5A0] uppercase tracking-wide">Ready to scan</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="font-mono text-xs text-[#FF4F4F] hover:text-[#FF4F4F]/80 transition-colors uppercase tracking-widest mt-4 no-click-trigger"
            >
              Remove
            </button>
          </div>
        )}
      </motion.div>

      {error && (
        <p className="text-center font-mono text-sm text-[#FF4F4F]">
          ⚠ {error}
        </p>
      )}
    </div>
  )
}
