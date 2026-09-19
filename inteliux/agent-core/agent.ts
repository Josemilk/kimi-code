export type TaskStatus =
  | "planning"
  | "awaiting_confirmation"
  | "executing"
  | "verifying"
  | "repairing"
  | "completed"
  | "failed"
  | "cancelled";

export interface AgentStep {
  id: string;
  objective: string;
  tool?: string;
  status: TaskStatus;
  requiresConfirmation: boolean;
}

export interface AgentTask {
  id: string;
  objective: string;
  status: TaskStatus;
  steps: AgentStep[];
  attempts: number;
}

export interface ModelProvider {
  complete(input: { system: string; user: string }): Promise<string>;
}

export interface AgentRuntime {
  plan(objective: string): Promise<AgentTask>;
  execute(task: AgentTask): Promise<AgentTask>;
  verify(task: AgentTask): Promise<AgentTask>;
  repair(task: AgentTask): Promise<AgentTask>;
}

/**
 * Provider-agnostic orchestration contract. The existing Kimi Code engine
 * remains the implementation source for model/tool execution; INTELIUX adds
 * the higher-level lifecycle around it.
 */
export class InteliuxOrchestrator {
  constructor(private readonly runtime: AgentRuntime) {}

  async run(objective: string): Promise<AgentTask> {
    let task = await this.runtime.plan(objective);
    for (let guard = 0; guard < 8; guard += 1) {
      if (task.status === "awaiting_confirmation" || task.status === "cancelled") return task;
      if (task.status === "completed" || task.status === "failed") return task;
      task = await this.runtime.execute(task);
      task = await this.runtime.verify(task);
      if (task.status === "completed" || task.status === "failed") return task;
      task = await this.runtime.repair(task);
    }
    return { ...task, status: "failed" };
  }
}
