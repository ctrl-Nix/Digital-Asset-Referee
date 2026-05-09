import React from 'react';

export default function Card({ children, className = '', glowColor = 'none' }) {
  const getGlowClass = () => {
    switch (glowColor) {
      case 'green': return 'hover:shadow-glow-green hover:-translate-y-[1px] transition-all duration-200';
      case 'red': return 'hover:shadow-glow-red hover:-translate-y-[1px] transition-all duration-200';
      case 'amber': return 'hover:shadow-glow-amber hover:-translate-y-[1px] transition-all duration-200';
      default: return '';
    }
  };

  return (
    <div className={`bg-bg-surface rounded-lg border border-white/[0.07] shadow-card ${getGlowClass()} ${className}`}>
      {children}
    </div>
  );
}
