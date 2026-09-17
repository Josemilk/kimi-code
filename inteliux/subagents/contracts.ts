export type SubagentRole = "planner" | "researcher" | "coder" | "reviewer" | "operator";

export interface SubagentRequest {
  role: SubagentRole;
  objective: string;
  context: string;
  maxSteps: number;
}

export interface SubagentResult {
  role: SubagentRole;
  status: "completed" | "failed" | "cancelled";
  summary: string;
  artifacts: string[];
}

export interface SubagentRunner {
  run(request: SubagentRequest): Promise<SubagentResult>;
}
