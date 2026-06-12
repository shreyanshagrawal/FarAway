import React, { useState } from 'react';
import { AgentStep } from '../types/api';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const agentColors: Record<string, string> = {
  orchestrator: 'bg-[#7C3AED]',
  domain_agent: 'bg-[#059669]',
  insight_agent: 'bg-[#0D9488]',
  priority_agent: 'bg-[#DC2626]',
  writer_agent: 'bg-[#D97706]',
  task_agent: 'bg-[#2563EB]',
};

export function AgentStepCard({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false);
  const color = agentColors[step.agent] || 'bg-gray-600';
  const isComplete = step.type === 'pipeline_complete' || step.type === 'agent_complete';

  return (
    <div className={`p-3 mb-2 bg-[#1A1A1D] rounded border border-gray-800 transition-opacity ${isComplete ? 'opacity-70' : 'opacity-100'}`}>
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${color} uppercase tracking-wider`}>
            {step.agent.replace('_agent', '')}
          </span>
          <p className="text-[13px] text-gray-200 font-medium flex items-center space-x-2">
            <span>{step.message}</span>
            {isComplete && <CheckCircle size={14} className="text-green-500" />}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <span className="text-xs">{new Date(step.timestamp).toLocaleTimeString()}</span>
          {step.payload && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
      </div>
      
      {expanded && step.payload && (
        <div className="mt-3 p-3 bg-[#0F0F11] rounded text-xs font-mono text-gray-400 overflow-x-auto">
          <pre>{JSON.stringify(step.payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
