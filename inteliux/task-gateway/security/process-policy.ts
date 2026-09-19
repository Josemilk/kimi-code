export interface ProcessPolicy {
  timeoutMs: number;
  maxOutputBytes: number;
}

export const DEFAULT_PROCESS_POLICY: ProcessPolicy = {
  timeoutMs: 30 * 60 * 1000,
  maxOutputBytes: 10 * 1024 * 1024,
};
