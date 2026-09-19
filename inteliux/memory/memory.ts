export type MemoryKind = "preference" | "interest" | "goal" | "project" | "experience" | "fact";

export interface MemoryRecord {
  id: string;
  userId: string;
  kind: MemoryKind;
  key: string;
  value: string;
  importance: number;
  source: "user" | "agent";
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStore {
  search(userId: string, query: string, limit?: number): Promise<MemoryRecord[]>;
  put(record: MemoryRecord): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
}

/**
 * Memory is intentionally separate from chat transcripts. A production store
 * can map this contract to Firestore while keeping per-user authorization.
 */
export class InMemoryStore implements MemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  async search(userId: string, query: string, limit = 10): Promise<MemoryRecord[]> {
    const needle = query.toLowerCase();
    return [...this.records.values()]
      .filter((r) => r.userId === userId)
      .filter((r) => `${r.key} ${r.value}`.toLowerCase().includes(needle))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  async put(record: MemoryRecord): Promise<void> {
    this.records.set(`${record.userId}:${record.id}`, record);
  }

  async remove(userId: string, id: string): Promise<void> {
    this.records.delete(`${userId}:${id}`);
  }
}
