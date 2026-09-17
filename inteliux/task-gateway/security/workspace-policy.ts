import path from 'node:path';

export interface WorkspacePolicy {
  root: string;
  allowSymlinks?: boolean;
}

export function resolveWorkspace(policy: WorkspacePolicy, requested: string): string {
  const root = path.resolve(policy.root);
  const target = path.resolve(root, requested);
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (target !== root && !target.startsWith(prefix)) {
    throw new Error('workspace is outside the permitted root');
  }
  return target;
}
