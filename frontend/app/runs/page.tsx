"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface RunSummary {
  run_id: string;
  domain: string | null;
  status: string;
  created_at: string;
}

export default function RunsHistory() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const response = await fetch('/api/runs');
        if (!response.ok) throw new Error("Failed to fetch runs");
        const data = await response.json();
        setRuns(data.runs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load runs");
      } finally {
        setLoading(false);
      }
    }
    fetchRuns();
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'complete') return 'text-green-400 bg-green-900/20 border-green-800';
    if (status === 'error') return 'text-red-400 bg-red-900/20 border-red-800';
    return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
  };

  const timeAgo = (dateStr: string) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) {
      const minsDiff = Math.round((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60));
      if (Math.abs(minsDiff) < 60) {
        return rtf.format(minsDiff, 'minute');
      }
      return rtf.format(Math.round(minsDiff / 60), 'hour');
    }
    
    return rtf.format(daysDifference, 'day');
  };

  return (
    <main className="min-h-screen bg-[#0F0F11] flex flex-col items-center p-4 text-gray-200">
      <div className="w-full max-w-[1000px] mt-8 space-y-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← New Run
          </Link>
          <h1 className="text-3xl font-bold text-white ml-auto">Run History</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#1A1A1D] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F0F11] border-b border-gray-800">
                <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Run ID</th>
                <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Domain</th>
                <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No runs found.</td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.run_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-gray-300">{run.run_id.substring(0, 8)}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#059669]/20 text-[#059669] border border-[#059669]/30 capitalize">
                        {run.domain || 'Auto'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(run.status)} uppercase tracking-wider`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{timeAgo(run.created_at)}</td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/runs/${run.run_id}`}
                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors inline-block"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
