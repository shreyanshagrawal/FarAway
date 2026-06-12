import React, { useState } from 'react';
import { Insight } from '../types/api';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'bg-green-900/30 text-green-400 border-green-800';
    if (score < -0.3) return 'bg-red-900/30 text-red-400 border-red-800';
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  return (
    <div className="mb-4 bg-[#1A1A1D] border border-gray-800 rounded-lg overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-bold text-gray-200">{insight.theme_label}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase ${getSentimentColor(insight.sentiment_score)}`}>
              Score: {insight.sentiment_score.toFixed(2)}
            </span>
          </div>
          <div className="w-full max-w-md bg-gray-900 rounded-full h-1.5 flex items-center">
            <div 
              className="bg-teal-500 h-1.5 rounded-full" 
              style={{ width: `${Math.min((insight.frequency / 10) * 100, 100)}%` }}
            ></div>
            <span className="ml-3 text-xs text-gray-500 font-mono">Freq: {insight.frequency}</span>
          </div>
        </div>
        <div className="text-gray-500">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
      
      {expanded && insight.representative_quotes && insight.representative_quotes.length > 0 && (
        <div className="px-4 pb-4 pt-1 bg-[#151518] border-t border-gray-800">
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 mt-2">Representative Quotes</h4>
          <ul className="space-y-2">
            {insight.representative_quotes.map((quote, idx) => (
              <li key={idx} className="flex space-x-2 text-sm text-gray-300">
                <span className="text-teal-600 mt-0.5">&quot;</span>
                <span className="italic leading-relaxed">{quote}</span>
                <span className="text-teal-600 mt-0.5">&quot;</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
