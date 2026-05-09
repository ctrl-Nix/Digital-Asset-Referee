import React from 'react';
import { motion } from 'framer-motion';

export default function ComparisonView({ submittedUrl, originalUrl, similarityScore, matchStart, matchEnd, heatmapImage }) {
  const [showHeatmap, setShowHeatmap] = React.useState(false);

  const getGradient = (score) => {
    if (score > 70) return 'from-[#00E5A0] to-[#00E5A0]/20';
    if (score >= 40) return 'from-[#FFB340] to-[#FFB340]/20';
    return 'from-[#FF4F4F] to-[#FF4F4F]/20';
  };

  const formatTime = (seconds) => {
    if (seconds == null) return null;
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  };

  return (
    <div className="space-y-8">
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* VS Divider */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-bg-void border border-white/10 items-center justify-center font-display font-bold text-brand-neutral/50 text-sm">
          VS
        </div>

        {/* Submitted Content */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h4 className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Submitted Content</h4>
            {heatmapImage && (
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded transition-all ${showHeatmap ? 'bg-brand-primary text-bg-void' : 'bg-white/5 text-brand-primary border border-brand-primary/30'}`}
              >
                {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
              </button>
            )}
          </div>
          <div className="bg-bg-surface rounded-xl border border-white/[0.07] overflow-hidden aspect-video relative group cursor-crosshair">
            {showHeatmap && heatmapImage ? (
              <img src={`data:image/jpeg;base64,${heatmapImage}`} alt="AI Heatmap" className="w-full h-full object-cover animate-pulse" />
            ) : submittedUrl ? (
              <img src={submittedUrl} alt="Submitted" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-xs text-brand-neutral/30">NO_PREVIEW</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            
            {showHeatmap && (
              <div className="absolute top-2 left-2 bg-brand-primary/20 backdrop-blur-md border border-brand-primary/40 px-2 py-1 rounded">
                <p className="font-mono text-[8px] text-brand-primary uppercase font-bold">Forensic Visualization Active</p>
              </div>
            )}
          </div>
        </div>

        {/* Original Asset */}
        <div className="space-y-3">
          <h4 className="font-mono text-[11px] text-brand-primary uppercase tracking-widest px-1">Original Asset</h4>
          <div className="bg-bg-surface rounded-xl border border-brand-primary/20 overflow-hidden aspect-video relative group">
            {originalUrl ? (
              <img src={originalUrl} alt="Original" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-xs text-brand-neutral/30">NO_PREVIEW</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Similarity Bar */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-end">
          <span className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest">Similarity Analysis</span>
          <span className="font-display font-bold text-2xl text-white">
            <span className="text-brand-neutral text-sm font-normal mr-2 tracking-tighter">SIMILARITY:</span>
            {similarityScore}%
          </span>
        </div>
        
        <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-gradient-to-r ${getGradient(similarityScore)}`}
            initial={{ width: 0 }}
            animate={{ width: `${similarityScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Timestamps */}
        {matchStart != null && matchEnd != null && (
          <div className="flex items-center gap-4 pt-2">
             <div className="px-3 py-2 bg-brand-warning/10 border border-brand-warning/20 rounded">
                <span className="font-mono text-[10px] text-brand-warning uppercase tracking-widest block mb-1">Time Range Match</span>
                <span className="font-mono text-2xl text-brand-warning font-bold">
                  {formatTime(matchStart)} <span className="text-sm opacity-50 mx-1">→</span> {formatTime(matchEnd)}
                </span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
