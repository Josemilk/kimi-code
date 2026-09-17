import { spawn } from 'node:child_process';
import type { TaskEvent, TaskRequest, TaskRuntime } from './task-gateway';

export interface KimiRuntimeOptions {
  command?: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
}

/**
 * Adapter to the existing Kimi CLI. It deliberately delegates execution to
 * the repository's existing Agent Core instead of implementing a second agent.
 */
export class KimiCliRuntime implements TaskRuntime {
  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly env: NodeJS.ProcessEnv;

  constructor(options: KimiRuntimeOptions = {}) {
    this.command = options.command ?? 'kimi';
    this.baseArgs = options.args ?? [];
    this.env = { ...process.env, ...options.env };
  }

  run(request: TaskRequest, emit: (event: TaskEvent) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, [...this.baseArgs, '-p', request.objective], {
        cwd: request.workspace,
        env: this.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer | string) => {
        const text = chunk.toString();
        stdout += text;
        emit({ type: 'progress', taskId: '', timestamp: new Date().toISOString(), message: text });
      });

      child.stderr.on('data', (chunk: Buffer | string) => {
        const text = chunk.toString();
        stderr += text;
        emit({ type: 'progress', taskId: '', timestamp: new Date().toISOString(), message: text });
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`Kimi runtime exited with code ${code}: ${stderr.trim()}`));
      });
    });
  }
}
