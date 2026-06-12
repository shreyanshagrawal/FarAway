import React, { useState } from 'react';
import { Priority } from '../types/api';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SectionControls } from './SectionControls';

interface PriorityTableProps {
  priorities: Priority[];
  runId: string | null;
  readOnly?: boolean;
  approved?: boolean;
  onApprove?: () => void;
}

export function PriorityTable({ priorities, runId, readOnly, approved, onApprove }: PriorityTableProps) {
  // Sort by ICE score descending by default
  const sortedPriorities = [...priorities].sort((a, b) => b.ice_score - a.ice_score);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="flex flex-col space-y-2">
      <SectionControls runId={runId} section="priority" readOnly={readOnly} approved={approved} onApprove={onApprove} />
      <div className="w-full rounded-lg border border-gray-800 overflow-hidden bg-[#1A1A1D]">
        <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#0F0F11] border-b border-gray-800">
            <th className="p-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Initiative</th>
            <th className="p-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">Impact</th>
            <th className="p-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">Effort</th>
            <th className="p-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">Conf</th>
            <th className="p-3 text-xs font-medium text-teal-400 uppercase tracking-wider text-right">ICE Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sortedPriorities.map((p, idx) => (
            <React.Fragment key={idx}>
              <tr 
                className={`cursor-pointer transition-colors ${expandedId === idx ? 'bg-gray-800/30' : 'hover:bg-gray-800/50'}`}
                onClick={() => setExpandedId(expandedId === idx ? null : idx)}
              >
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-500">
                      {expandedId === idx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <span className="font-medium text-gray-200">{p.initiative_title}</span>
                  </div>
                </td>
                <td className="p-3 text-center text-gray-300 font-mono text-sm">{p.impact_score.toFixed(1)}</td>
                <td className="p-3 text-center text-gray-300 font-mono text-sm">{p.effort_score.toFixed(1)}</td>
                <td className="p-3 text-center text-gray-300 font-mono text-sm">{p.confidence_score.toFixed(1)}</td>
                <td className="p-3 text-right font-mono font-bold text-teal-400">{p.ice_score.toFixed(1)}</td>
              </tr>
              {expandedId === idx && (
                <tr className="bg-[#151518]">
                  <td colSpan={5} className="p-4 border-l-2 border-teal-500">
                    <div className="text-sm text-gray-300">
                      <span className="text-xs font-semibold uppercase text-gray-500 block mb-1">Rationale</span>
                      {p.rationale}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
