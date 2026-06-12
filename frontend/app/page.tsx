"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAgentStream } from '../src/hooks/useAgentStream';
import { ResultsLayout } from '../src/components/ResultsLayout';

function HomeContent() {
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [demoRunId, setDemoRunId] = useState("");
  const [inputText, setInputText] = useState("");
  const [showDomainOverride, setShowDomainOverride] = useState(false);
  const [domainOverride, setDomainOverride] = useState("");
  
  const {
    runId,
    status,
    agentSteps,
    domainContext,
    insights,
    priorities,
    specDocument,
    tasks,
    error,
    approved,
    setSpecDocument,
    approveSection,
    startRun,
    resetRun,
    loadCachedRun
  } = useAgentStream();

  const handleRun = () => {
    if (!inputText.trim() || status === "running") return;
    startRun(inputText, domainOverride === "auto" ? undefined : domainOverride);
  };

  const loadDemo = async (dataset: string) => {
    try {
      // Ensure we hit the Next.js rewrite or direct backend depending on setup
      // We will use the direct api endpoint since we proxy it
      const res = await fetch(`/api/demo/${dataset}`);
      if (!res.ok) throw new Error("Failed to load demo data");
      const data = await res.json();
      setInputText(data.text);
    } catch (err) {
      console.error("Demo load failed:", err);
    }
  };

  const tokens = Math.round(inputText.length / 4);

  if (status === "running" || status === "complete" || (status === "error" && agentSteps.length > 0)) {
    return (
      <ResultsLayout 
        runId={runId}
        status={status}
        agentSteps={agentSteps}
        domainContext={domainContext}
        insights={insights}
        priorities={priorities}
        specDocument={specDocument}
        tasks={tasks}
        approved={approved}
        onApproveSection={approveSection}
        setSpecDocument={setSpecDocument}
        resetRun={resetRun}
        error={error}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F11] flex flex-col items-center p-4 text-gray-200">
      <div className="w-full flex justify-end mb-12 max-w-[1200px]">
        <Link href="/runs" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">History</Link>
      </div>
      <div className="w-full max-w-[680px] space-y-6 mt-12">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">UAPA</h1>
          <p className="text-gray-500 text-lg">Universal Autonomous PM Agent</p>
        </div>
        
        <div className="flex justify-center items-center space-x-12 mb-8">
          <div className="text-center">
            <span className="text-2xl font-bold text-[#7C3AED]">73%</span>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">of PM work automated</p>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <span className="text-2xl font-bold text-[#7C3AED]">90 sec</span>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">vs 3 days to roadmap</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste feedback, describe your project, or drop in raw notes. Any format. Any domain."
            className="w-full min-h-[200px] bg-[#1A1A1D] border border-gray-800 rounded-xl p-4 text-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y transition-shadow"
          />
          <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-mono">
            ~{tokens} tokens
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          <button type="button" onClick={() => loadDemo('software')} className="text-xs bg-gray-800/50 hover:bg-gray-700 text-gray-400 py-1.5 px-3 rounded-full transition-colors border border-gray-700">
            Try: Software feedback
          </button>
          <button type="button" onClick={() => loadDemo('marketing')} className="text-xs bg-gray-800/50 hover:bg-gray-700 text-gray-400 py-1.5 px-3 rounded-full transition-colors border border-gray-700">
            Try: Marketing campaign
          </button>
          <button type="button" onClick={() => loadDemo('education')} className="text-xs bg-gray-800/50 hover:bg-gray-700 text-gray-400 py-1.5 px-3 rounded-full transition-colors border border-gray-700">
            Try: School curriculum
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowDomainOverride(!showDomainOverride)}
            className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
          >
            {showDomainOverride ? "Hide domain override" : "Set domain manually"}
          </button>
          
          {showDomainOverride && (
            <select
              value={domainOverride}
              onChange={(e) => setDomainOverride(e.target.value)}
              className="bg-[#1A1A1D] border border-gray-800 rounded-md text-sm text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Auto-detect</option>
              <option value="software">Software</option>
              <option value="marketing">Marketing</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="legal">Legal</option>
              <option value="operations">Operations</option>
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={inputText.trim().length === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
            inputText.trim().length === 0
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-900/20 hover:scale-[1.02]"
          }`}
        >
          Run Agent →
        </button>

        {isDemoMode && (
          <div className="mt-8 p-4 bg-[#1A1A1D] border border-gray-800 rounded-lg flex items-center space-x-4">
            <input 
              type="text" 
              placeholder="Cached run_id"
              value={demoRunId}
              onChange={e => setDemoRunId(e.target.value)}
              className="bg-[#0F0F11] border border-gray-700 text-sm px-3 py-1.5 rounded text-white focus:outline-none flex-1"
            />
            <button 
              onClick={() => { if(demoRunId) loadCachedRun(demoRunId); }}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
            >
              Load Demo
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F11] flex items-center justify-center text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
