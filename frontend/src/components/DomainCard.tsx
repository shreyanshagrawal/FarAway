import React from 'react';

interface DomainCardProps {
  projectType: string;
  confidenceScore?: number;
  vocabulary?: string[];
}

export function DomainCard({ projectType, confidenceScore, vocabulary }: DomainCardProps) {
  return (
    <div className="p-6 mb-6 rounded-lg border border-green-900/50 bg-green-900/10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-green-500 uppercase tracking-widest mb-1">Inferred Domain</h2>
          <div className="text-3xl font-bold text-gray-100 capitalize">{projectType}</div>
        </div>
        {confidenceScore !== undefined && (
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Confidence Match</div>
            <div className="text-2xl font-mono text-green-400">{Math.round(confidenceScore * 100)}%</div>
          </div>
        )}
      </div>
      
      {vocabulary && vocabulary.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Key Vocabulary</div>
          <div className="flex flex-wrap gap-2">
            {vocabulary.map((vocab, i) => (
              <span key={i} className="px-2 py-1 bg-[#1A1A1D] border border-gray-700 rounded-md text-xs text-gray-300">
                {vocab}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
