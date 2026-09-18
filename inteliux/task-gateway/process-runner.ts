import { spawn, type ChildProcess } from 'node:child_process';

export interface ProcessLimits {
  timeoutMs: number;
  maxOutputBytes: number;
}

export class ProcessRunner {
  run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, limits: ProcessLimits): Promise<string> {
    return new Promise((resolve, reject) => {
      const child: ChildProcess = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      let bytes = 0;
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('task process timed out'));
      }, limits.timeoutMs);

      const collect = (chunk: Buffer | string) => {
        bytes += Buffer.byteLength(chunk.toString());
        if (bytes > limits.maxOutputBytes) {
          child.kill('SIGTERM');
          reject(new Error('task output exceeded limit'));
          return;
        }
        output += chunk.toString();
      };

      child.stdout?.on('data', collect);
      child.stderr?.on('data', collect);
      child.on('error', (error) => { clearTimeout(timer); reject(error); });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(output.trim());
        else reject(new Error(`process exited with code ${code}`));
      });
    });
  }
}
