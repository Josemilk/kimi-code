import { spawn } from "node:child_process";

import type { AgentRuntime, AgentStep, AgentTask, TaskStatus } from "./agent";

export interface KimiCliRuntimeOptions {
  /** Executable name/path. Defaults to `kimi`. */
  readonly executable?: string;
  /** Working directory exposed to Kimi's existing agent runtime. */
  readonly cwd: string;
  /** Optional model alias passed to Kimi Code. */
  readonly model?: string;
  /** Run without interactive confirmations. Defaults to false. */
  readonly autonomous?: boolean;
  /** Maximum execution time for a single Kimi invocation. */
  readonly timeoutMs?: number;
  /** Extra environment variables, never containing hard-coded credentials. */
  readonly env?: NodeJS.ProcessEnv;
}

export interface KimiInvocationResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/**
 * Adapter from INTELIUX's provider-agnostic task lifecycle to the real
 * Kimi Code CLI. Kimi Code's `-p/--prompt` mode is headless and still enters
 * the same Kimi Code runtime used by the normal CLI; this adapter therefore
 * delegates heavy coding work instead of implementing a second coding agent.
 */
export class KimiCliAgentRuntime implements AgentRuntime {
  constructor(private readonly options: KimiCliRuntimeOptions) {}

  async plan(objective: string): Promise<AgentTask> {
    const prompt = [
      "You are the planning phase of INTELIUX OS.",
      "Do not modify files or run destructive commands in this phase.",
      "Return a concise numbered implementation plan.",
      "Objective:",
      objective,
    ].join("\n\n");

    const result = await this.invoke(prompt, false);
    if (result.exitCode !== 0) {
      return this.failedTask(objective, result);
    }

    const steps = this.parseSteps(result.stdout, objective);
    return {
      id: crypto.randomUUID(),
      objective,
      status: "executing",
      steps,
      attempts: 0,
    };
  }

  async execute(task: AgentTask): Promise<AgentTask> {
    const prompt = [
      "You are the execution phase of INTELIUX OS.",
      "Use the existing Kimi Code Agent Core, tools, Skills, MCP and subagents as appropriate.",
      "Work on the supplied workspace and complete the objective.",
      "Inspect the current state before changing anything.",
      "Do not claim success without checking the result.",
      "Objective:",
      task.objective,
      "Plan:",
      task.steps.map((step, i) => `${i + 1}. ${step.objective}`).join("\n"),
    ].join("\n\n");

    const result = await this.invoke(prompt, this.options.autonomous === true);
    if (result.exitCode !== 0) {
      return { ...task, status: "repairing", attempts: task.attempts + 1 };
    }
    return { ...task, status: "verifying", attempts: task.attempts + 1 };
  }

  async verify(task: AgentTask): Promise<AgentTask> {
    const prompt = [
      "Verify the completed INTELIUX OS task.",
      "Inspect the actual workspace state and run appropriate non-destructive tests/build checks.",
      "If the objective is satisfied, respond with the exact marker INTELIUX_VERIFIED.",
      "If not satisfied, briefly explain what remains to be repaired.",
      "Objective:",
      task.objective,
    ].join("\n\n");

    const result = await this.invoke(prompt, false);
    if (result.exitCode === 0 && result.stdout.includes("INTELIUX_VERIFIED")) {
      return { ...task, status: "completed" };
    }
    return { ...task, status: "repairing" };
  }

  async repair(task: AgentTask): Promise<AgentTask> {
    const prompt = [
      "Repair the current INTELIUX OS task.",
      "Use the existing Kimi Code Agent Core and its tools.",
      "Diagnose the failure from the current workspace state, apply the smallest safe correction, and verify it.",
      "Do not stop at an explanation: perform the repair when it is safe and possible.",
      "Objective:",
      task.objective,
    ].join("\n\n");

    const result = await this.invoke(prompt, this.options.autonomous === true);
    return result.exitCode === 0
      ? { ...task, status: "verifying", attempts: task.attempts + 1 }
      : { ...task, status: "repairing", attempts: task.attempts + 1 };
  }

  private async invoke(prompt: string, autonomous: boolean): Promise<KimiInvocationResult> {
    const args = ["-p", prompt, "--output-format", "text"];
    if (this.options.model) args.push("--model", this.options.model);
    if (autonomous) args.push("--auto");

    return new Promise((resolve, reject) => {
      const child = spawn(this.options.executable ?? "kimi", args, {
        cwd: this.options.cwd,
        env: { ...process.env, ...this.options.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGTERM");
        reject(new Error("Kimi invocation timed out"));
      }, this.options.timeoutMs ?? 30 * 60 * 1000);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => { stdout += chunk; });
      child.stderr.on("data", (chunk: string) => { stderr += chunk; });
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      });
    });
  }

  private parseSteps(output: string, objective: string): AgentStep[] {
    const lines = output.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+[.)]\s+/.test(line));

    const source = lines.length > 0 ? lines : [objective];
    return source.slice(0, 32).map((line, index) => ({
      id: `${index + 1}`,
      objective: line.replace(/^\d+[.)]\s+/, ""),
      status: "executing" as TaskStatus,
      requiresConfirmation: false,
    }));
  }

  private failedTask(objective: string, result: KimiInvocationResult): AgentTask {
    return {
      id: crypto.randomUUID(),
      objective,
      status: "failed",
      steps: [{
        id: "1",
        objective: result.stderr || result.stdout || "Kimi planning failed",
        status: "failed",
        requiresConfirmation: false,
      }],
      attempts: 0,
    };
  }
}
