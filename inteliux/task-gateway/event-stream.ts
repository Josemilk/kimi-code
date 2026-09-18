import type { TaskEvent } from './task-gateway';

type Listener = (event: TaskEvent) => void;

export class TaskEventStream {
  private readonly listeners = new Map<string, Set<Listener>>();

  subscribe(taskId: string, listener: Listener): () => void {
    let set = this.listeners.get(taskId);
    if (!set) {
      set = new Set();
      this.listeners.set(taskId, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set?.size === 0) this.listeners.delete(taskId);
    };
  }

  publish(event: TaskEvent): void {
    this.listeners.get(event.taskId)?.forEach((listener) => listener(event));
  }
}
