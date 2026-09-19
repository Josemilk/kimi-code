import type { Risk } from "../permissions/policy.js";

export interface ToolContext {
  userId: string;
  taskId: string;
  signal?: AbortSignal;
}

export interface ToolDefinition<I = unknown, O = unknown> {
  name: string;
  description: string;
  risk: Risk;
  affectsExternalState: boolean;
  run(input: I, context: ToolContext): Promise<O>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) throw new Error(`Tool already registered: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }
}
