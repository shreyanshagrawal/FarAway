/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { AgentStep, Insight, Priority, Task } from '../types/api';
import { AgentStepCard } from './AgentStepCard';
import { DomainCard } from './DomainCard';
import { InsightCard } from './InsightCard';
import { PriorityTable } from './PriorityTable';
import { SpecCard } from './SpecCard';
import { TaskCard } from './TaskCard';
import { SectionControls } from './SectionControls';

interface ResultsLayoutProps {
  runId: string | null;
  status: "idle" | "running" | "complete" | "error";
  agentSteps: AgentStep[];
  domainContext: Record<string, any> | null;
  insights: Insight[];
  priorities: Priority[];
  specDocument: string | null;
  tasks: Task[];
  readOnly?: boolean;
  approved?: Record<string, boolean>;
  onApproveSection?: (section: string) => void;
  setSpecDocument?: (doc: string) => void;
  resetRun?: () => void;
  error?: string | null;
}

export function ResultsLayout({ 
  runId, status, agentSteps, domainContext, insights, priorities, specDocument, tasks, 
  readOnly = false, approved = {}, onApproveSection, setSpecDocument, resetRun, error 
}: ResultsLayoutProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "priorities" | "spec" | "tasks">("insights");
  const [showTraceMobile, setShowTraceMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentSteps]);

  // Auto-switch tabs when data arrives
  useEffect(() => {
    if (tasks.length > 0) setActiveTab("tasks");
    else if (specDocument) setActiveTab("spec");
    else if (priorities.length > 0) setActiveTab("priorities");
    else if (insights.length > 0) setActiveTab("insights");
  }, [insights.length, priorities.length, specDocument, tasks.length]);

  return (
    <div className="flex h-screen bg-[#0A0A0C] text-white font-sans overflow-hidden relative">
      {/* Left Panel: Reasoning Trace */}
      <div className={`${showTraceMobile ? 'flex fixed inset-0 z-50 bg-[#121214]' : 'hidden'} md:relative md:flex flex-col w-full md:w-[38%] h-screen border-r border-gray-800 bg-[#121214]`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0F0F11]">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Agent Reasoning</h2>
          <div className="flex items-center space-x-3">
            {status === "running" && <span className="flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span></span>}
            {showTraceMobile && (
              <button onClick={() => setShowTraceMobile(false)} className="md:hidden text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded">
                Close
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#0A0A0B]">
          {status === "running" && agentSteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
              <p>Starting agents...</p>
            </div>
          ) : (
            agentSteps.map((step, idx) => (
              <AgentStepCard key={idx} step={step} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-full md:w-[62%] flex flex-col h-screen max-h-screen overflow-hidden bg-[#0F0F11]">
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex sticky top-0 z-10 items-center justify-between border-b border-gray-800 bg-[#121214]">
          <button 
            onClick={() => setShowTraceMobile(true)}
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${showTraceMobile ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400'}`}
          >
            Agent Thinking
          </button>
          <button 
            onClick={() => setShowTraceMobile(false)}
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${!showTraceMobile ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400'}`}
          >
            Output
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border-b border-red-800 p-4 flex items-center justify-between">
            <span className="text-red-400 text-sm">Pipeline failed: {error}</span>
            {resetRun && (
              <button onClick={resetRun} className="text-xs bg-red-800/50 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors">
                Try again
              </button>
            )}
          </div>
        )}

        {domainContext && (
          <DomainCard 
            projectType={domainContext.project_type || domainContext.domain} 
            confidenceScore={domainContext.confidence_score} 
            vocabulary={domainContext.vocabulary} 
          />
        )}
        
        <div className="grid grid-cols-2 md:flex border-b border-gray-800 px-4 pt-4 md:space-x-6 gap-y-2">
          <TabButton label="Insights" active={activeTab === "insights"} onClick={() => setActiveTab("insights")} disabled={insights.length === 0} />
          <TabButton label="Priorities" active={activeTab === "priorities"} onClick={() => setActiveTab("priorities")} disabled={priorities.length === 0} />
          <TabButton label="Specification" active={activeTab === "spec"} onClick={() => setActiveTab("spec")} disabled={!specDocument} />
          <TabButton label="Linear Tasks" active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} disabled={tasks.length === 0} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "insights" && insights.length > 0 && (
            <div className="space-y-4">
              <SectionControls runId={runId} section="insight" readOnly={readOnly} approved={approved.insight} onApprove={() => onApproveSection?.("insight")} />
              {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
            </div>
          )}
          
          {activeTab === "priorities" && priorities.length > 0 && (
            <PriorityTable 
              priorities={priorities} 
              runId={runId} 
              readOnly={readOnly} 
              approved={approved.priority} 
              onApprove={() => onApproveSection?.("priority")} 
            />
          )}
          
          {activeTab === "spec" && specDocument && (
            <SpecCard 
              specDocument={specDocument} 
              runId={runId} 
              readOnly={readOnly}
              approved={approved.writer}
              onApprove={() => onApproveSection?.("writer")}
              setSpecDocument={setSpecDocument}
            />
          )}
          
          {activeTab === "tasks" && tasks.length > 0 && (
            <div className="space-y-4">
              <SectionControls runId={runId} section="task" readOnly={readOnly} approved={approved.task} onApprove={() => onApproveSection?.("task")} />
              {tasks.map((task, i) => <TaskCard key={i} task={task} />)}
            </div>
          )}
          
          {/* Empty states */}
          {activeTab === "insights" && insights.length === 0 && status === "complete" && <div className="text-center text-gray-600 mt-20">No distinct themes found. Try with more feedback items.</div>}
          {activeTab === "priorities" && priorities.length === 0 && status === "complete" && <div className="text-center text-gray-600 mt-20">Not enough data to rank priorities.</div>}
          {activeTab === "spec" && !specDocument && status === "complete" && <div className="text-center text-gray-600 mt-20">No specification generated.</div>}
          {activeTab === "tasks" && tasks.length === 0 && status === "complete" && <div className="text-center text-gray-600 mt-20">Spec generated — no tasks decomposed yet.</div>}
          
          {/* Empty state before data arrives */}
          {activeTab === "insights" && insights.length === 0 && status !== "complete" && <div className="text-center text-gray-600 mt-20">Awaiting Insight Generation...</div>}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, disabled, onClick }: { label: string, active: boolean, disabled: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${disabled ? 'text-gray-600 border-transparent cursor-not-allowed' : active ? 'text-purple-400 border-purple-500' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
    >
      {label}
    </button>
  );
}
