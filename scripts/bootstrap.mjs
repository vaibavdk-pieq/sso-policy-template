import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prefixInput = process.argv[2]?.trim() || process.env.BUNDLE_PREFIX?.trim();

if (!prefixInput) {
  console.error("usage: node scripts/bootstrap.mjs <prefix>");
  console.error("example: node scripts/bootstrap.mjs acme");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(prefixInput)) {
  console.error(
    `bootstrap: invalid prefix "${prefixInput}". Use lowercase letters, numbers, and hyphens only.`,
  );
  process.exit(1);
}

const prefix = prefixInput;
const bundleName = `${prefix}-opa-bundle.tar.gz`;
const bucketName = `${prefix}-sso-policies`;
const packageName = `${prefix}-sso-policies-template`;

await updateDeployScript(join(root, "scripts", "deploy-s3.mjs"), bucketName, bundleName);
await updatePackageJson(join(root, "package.json"), packageName, bundleName);
await updateWorkflowBucketDefaults(
  join(root, ".github", "workflows", "deploy-preprod.yml"),
  "preprod",
  prefix,
);
await updateWorkflowBucketDefaults(
  join(root, ".github", "workflows", "deploy-prod.yml"),
  "prod",
  prefix,
);
await renameBundleNamespaceDir(root, prefix);

console.log(`bootstrap: applied prefix "${prefix}"`);
console.log(`- package name: ${packageName}`);
console.log(`- default bucket: ${bucketName}`);
console.log(`- bundle artifact: ${bundleName}`);

async function updateDeployScript(path, bucket, bundle) {
  const original = await readFile(path, "utf8");

  const updated = original
    .replace(
      /const bucket = process\.env\.S3_BUCKET\?\.trim\(\) \|\| "[^"]+";/,
      `const bucket = process.env.S3_BUCKET?.trim() || "${bucket}";`,
    )
    .replace(
      /const key = process\.env\.S3_BUNDLE_KEY\?\.trim\(\) \|\| "[^"]+";/,
      `const key = process.env.S3_BUNDLE_KEY?.trim() || "${bundle}";`,
    )
    .replace(
      /const artifactPath = join\(root, "[^"]+"\);/,
      `const artifactPath = join(root, "${bundle}");`,
    );

  if (updated === original) {
    console.warn(`bootstrap: no deploy script changes needed for ${path}`);
    return;
  }

  await writeFile(path, updated);
}

async function updatePackageJson(path, newName, bundle) {
  const raw = await readFile(path, "utf8");
  const pkg = JSON.parse(raw);

  pkg.name = newName;
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.build = `node scripts/run-opa.mjs build -b opa/bundle -o ${bundle}`;
  pkg.scripts.bootstrap = "node scripts/bootstrap.mjs";

  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function updateWorkflowBucketDefaults(path, stage, targetPrefix) {
  const bucket = `${stage}-${targetPrefix}-sso-policies`;
  const original = await readFile(path, "utf8");

  const updated = original
    .replace(
      /^(\s*default:\s*)"[^"]+"(?:\s*--.*)?$/m,
      `$1"${bucket}"`,
    )
    .replace(
      /^(\s*S3_BUCKET:\s*\$\{\{\s*inputs\.s3_bucket\s*\|\|\s*')[^']+(' \}\})(?:\s*--.*)?$/m,
      `$1${bucket}$2`,
    );

  if (updated === original) {
    console.warn(`bootstrap: no workflow bucket updates needed for ${path}`);
    return;
  }

  await writeFile(path, updated);
}

async function renameBundleNamespaceDir(repoRoot, targetPrefix) {
  const fromName = "icm";
  if (targetPrefix === fromName) return;

  const fromPath = join(repoRoot, "opa", "bundle", fromName);
  const toPath = join(repoRoot, "opa", "bundle", targetPrefix);

  if (!(await pathExists(fromPath))) {
    console.warn(`bootstrap: namespace folder not found: ${fromPath}`);
    return;
  }

  if (await pathExists(toPath)) {
    console.warn(`bootstrap: target namespace folder already exists: ${toPath}`);
    return;
  }

  await rename(fromPath, toPath);
  console.log(`- namespace folder: opa/bundle/${fromName} -> opa/bundle/${targetPrefix}`);
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
