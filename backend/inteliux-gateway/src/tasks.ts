import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getKimiServerToken, kimiBase } from "./kimi-runtime.js";
import { restoreWorkspace } from "./workspace-storage.js";

const root = process.env.INTELIUX_WORKSPACE_ROOT ?? "/tmp/inteliux-workspaces";

function safePart(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!cleaned || cleaned === "." || cleaned === "..") throw new Error("Invalid workspace identifier");
  return cleaned.slice(0, 80);
}

export async function createTask(uid: string, objective: string, projectId = "default") {
  if (!objective.trim()) throw new Error("objective is required");
  const taskRef = getFirestore().collection("users").doc(uid).collection("tasks").doc();
  const workspace = path.join(root, safePart(uid), safePart(projectId));
  await mkdir(workspace, { recursive: true, mode: 0o700 });
  await restoreWorkspace(uid, projectId, workspace);

  const token = await getKimiServerToken();
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
  const response = await fetch(`${kimiBase()}/api/v1/sessions`, {
    method: "POST", headers, body: JSON.stringify({ metadata: { cwd: workspace } })
  });
  if (!response.ok) throw new Error(`Kimi session creation failed: ${response.status}`);
  const session = await response.json() as any;
  const sessionId = session?.data?.id;
  if (!sessionId) throw new Error("Kimi did not return a session id");
  await taskRef.set({ objective, projectId, workspace, sessionId, status: "running", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  const prompt = await fetch(`${kimiBase()}/api/v1/sessions/${encodeURIComponent(sessionId)}/prompts`, {
    method: "POST", headers, body: JSON.stringify({ content: [{ type: "text", text: objective }] })
  });
  if (!prompt.ok) {
    await taskRef.update({ status: "failed", updatedAt: FieldValue.serverTimestamp() });
    throw new Error(`Kimi prompt failed: ${prompt.status}`);
  }
  return { taskId: taskRef.id, sessionId, workspace };
}
