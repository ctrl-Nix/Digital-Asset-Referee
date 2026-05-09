import React, { useEffect, useState } from 'react';

export default function ConfidenceRing({ score, size = 120 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const getColor = (s) => {
    if (s > 70) return '#00E5A0';
    if (s >= 40) return '#FFB340';
    return '#FF4F4F';
  };

  useEffect(() => {
    let start = null;
    const duration = 800;
    const initialScore = 0;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const easeOut = 1 - Math.pow(1 - Math.min(progress / duration, 1), 3);
      
      const currentScore = Math.floor(easeOut * (score - initialScore) + initialScore);
      setAnimatedScore(currentScore);

      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        setAnimatedScore(score);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-white/[0.05]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-75"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-3xl">
        {animatedScore}<span className="text-sm text-brand-neutral">%</span>
      </div>
    </div>
  );
}
