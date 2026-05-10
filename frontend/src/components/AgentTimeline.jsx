import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function AgentTimeline({ agentData, detectionId, isLive = false }) {
  const [agentStates, setAgentStates] = useState({
    investigator: { status: 'pending', data: null },
    vision_analyst: { status: 'pending', data: null },
    chief_referee: { status: 'pending', data: null },
  });

  const terminalRef = useRef(null);

  // Live simulation mode (during active scan)
  useEffect(() => {
    if (!isLive) return;

    const timers = [];

    setAgentStates(prev => ({
      ...prev,
      investigator: { status: 'running', data: null },
    }));

    timers.push(setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        investigator: { status: 'complete', data: null },
        vision_analyst: { status: 'running', data: null },
      }));
    }, 2000));

    timers.push(setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        vision_analyst: { status: 'complete', data: null },
        chief_referee: { status: 'running', data: null },
      }));
    }, 5000));

    timers.push(setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        chief_referee: { status: 'complete', data: null },
      }));
    }, 8000));

    return () => timers.forEach(clearTimeout);
  }, [isLive]);

  // Replay mode — populate from stored agentData
  useEffect(() => {
    if (!agentData || isLive) return;

    const timers = [];
    const keys = ['investigator', 'vision_analyst', 'chief_referee'];

    keys.forEach((key, i) => {
      timers.push(setTimeout(() => {
        setAgentStates(prev => ({
          ...prev,
          [key]: { status: 'running', data: null },
        }));
      }, i * 800));

      timers.push(setTimeout(() => {
        setAgentStates(prev => ({
          ...prev,
          [key]: { status: 'complete', data: agentData[key] || null },
        }));
      }, i * 800 + 600));
    });

    return () => timers.forEach(clearTimeout);
  }, [agentData, isLive]);

  // SSE streaming mode
  useEffect(() => {
    if (!detectionId || isLive || agentData) return;

    const apiBase = import.meta.env.VITE_API_URL;
    const eventSource = new EventSource(`${apiBase}/detect/stream/${detectionId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error || data.pipeline_complete) {
          eventSource.close();
          return;
        }

        for (const key of ['investigator', 'vision_analyst', 'chief_referee']) {
          if (data[key]) {
            setAgentStates(prev => ({
              ...prev,
              [key]: { status: 'complete', data: data[key] },
            }));
          }
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [detectionId, isLive, agentData]);

  // Auto-scroll effect
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [agentStates]);

  // Generate terminal lines based on state
  const getLines = () => {
    const lines = [];
    
    if (agentStates.investigator.status !== 'pending') {
      lines.push({ label: '[SIMILARITY_ENGINE]', text: 'Analyzing fingerprints and watermarks...', type: 'info' });
      if (agentStates.investigator.status === 'complete') {
        lines.push({ label: '[SIMILARITY_ENGINE]', text: 'MATCH CONFIRMED. Registry intersection detected.', type: 'success' });
      }
    }

    if (agentStates.vision_analyst.status !== 'pending') {
      lines.push({ label: '[VISION_ANALYST]', text: 'Inspecting visual content with multimodal AI...', type: 'info' });
      if (agentStates.vision_analyst.status === 'complete') {
        lines.push({ label: '[VISION_ANALYST]', text: 'INFRINGEMENT DETECTED in frame sequence.', type: 'danger' });
      }
    }

    if (agentStates.chief_referee.status !== 'pending') {
      lines.push({ label: '[VERDICT_AGENT]', text: 'Deliberating chain-of-thought reasoning...', type: 'info' });
      if (agentStates.chief_referee.status === 'complete') {
        lines.push({ label: '[VERDICT_AGENT]', text: 'REPORT GENERATED. Case file locked.', type: 'success' });
      }
    }

    return lines;
  };

  const lines = getLines();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-white/40" />
        <h3 className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">
          Agent Execution Log
        </h3>
      </div>

      <div 
        ref={terminalRef}
        className="bg-[#050709] border border-white/5 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs space-y-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {lines.length === 0 && (
          <div className="text-white/20 animate-pulse">Initializing connection...</div>
        )}
        
        {lines.map((line, index) => {
          const isDanger = line.type === 'danger';
          const isSuccess = line.type === 'success';
          
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2"
            >
              <span className="text-brand-neutral opacity-50">{">"}</span>
              <span className="text-brand-primary font-bold">{line.label}</span>
              <span className={`${
                isDanger ? 'text-[#FF4F4F] font-bold' :
                isSuccess ? 'text-[#00E5A0] font-bold' :
                'text-white/70'
              }`}>
                {line.text}
              </span>
            </motion.div>
          );
        })}
        
        {lines.length > 0 && lines[lines.length - 1].type === 'info' && (
          <div className="flex items-center gap-2">
            <span className="text-brand-neutral opacity-50">{">"}</span>
            <div className="w-1.5 h-3 bg-brand-primary animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
