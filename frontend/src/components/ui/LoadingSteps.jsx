import React from 'react';
import AgentTimeline from '../AgentTimeline';

/**
 * LoadingSteps — Shown during active scan.
 * Now renders the AgentTimeline in live simulation mode,
 * so users watch agents "think" in real-time while waiting.
 */
export default function LoadingSteps() {
  return (
    <div className="w-full max-w-lg mx-auto py-4">
      {/* Pulsing header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
          <div className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          <span className="font-mono text-xs text-white/50 uppercase tracking-[0.15em]">
            D.A.R. Pipeline Active
          </span>
        </div>
      </div>

      <AgentTimeline isLive={true} />
    </div>
  );
}
