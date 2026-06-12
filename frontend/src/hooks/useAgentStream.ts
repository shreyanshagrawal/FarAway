/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from 'react';
import { AgentStep, Insight, Priority, Task, RunResponse } from '../types/api';

interface DomainContext {
  project_type: string;
  confidence_score: number;
  vocabulary: string[];
}

export function useAgentStream() {
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [domainContext, setDomainContext] = useState<DomainContext | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [specDocument, setSpecDocument] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  const eventSourceRef = useRef<EventSource | null>(null);

  const resetRun = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setRunId(null);
    setStatus("idle");
    setAgentSteps([]);
    setDomainContext(null);
    setInsights([]);
    setPriorities([]);
    setSpecDocument(null);
    setTasks([]);
    setError(null);
    setApproved({});
  }, []);

  const approveSection = useCallback((section: string) => {
    setApproved(prev => ({ ...prev, [section]: true }));
  }, []);

  const startRun = useCallback(async (inputText: string, domainOverride?: string) => {
    resetRun();
    setStatus("running");

    try {
      const payload: Record<string, any> = {
        input_text: inputText,
        input_source: "text",
      };
      if (domainOverride) {
        payload.domain_override = domainOverride;
      }

      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to start run: ${response.statusText}`);
      }

      const data: RunResponse = await response.json();
      setRunId(data.run_id);

      const eventSource = new EventSource(data.stream_url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (e) => {
        try {
          const event: AgentStep = JSON.parse(e.data);
          
          if (event.type === "keepalive") return;

          setAgentSteps(prev => [...prev, event]);

          if (event.type === "domain_analysis" || (event.type === "agent_complete" && event.agent === "domain_agent")) {
            setDomainContext(event.payload as unknown as DomainContext);
          } else if (event.type === "insight_generation" || (event.type === "agent_complete" && event.agent === "insight_agent")) {
             // Sometimes payload contains a nested array or raw data depending on backend implementation
            setInsights(Array.isArray(event.payload) ? event.payload : (event.payload as any)?.insights || []);
          } else if (event.type === "priority_generation" || (event.type === "agent_complete" && event.agent === "priority_agent")) {
            setPriorities(Array.isArray(event.payload) ? event.payload : (event.payload as any)?.priorities || []);
          } else if (event.type === "document_generation" || (event.type === "agent_complete" && event.agent === "writer_agent")) {
            // Note: writer_agent might pass spec in a field or as a string
            setSpecDocument((event.payload as any)?.spec_document || typeof event.payload === 'string' ? (event.payload as unknown as string) : null);
          } else if (event.type === "task_creation" || (event.type === "agent_complete" && event.agent === "task_agent")) {
            if (event.type === "task_creation") {
                setTasks(prev => [...prev, event.payload as unknown as Task]);
            } else {
                setTasks(Array.isArray(event.payload) ? event.payload : (event.payload as any)?.tasks || []);
            }
          } else if (event.type === "pipeline_complete") {
            setStatus("complete");
            eventSource.close();
            eventSourceRef.current = null;
          } else if (event.type === "pipeline_error") {
            setStatus("error");
            setError(event.message || "Unknown error occurred during pipeline execution.");
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch (err) {
          console.error("Failed to parse SSE event", err);
        }
      };

      eventSource.onerror = () => {
        setStatus("error");
        setError("Connection to event stream lost.");
        eventSource.close();
        eventSourceRef.current = null;
      };

    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to initiate request.");
    }
  }, [resetRun]);

  const loadCachedRun = useCallback(async (targetRunId: string) => {
    resetRun();
    setStatus("running");
    setRunId(targetRunId);

    try {
      const response = await fetch(`/api/run/${targetRunId}/result`);
      if (response.status === 404) {
        setStatus("error");
        setError("Run not found. It may have expired.");
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to load run: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Simulate streaming the agent steps
      const steps: AgentStep[] = data.agent_steps || [];
      
      let stepIndex = 0;
      
      const processNextStep = () => {
        if (stepIndex >= steps.length) {
          setStatus("complete");
          
          // Set final state to ensure we have the data
          if (data.domain) {
            setDomainContext({ project_type: data.domain, confidence_score: data.domain_confidence || 1.0, vocabulary: [] });
          }
          if (data.insights && data.insights.length > 0) setInsights(data.insights);
          if (data.priorities && data.priorities.length > 0) setPriorities(data.priorities);
          if (data.spec_document) setSpecDocument(data.spec_document);
          if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
          
          return;
        }
        
        const event = steps[stepIndex];
        setAgentSteps(prev => [...prev, event]);
        
        // Parse event to state
        if (event.type === "domain_analysis" || (event.type === "agent_complete" && event.agent === "domain_agent")) {
          setDomainContext(event.payload as unknown as DomainContext);
        } else if (event.type === "insight_generation" || (event.type === "agent_complete" && event.agent === "insight_agent")) {
          setInsights(Array.isArray(event.payload) ? event.payload : (event.payload as any)?.insights || []);
        } else if (event.type === "priority_generation" || (event.type === "agent_complete" && event.agent === "priority_agent")) {
          setPriorities(Array.isArray(event.payload) ? event.payload : (event.payload as any)?.priorities || []);
        } else if (event.type === "document_generation" || (event.type === "agent_complete" && event.agent === "writer_agent")) {
          setSpecDocument((event.payload as any)?.spec_document || typeof event.payload === 'string' ? (event.payload as unknown as string) : null);
        } else if (event.type === "task_creation" || (event.type === "agent_complete" && event.agent === "task_agent")) {
          if (event.type === "task_creation") {
              setTasks(prev => [...prev, event.payload as unknown as Task]);
          } else {
              setTasks(Array.isArray(event.payload) ? event.payload : (event.payload as any)?.tasks || []);
          }
        } else if (event.type === "pipeline_error") {
          setStatus("error");
          setError(event.message || "Unknown error occurred during pipeline execution.");
          return; // Stop processing further steps
        }
        
        stepIndex++;
        setTimeout(processNextStep, 200);
      };
      
      processNextStep();
      
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load cached run.");
    }
  }, [resetRun]);

  return {
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
  };
}
