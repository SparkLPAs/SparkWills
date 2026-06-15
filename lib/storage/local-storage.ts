import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

/**
 * Compiled PDFs are regenerated on-the-fly whenever they're downloaded, so the
 * copy written here is never read back — it's purely a record. We write under the
 * OS temp dir so this works on read-only / ephemeral serverless filesystems
 * (e.g. Vercel's /tmp) as well as locally, and we never let a write failure break
 * compilation.
 */
const STORAGE_ROOT = path.join(os.tmpdir(), "sparkwills-storage");

export async function putObject(
  key: string,
  bytes: Uint8Array,
): Promise<{ key: string; checksum: string }> {
  const checksum = crypto.createHash("sha256").update(bytes).digest("hex");
  try {
    const filePath = path.join(STORAGE_ROOT, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, bytes);
  } catch {
    // Non-fatal — the copy is optional; downloads regenerate from saved data.
  }
  return { key, checksum };
}

export async function getObject(key: string): Promise<Buffer> {
  return fs.readFile(path.join(STORAGE_ROOT, key));
}

export async function deleteProjectObjects(projectId: string): Promise<void> {
  await fs
    .rm(path.join(STORAGE_ROOT, projectId), { recursive: true, force: true })
    .catch(() => {});
}
