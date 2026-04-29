import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureOpaBinary } from "./opa-binary.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const opa = await ensureOpaBinary(root);
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("usage: node scripts/run-opa.mjs <opa args...>");
  process.exit(1);
}

const r = spawnSync(opa, args, { stdio: "inherit", shell: false });
process.exit(r.status ?? 1);
