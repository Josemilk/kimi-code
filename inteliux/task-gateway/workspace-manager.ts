import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export class WorkspaceManager {
  constructor(private readonly root: string) {}

  async create(userId: string, projectId: string, taskId: string): Promise<string> {
    const safe = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');
    const workspace = path.resolve(this.root, safe(userId), safe(projectId), safe(taskId));
    const relative = path.relative(path.resolve(this.root), workspace);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('workspace escaped root');
    }
    await mkdir(workspace, { recursive: true });
    return workspace;
  }

  assertInside(workspace: string): string {
    const root = path.resolve(this.root);
    const resolved = path.resolve(workspace);
    const relative = path.relative(root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('workspace is outside authorized root');
    }
    return resolved;
  }
}
