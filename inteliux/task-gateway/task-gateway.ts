export type TaskStatus = 'queued' | 'running' | 'waiting_confirmation' | 'completed' | 'failed' | 'cancelled';

export type TaskEvent =
  | { type: 'queued'; taskId: string; timestamp: string }
  | { type: 'started'; taskId: string; timestamp: string; workspace: string }
  | { type: 'progress'; taskId: string; timestamp: string; message: string }
  | { type: 'tool'; taskId: string; timestamp: string; tool: string; status: string }
  | { type: 'confirmation_required'; taskId: string; timestamp: string; action: string }
  | { type: 'completed'; taskId: string; timestamp: string; result: string }
  | { type: 'failed'; taskId: string; timestamp: string; error: string };

export interface TaskRequest {
  objective: string;
  workspace: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
  /** Internal gateway field; clients must not choose this value. */
  taskId?: string;
}

export interface TaskSession {
  id: string;
  request: TaskRequest;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  events: TaskEvent[];
}

export interface TaskRuntime {
  run(request: TaskRequest, emit: (event: TaskEvent) => void): Promise<string>;
  cancel?(taskId: string): Promise<void>;
}

export class TaskGateway {
  private readonly sessions = new Map<string, TaskSession>();
  private readonly listeners = new Map<string, Set<(event: TaskEvent) => void>>();

  constructor(private readonly runtime: TaskRuntime) {}

  async start(request: TaskRequest): Promise<TaskSession> {
    if (!request.objective.trim()) throw new Error('objective is required');
    if (!request.workspace.trim()) throw new Error('workspace is required');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const session: TaskSession = {
      id,
      request: { ...request, taskId: id },
      status: 'queued',
      createdAt: now,
      updatedAt: now,
      events: [{ type: 'queued', taskId: id, timestamp: now }],
    };
    this.sessions.set(id, session);
    this.listeners.set(id, new Set());
    void this.execute(session);
    return session;
  }

  get(taskId: string): TaskSession | undefined {
    return this.sessions.get(taskId);
  }

  async cancel(taskId: string): Promise<void> {
    const session = this.sessions.get(taskId);
    if (!session) throw new Error('task not found');
    session.status = 'cancelled';
    session.updatedAt = new Date().toISOString();
    await this.runtime.cancel?.(taskId);
    this.emit({ type: 'progress', taskId, timestamp: new Date().toISOString(), message: 'Task cancellation requested' });
  }

  subscribe(taskId: string, listener: (event: TaskEvent) => void): () => void {
    const session = this.sessions.get(taskId);
    if (!session) throw new Error('task not found');
    session.events.forEach(listener);
    const listeners = this.listeners.get(taskId) ?? new Set();
    listeners.add(listener);
    this.listeners.set(taskId, listeners);
    return () => listeners.delete(listener);
  }

  private emit(event: TaskEvent): void {
    const session = this.sessions.get(event.taskId);
    if (!session) return;
    session.events.push(event);
    session.updatedAt = event.timestamp;
    if (event.type === 'started') session.status = 'running';
    if (event.type === 'confirmation_required') session.status = 'waiting_confirmation';
    if (event.type === 'completed') session.status = 'completed';
    if (event.type === 'failed') session.status = 'failed';
    this.listeners.get(event.taskId)?.forEach(listener => listener(event));
  }

  private async execute(session: TaskSession): Promise<void> {
    try {
      this.emit({ type: 'started', taskId: session.id, timestamp: new Date().toISOString(), workspace: session.request.workspace });
      const result = await this.runtime.run(session.request, event => this.emit(event));
      if (session.status !== 'cancelled') {
        this.emit({ type: 'completed', taskId: session.id, timestamp: new Date().toISOString(), result });
      }
    } catch (error) {
      if (session.status !== 'cancelled') {
        this.emit({ type: 'failed', taskId: session.id, timestamp: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
}
