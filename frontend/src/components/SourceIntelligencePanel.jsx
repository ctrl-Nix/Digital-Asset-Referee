import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * SourceIntelligencePanel
 * Terminal-style log with colour-coded tags, line-by-line typewriter reveal.
 */
export default function SourceIntelligencePanel({
  data,
  detectionId,
  verdict,
  similarityScore,
  timestamp,
}) {
  const lines = buildLines({ data, detectionId, verdict, similarityScore, timestamp })
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    if (!lines.length) return
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setVisibleCount(i)
      if (i >= lines.length) clearInterval(timer)
    }, 200)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectionId, verdict])

  return (
    <motion.div
      className="border border-dap-border bg-dap-bg p-6 font-mono text-xs"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Terminal chrome */}
      <div className="mb-4 flex items-center gap-2 border-b border-dap-border pb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-dap-danger" />
        <div className="h-2.5 w-2.5 rounded-full bg-dap-accent" />
        <div className="h-2.5 w-2.5 rounded-full bg-dap-success" />
        <span className="ml-3 text-dap-text-secondary tracking-widest uppercase">
          source_intelligence_log
        </span>
      </div>

      <div className="space-y-2.5">
        {lines.slice(0, visibleCount).map((line, idx) => (
          <motion.div
            key={idx}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className={`shrink-0 font-bold ${tagColor(line.tag)}`}>[{line.tag}]</span>
            <span className="text-dap-text-primary leading-relaxed">{line.text}</span>
          </motion.div>
        ))}

        {visibleCount < lines.length && (
          <motion.span
            className="inline-block text-dap-primary"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            █
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

function tagColor(tag) {
  switch (tag) {
    case 'INFO':   return 'text-dap-success'
    case 'MATCH':  return 'text-dap-accent'
    case 'ALERT':  return 'text-dap-danger'
    case 'ACTION': return 'text-dap-primary'
    default:       return 'text-dap-text-secondary'
  }
}

function buildLines({ data, detectionId, verdict, similarityScore, timestamp }) {
  const lines = []
  if (detectionId)
    lines.push({ tag: 'INFO',   text: `Detection ID: ${detectionId}` })
  if (timestamp)
    lines.push({ tag: 'INFO',   text: `Processing timestamp: ${new Date(timestamp).toUTCString()}` })
  if (typeof similarityScore === 'number')
    lines.push({ tag: 'MATCH',  text: `Similarity score: ${Math.round(similarityScore)}%` })
  if (verdict)
    lines.push({ tag: 'ALERT',  text: `Content flagged as: ${verdict.toUpperCase()}` })
  if (data)
    lines.push({ tag: 'INFO',   text: data })
  if (verdict === 'Pirated')
    lines.push({ tag: 'ACTION', text: 'Evidence report available for download' })
  return lines
}
