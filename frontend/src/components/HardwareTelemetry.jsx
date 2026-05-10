import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Clock, Users, Database, HardDrive } from 'lucide-react';

function CountUp({ value, duration = 1000, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = null;
    const targetValue = parseInt(value.toString().replace(/[^0-9]/g, ''), 10) || 0;

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

    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{displayValue}{suffix}</span>;
}

export default function HardwareTelemetry() {
  return (
    <div className="bg-bg-surface border border-white/[0.07] rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-brand-neutral">Hardware Telemetry</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-wider">Optimized</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-white opacity-70" />
          <div>
            <div className="text-[10px] text-brand-neutral uppercase tracking-wider">Hardware Base</div>
            <div className="font-display font-bold text-lg text-text-primary">AMD Instinct MI300X</div>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-[10px] text-brand-neutral uppercase tracking-wider">Cluster Status</div>
          <div className="font-mono text-sm text-text-primary">ACTIVE // NODE_01</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Token Throughput */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] blur-xl rounded-full" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-brand-neutral uppercase tracking-wider">Throughput</span>
            <Zap className="w-4 h-4 text-brand-neutral opacity-50" />
          </div>
          <div className="font-display font-bold text-2xl text-text-primary">
            <CountUp value={1240} suffix=" t/s" />
          </div>
        </div>

        {/* Latency */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-brand-neutral uppercase tracking-wider">Latency</span>
            <Clock className="w-4 h-4 text-brand-neutral opacity-50" />
          </div>
          <div className="font-display font-bold text-2xl text-text-primary">
            <CountUp value={45} suffix=" ms" />
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-brand-neutral uppercase tracking-wider">Agents</span>
            <Users className="w-4 h-4 text-brand-neutral opacity-50" />
          </div>
          <div className="font-display font-bold text-2xl text-text-primary">
            <CountUp value={4} />
          </div>
        </div>

        {/* GPU Utilization */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/[0.02] animate-pulse pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-brand-neutral uppercase tracking-wider">GPU Util</span>
            <Database className="w-4 h-4 text-brand-neutral opacity-50" />
          </div>
          <div className="font-display font-bold text-2xl text-text-primary">
            <CountUp value={78} suffix="%" />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-brand-neutral uppercase tracking-wider">VRAM</span>
            <HardDrive className="w-4 h-4 text-brand-neutral opacity-50" />
          </div>
          <div className="font-display font-bold text-2xl text-text-primary">
            <CountUp value={142} suffix=" GB" />
          </div>
        </div>
      </div>
    </div>
  );
}
