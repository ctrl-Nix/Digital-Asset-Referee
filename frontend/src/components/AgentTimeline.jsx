import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Eye, Scale, CheckCircle2, Loader2, Circle,
  AlertTriangle, Shield, Fingerprint, Brain
} from 'lucide-react';

/**
 * AgentTimeline — Live streaming visualization of the 3-agent pipeline.
 * 
 * Two modes:
 *   1. `liveMode` (during detection): Simulates agent steps while waiting
 *   2. `replayMode` (on result page): Streams stored reasoning via SSE
 * 
 * Props:
 *   - agentData: { investigator, vision_analyst, chief_referee } (for replay)
 *   - detectionId: string (for SSE streaming)
 *   - isLive: boolean (show during active scan)
 */

const AGENTS = [
  {
    key: 'investigator',
    name: 'Forensic Investigator',
    icon: Fingerprint,
    color: '#3B82F6',
    description: 'Analyzing fingerprints, watermarks, and asset database...',
  },
  {
    key: 'vision_analyst',
    name: 'Vision Analyst',
    icon: Eye,
    color: '#F59E0B',
    description: 'Inspecting visual content with Qwen-VL multimodal AI...',
  },
  {
    key: 'chief_referee',
    name: 'Chief Referee',
    icon: Scale,
    color: '#EF4444',
    description: 'Deliberating chain-of-thought reasoning for final verdict...',
  },
];

function AgentCard({ agent, data, status, index }) {
  const Icon = agent.icon;
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isPending = status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="relative"
    >
      {/* Connector line */}
      {index < AGENTS.length - 1 && (
        <div className="absolute left-[19px] top-[48px] w-[2px] h-[calc(100%+8px)] z-0"
          style={{
            background: isComplete
              ? `linear-gradient(180deg, ${agent.color}, ${agent.color}40)`
              : 'rgba(255,255,255,0.06)',
          }}
        />
      )}

      <div className={`relative z-10 flex gap-4 p-4 rounded-xl border transition-all duration-500 ${
        isRunning
          ? 'border-white/20 bg-white/[0.04] shadow-lg'
          : isComplete
            ? 'border-white/10 bg-white/[0.02]'
            : 'border-white/[0.04] bg-transparent opacity-40'
      }`}>
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
              isRunning ? 'ring-2 ring-offset-2 ring-offset-[#050709]' : ''
            }`}
            style={{
              background: isComplete || isRunning
                ? `${agent.color}20`
                : 'rgba(255,255,255,0.03)',
              ringColor: isRunning ? agent.color : 'transparent',
            }}
          >
            {isRunning ? (
              <Loader2
                className="w-5 h-5 animate-spin"
                style={{ color: agent.color }}
              />
            ) : isComplete ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: agent.color }} />
            ) : (
              <Circle className="w-4 h-4 text-white/20" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" style={{ color: agent.color }} />
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider"
              style={{ color: isComplete || isRunning ? agent.color : 'rgba(255,255,255,0.3)' }}
            >
              {agent.name}
            </h4>
            {isRunning && (
              <motion.span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${agent.color}20`, color: agent.color }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ACTIVE
              </motion.span>
            )}
          </div>

          {isRunning && (
            <motion.p
              className="font-body text-xs text-white/50 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {agent.description}
            </motion.p>
          )}

          {/* Completed data display */}
          {isComplete && data && (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-2 overflow-hidden"
              >
                <AgentResult agentKey={agent.key} data={data} color={agent.color} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AgentResult({ agentKey, data, color }) {
  if (agentKey === 'investigator') {
    return (
      <div className="space-y-2">
        <DataRow label="Hash Similarity" value={`${((data.phash_similarity || 0) * 100).toFixed(0)}%`} color={color} />
        <DataRow label="Watermark" value={data.watermark_detected ? `✓ ${data.watermark_payload || 'Detected'}` : '✗ Not found'} color={color} />
        <DataRow
          label="Match"
          value={data.top_match ? `${data.top_match.owner_name} (${((data.top_match.combined_similarity || 0) * 100).toFixed(0)}%)` : 'No match'}
          color={color}
        />
      </div>
    );
  }

  if (agentKey === 'vision_analyst') {
    return (
      <div className="space-y-2">
        <DataRow label="Content Type" value={data.content_type || 'unknown'} color={color} />
        <DataRow label="Confidence" value={data.infringement_confidence || 'N/A'} color={color} />
        {data.modifications_detected?.length > 0 && (
          <DataRow label="Modifications" value={data.modifications_detected.join(', ')} color={color} />
        )}
        {data.scene_description && (
          <p className="font-body text-[11px] text-white/40 leading-relaxed mt-1 line-clamp-3">
            {data.scene_description}
          </p>
        )}
      </div>
    );
  }

  if (agentKey === 'chief_referee') {
    const verdictColors = {
      INFRINGEMENT: '#EF4444',
      SUSPICIOUS: '#F59E0B',
      FAIR_USE: '#22C55E',
      NO_MATCH: '#6B7280',
    };
    const vc = verdictColors[data.verdict] || '#6B7280';

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/40 uppercase">Verdict:</span>
          <span
            className="font-mono text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: `${vc}20`, color: vc }}
          >
            {data.verdict}
          </span>
          <span className="font-mono text-[10px] text-white/30">
            ({((data.confidence || 0) * 100).toFixed(0)}%)
          </span>
        </div>
        <DataRow label="Action" value={data.recommended_action || 'N/A'} color={color} />
        {data.reasoning && (
          <p className="font-body text-[11px] text-white/40 leading-relaxed mt-1 line-clamp-4">
            {data.reasoning}
          </p>
        )}
      </div>
    );
  }

  return null;
}

function DataRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider min-w-[90px]">
        {label}:
      </span>
      <span className="font-mono text-[11px] text-white/70 truncate" style={{ color: `${color}CC` }}>
        {value}
      </span>
    </div>
  );
}

export default function AgentTimeline({ agentData, detectionId, isLive = false }) {
  const [agentStates, setAgentStates] = useState({
    investigator: { status: 'pending', data: null },
    vision_analyst: { status: 'pending', data: null },
    chief_referee: { status: 'pending', data: null },
  });

  // Live simulation mode (during active scan)
  useEffect(() => {
    if (!isLive) return;

    const timers = [];

    // Agent 1 starts immediately
    setAgentStates(prev => ({
      ...prev,
      investigator: { status: 'running', data: null },
    }));

    // Agent 1 completes after ~2s
    timers.push(setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        investigator: { status: 'complete', data: null },
        vision_analyst: { status: 'running', data: null },
      }));
    }, 2000));

    // Agent 2 completes after ~5s
    timers.push(setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        vision_analyst: { status: 'complete', data: null },
        chief_referee: { status: 'running', data: null },
      }));
    }, 5000));

    // Agent 3 completes after ~8s
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

    // Stagger the reveal for dramatic effect
    const timers = [];
    const keys = ['investigator', 'vision_analyst', 'chief_referee'];

    keys.forEach((key, i) => {
      // Show "running"
      timers.push(setTimeout(() => {
        setAgentStates(prev => ({
          ...prev,
          [key]: { status: 'running', data: null },
        }));
      }, i * 800));

      // Show "complete" with data
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

        if (data.error) {
          eventSource.close();
          return;
        }

        if (data.pipeline_complete) {
          eventSource.close();
          return;
        }

        // Map incoming agent data
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

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [detectionId, isLive, agentData]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-white/40" />
        <h3 className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">
          Agent Reasoning Pipeline
        </h3>
      </div>

      {AGENTS.map((agent, index) => (
        <AgentCard
          key={agent.key}
          agent={agent}
          data={agentStates[agent.key].data}
          status={agentStates[agent.key].status}
          index={index}
        />
      ))}
    </div>
  );
}
