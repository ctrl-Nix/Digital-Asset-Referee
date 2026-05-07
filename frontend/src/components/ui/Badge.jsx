import React from 'react';

const verdictConfig = {
  PIRATED:    { color: '#FF4F4F', bg: 'rgba(255,79,79,0.12)',    border: 'rgba(255,79,79,0.3)',    label: 'PIRATED' },
  SUSPICIOUS: { color: '#FFB340', bg: 'rgba(255,179,64,0.12)',   border: 'rgba(255,179,64,0.3)',   label: 'SUSPICIOUS' },
  ORIGINAL:   { color: '#00E5A0', bg: 'rgba(0,229,160,0.12)',    border: 'rgba(0,229,160,0.3)',    label: 'ORIGINAL' },
  UNKNOWN:    { color: '#8A9BB0', bg: 'rgba(138,155,176,0.12)',  border: 'rgba(138,155,176,0.3)',  label: 'UNKNOWN' },
};

export default function Badge({ verdict }) {
  const config = verdictConfig[verdict] || verdictConfig.UNKNOWN;
  
  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs uppercase"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color
      }}
    >
      <span 
        className={`w-2 h-2 rounded-full ${verdict === 'PIRATED' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </div>
  );
}
