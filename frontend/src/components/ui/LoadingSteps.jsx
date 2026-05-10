import React, { useState, useEffect } from 'react';
import AgentTimeline from '../AgentTimeline';
import ForensicScanner from '../ForensicScanner';

/**
 * LoadingSteps — Shown during active scan.
 * Now renders the ForensicScanner and AgentTimeline in live simulation mode.
 */
export default function LoadingSteps() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 3500); // Simulate progress through the 4 steps

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-6">
      {/* Pulsing header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
          <div className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          <span className="font-mono text-xs text-white/50 uppercase tracking-[0.15em]">
            Forensic Scan Active
          </span>
        </div>
      </div>

      {/* Laser Scanner Visual */}
      <ForensicScanner currentStep={currentStep} />

      {/* Existing Agent Timeline */}
      <AgentTimeline isLive={true} />
    </div>
  );
}
