import React, { useEffect, useState } from 'react';

export default function StatCard({ label, value, icon: Icon, accentColor }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = null;
    const duration = 600;
    const targetValue = parseInt(value.toString().replace(/[^0-9]/g, ''), 10) || 0;
    const prefix = value.toString().replace(/[0-9].*/, '');
    const suffix = value.toString().replace(/.*?[0-9]+/, '');

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const easeOutQuart = 1 - Math.pow(1 - Math.min(progress / duration, 1), 4);
      
      const currentVal = Math.floor(easeOutQuart * targetValue);
      setDisplayValue(currentVal);

      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    if (targetValue > 0) {
      requestAnimationFrame(step);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const formattedValue = typeof value === 'number' || !isNaN(parseInt(value))
    ? `${value.toString().replace(/[0-9]+/, displayValue)}` 
    : value;

  return (
    <div 
      className="bg-bg-surface border border-white/[0.07] rounded-lg p-6 relative overflow-hidden flex flex-col justify-between h-32"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex justify-between items-start">
        <span className="font-mono text-[11px] text-brand-neutral uppercase tracking-widest">{label}</span>
        {Icon && <Icon className="w-5 h-5 text-brand-neutral opacity-50" />}
      </div>
      <div className="font-display font-bold text-4xl text-text-primary mt-2">
        {formattedValue}
      </div>
    </div>
  );
}
