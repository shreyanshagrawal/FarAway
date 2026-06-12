import React from 'react';
import { Task } from '../types/api';
import { ExternalLink, CircleDashed, CheckCircle2, XCircle } from 'lucide-react';

const priorityColors: Record<string, string> = {
  P0: 'bg-red-900/30 text-red-500 border-red-800/50',
  P1: 'bg-orange-900/30 text-orange-500 border-orange-800/50',
  P2: 'bg-blue-900/30 text-blue-500 border-blue-800/50',
  P3: 'bg-gray-800 text-gray-400 border-gray-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  created: <CheckCircle2 size={16} className="text-green-500" />,
  pending: <CircleDashed size={16} className="text-yellow-500 animate-pulse" />,
  failed: <XCircle size={16} className="text-red-500" />
};

export function TaskCard({ task }: { task: Task }) {
  const pColor = priorityColors[task.priority_tag] || priorityColors.P3;

  return (
    <div className="p-4 mb-4 bg-[#1A1A1D] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3">
          <div title={`Status: ${task.status}`}>{statusIcons[task.status] || statusIcons.pending}</div>
          <h3 className="font-semibold text-gray-200 text-base">{task.title}</h3>
        </div>
        {task.linear_url ? (
          <a 
            href={task.linear_url} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-1 px-2 py-1 text-xs text-indigo-400 bg-indigo-900/20 rounded hover:bg-indigo-900/40 transition-colors"
          >
            <span>{task.linear_issue_id || 'View in Linear'}</span>
            <ExternalLink size={12} />
          </a>
        ) : task.status === 'created' ? (
          <div className="flex items-center space-x-1 px-2 py-1 text-[10px] text-yellow-500 bg-yellow-900/20 border border-yellow-800/50 rounded">
            <span>Linear unavailable — saved locally</span>
          </div>
        ) : null}
      </div>
      
      <p className="text-sm text-gray-400 mb-4 pl-7">{task.description}</p>
      
      <div className="flex items-center space-x-2 pl-7">
        <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold ${pColor}`}>
          {task.priority_tag}
        </span>
        <span className="px-2 py-0.5 rounded-sm border border-gray-700 bg-gray-800 text-gray-300 text-[10px] font-medium">
          Effort: {task.effort_estimate}
        </span>
      </div>
    </div>
  );
}
