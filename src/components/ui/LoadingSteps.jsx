import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

const steps = [
  "Normalizing media...",
  "Generating fingerprint...",
  "Matching against registry...",
  "Analyzing with AI..."
];

export default function LoadingSteps() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < steps.length) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = Math.min(((currentStepIndex) / steps.length) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="h-1 w-full bg-bg-surface overflow-hidden rounded-full mb-8">
        <div 
          className="h-full bg-brand-primary transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isDone = currentStepIndex > index;
          const isActive = currentStepIndex === index;
          const isPending = currentStepIndex < index;

          return (
            <div key={step} className={`flex items-center gap-4 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
              <div className="relative flex items-center justify-center w-6 h-6">
                {isDone && <CheckCircle2 className="w-5 h-5 text-brand-primary" />}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping" />
                    <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                  </>
                )}
                {isPending && <Circle className="w-4 h-4 text-brand-neutral" />}
              </div>
              <span className={`font-mono text-sm ${isActive ? 'text-text-primary' : 'text-brand-neutral'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
