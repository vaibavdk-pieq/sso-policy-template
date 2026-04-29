import { chmod, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const OPA_VERSION = process.env.OPA_VERSION?.trim() || "0.69.0";

function releaseAssetName() {
  const p = process.platform;
  const a = process.arch;
  if (p === "darwin" && a === "arm64") return "opa_darwin_arm64_static";
  if (p === "darwin" && a === "x64") return "opa_darwin_amd64";
  if (p === "linux" && a === "x64") return "opa_linux_amd64_static";
  if (p === "linux" && a === "arm64") return "opa_linux_arm64_static";
  if (p === "win32" && a === "x64") return "opa_windows_amd64.exe";
  throw new Error(
    `No OPA binary for ${p} ${a}. Install OPA yourself and set OPA_PATH to the executable.`,
  );
}

function cachedPath(repoRoot) {
  const name = process.platform === "win32" ? "opa.exe" : "opa";
  return join(repoRoot, "node_modules", ".opa", `v${OPA_VERSION}`, name);
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function ensureOpaBinary(repoRoot) {
  const override = process.env.OPA_PATH?.trim();
  if (override && (await fileExists(override))) {
    return override;
  }

  const out = cachedPath(repoRoot);
  if (await fileExists(out)) {
    return out;
  }

  const asset = releaseAssetName();
  const tag = OPA_VERSION.startsWith("v") ? OPA_VERSION : `v${OPA_VERSION}`;
  const url = `https://github.com/open-policy-agent/opa/releases/download/${tag}/${asset}`;

  await mkdir(dirname(out), { recursive: true });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download OPA from ${url}: HTTP ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);

  if (process.platform !== "win32") {
    await chmod(out, 0o755);
  }

  return out;
}
