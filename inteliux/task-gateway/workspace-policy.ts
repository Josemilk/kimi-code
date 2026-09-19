import path from 'node:path';

export function assertWorkspaceWithinRoot(workspace: string, root: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedWorkspace = path.resolve(workspace);
  const relative = path.relative(resolvedRoot, resolvedWorkspace);

  if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) {
    return resolvedWorkspace;
  }

  throw new Error('workspace_outside_allowed_root');
}
