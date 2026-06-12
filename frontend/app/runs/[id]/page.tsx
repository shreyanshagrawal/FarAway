"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResultsLayout } from '../../../src/components/ResultsLayout';
import { AgentStep, Insight, Priority, Task } from '../../../src/types/api';

interface DomainContext {
  project_type: string;
  confidence_score: number;
  vocabulary: string[];
}

export default function RunDetailView() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [domainContext, setDomainContext] = useState<DomainContext | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [specDocument, setSpecDocument] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    async function fetchRunResult() {
      setStatus("running");
      try {
        const response = await fetch(`/api/run/${runId}/result`);
        if (response.status === 404) {
          setStatus("error");
          setError("Run not found. It may have expired.");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch run details");
        }
        
        const data = await response.json();
        
        if (data.agent_steps) setAgentSteps(data.agent_steps);
        if (data.domain) {
          setDomainContext({ 
            project_type: data.domain, 
            confidence_score: data.domain_confidence || 1.0, 
            vocabulary: [] 
          });
        }
        if (data.insights) setInsights(data.insights);
        if (data.priorities) setPriorities(data.priorities);
        if (data.spec_document) setSpecDocument(data.spec_document);
        if (data.tasks) setTasks(data.tasks);
        
        setStatus(data.status === 'failed' ? 'error' : data.status || 'complete');
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    }
    
    fetchRunResult();
  }, [runId]);

  return (
    <div className="relative">
      <button 
        onClick={() => router.push('/runs')}
        className="absolute top-4 left-4 z-50 bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded text-sm transition-colors border border-gray-700 shadow-lg"
      >
        ← Back to History
      </button>
      <ResultsLayout 
        runId={runId}
        status={status}
        agentSteps={agentSteps}
        domainContext={domainContext}
        insights={insights}
        priorities={priorities}
        specDocument={specDocument}
        tasks={tasks}
        error={error}
        readOnly={true}
      />
    </div>
  );
}
