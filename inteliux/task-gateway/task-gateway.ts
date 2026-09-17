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

  constructor(private readonly runtime: TaskRuntime) {}

  async start(request: TaskRequest): Promise<TaskSession> {
    if (!request.objective.trim()) throw new Error('objective is required');
    if (!request.workspace.trim()) throw new Error('workspace is required');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const session: TaskSession = {
      id,
      request,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
      events: [{ type: 'queued', taskId: id, timestamp: now }],
    };
    this.sessions.set(id, session);

    void this.execute(session);
    return session;
  }

  get(taskId: string): TaskSession | undefined {
    return this.sessions.get(taskId);
  }

  cancel(taskId: string): Promise<void> {
    const session = this.sessions.get(taskId);
    if (!session) throw new Error('task not found');
    session.status = 'cancelled';
    session.updatedAt = new Date().toISOString();
    return this.runtime.cancel?.(taskId) ?? Promise.resolve();
  }

  subscribe(taskId: string, listener: (event: TaskEvent) => void): () => void {
    const session = this.sessions.get(taskId);
    if (!session) throw new Error('task not found');
    const previous = session.events.slice();
    previous.forEach(listener);
    return () => undefined;
  }

  private async execute(session: TaskSession): Promise<void> {
    const emit = (event: TaskEvent) => {
      session.events.push(event);
      session.updatedAt = event.timestamp;
      if (event.type === 'started') session.status = 'running';
      if (event.type === 'confirmation_required') session.status = 'waiting_confirmation';
      if (event.type === 'completed') session.status = 'completed';
      if (event.type === 'failed') session.status = 'failed';
    };

    try {
      emit({ type: 'started', taskId: session.id, timestamp: new Date().toISOString(), workspace: session.request.workspace });
      const result = await this.runtime.run(session.request, emit);
      if (session.status !== 'cancelled') {
        emit({ type: 'completed', taskId: session.id, timestamp: new Date().toISOString(), result });
      }
    } catch (error) {
      if (session.status !== 'cancelled') {
        emit({ type: 'failed', taskId: session.id, timestamp: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
}
