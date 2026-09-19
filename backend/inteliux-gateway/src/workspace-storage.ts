import { Storage } from "@google-cloud/storage";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);
const storage = new Storage();
const bucketName = process.env.INTELIUX_STORAGE_BUCKET;
const prefix = "workspaces";

function objectName(uid: string, projectId: string) {
  const safe = (v: string) => v.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "default";
  return `${prefix}/${safe(uid)}/${safe(projectId)}/workspace.tar.gz`;
}

export async function restoreWorkspace(uid: string, projectId: string, workspace: string) {
  if (!bucketName) return false;
  const file = storage.bucket(bucketName).file(objectName(uid, projectId));
  const [exists] = await file.exists();
  if (!exists) return false;
  await mkdir(workspace, { recursive: true, mode: 0o700 });
  const archive = path.join("/tmp", `inteliux-${Date.now()}-${Math.random().toString(36).slice(2)}.tar.gz`);
  try {
    await file.download({ destination: archive });
    await exec("tar", ["-xzf", archive, "-C", workspace, "--no-same-owner"]);
    return true;
  } finally {
    await rm(archive, { force: true });
  }
}

export async function persistWorkspace(uid: string, projectId: string, workspace: string) {
  if (!bucketName) return false;
  const archive = path.join("/tmp", `inteliux-${Date.now()}-${Math.random().toString(36).slice(2)}.tar.gz`);
  try {
    await exec("tar", ["-czf", archive, "-C", workspace, "."], { maxBuffer: 1024 * 1024 });
    await storage.bucket(bucketName).upload(archive, {
      destination: objectName(uid, projectId),
      metadata: { contentType: "application/gzip", cacheControl: "no-store" }
    });
    return true;
  } finally {
    await rm(archive, { force: true });
  }
}
