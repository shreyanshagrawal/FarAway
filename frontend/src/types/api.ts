export interface RunRequest { 
  input_text: string; 
  input_source: string; 
  domain_override?: string 
}

export interface RunResponse { 
  run_id: string; 
  status: string; 
  stream_url: string; 
  created_at: string 
}

export interface AgentStep { 
  type: string; 
  agent: string; 
  message: string; 
  payload: Record<string, unknown>; 
  sequence: number; 
  timestamp: string 
}

export interface Insight { 
  theme_label: string; 
  frequency: number; 
  sentiment_score: number; 
  representative_quotes: string[]; 
  rank: number 
}

export interface Priority { 
  initiative_title: string; 
  impact_score: number; 
  effort_score: number; 
  confidence_score: number; 
  ice_score: number; 
  rationale: string; 
  rank: number 
}

export interface Task { 
  title: string; 
  description: string; 
  priority_tag: string; 
  effort_estimate: string; 
  linear_issue_id?: string; 
  linear_url?: string; 
  status: string 
}

export interface PipelineResult { 
  run_id: string; 
  status: string; 
  domain?: string; 
  domain_confidence?: number; 
  insights: Insight[]; 
  priorities: Priority[]; 
  spec_document?: string; 
  tasks: Task[]; 
  agent_steps: AgentStep[] 
}
