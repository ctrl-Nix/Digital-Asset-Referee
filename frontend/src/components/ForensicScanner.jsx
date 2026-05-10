import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ForensicScanner({ currentStep = 0 }) {
  const steps = [
    "Normalizing Media",
    "Generating Fingerprint",
    "Matching Registry",
    "Running AI Analysis"
  ];

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-[#0C0F14]/50 border border-white/5 rounded-xl relative overflow-hidden">
      {/* Scan Lines Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '100% 4px'
      }} />

      {/* Sweeping Laser Beam */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-70 z-10"
        animate={{
          top: ['0%', '100%', '0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Target Indicators */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-brand-primary opacity-50" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-brand-primary opacity-50" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-brand-primary opacity-50" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-brand-primary opacity-50" />

      {/* Scanner Content */}
      <div className="relative z-20 py-8 flex flex-col items-center">
        <div className="relative mb-8">
          {/* Pulsing Target Circle */}
          <div className="w-32 h-32 rounded-full border-2 border-brand-primary/30 flex items-center justify-center relative">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-brand-primary"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="w-24 h-24 rounded-full border border-brand-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
            </div>
            {/* Crosshairs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-brand-primary" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-brand-primary" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-3 bg-brand-primary" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[1px] w-3 bg-brand-primary" />
          </div>
        </div>

        {/* Steps Progress */}
        <div className="w-full space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full border ${
                    isActive ? 'border-brand-primary bg-brand-primary animate-pulse' :
                    isCompleted ? 'border-brand-primary bg-brand-primary' :
                    'border-white/20 bg-transparent'
                  }`} />
                  <span className={`font-mono text-xs uppercase tracking-wider ${
                    isActive ? 'text-white' :
                    isCompleted ? 'text-brand-neutral' :
                    'text-white/20'
                  }`}>
                    {step}
                  </span>
                </div>
                <div className="font-mono text-xs text-white/20">
                  {isCompleted ? "DONE" : isActive ? "SCANNING" : "PENDING"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
