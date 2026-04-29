import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CopyObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bucket = process.env.S3_BUCKET?.trim() || "orbit-sso-policies";
const key = process.env.S3_BUNDLE_KEY?.trim() || "orbit-opa-bundle.tar.gz";
const region = process.env.AWS_REGION?.trim() || "us-east-1";

const backupEnabled =
  /^(1|true|yes)$/i.test(process.env.S3_BACKUP_BEFORE_DEPLOY?.trim() ?? "") ||
  Boolean(process.env.S3_BACKUP_PREFIX?.trim());
const backupPrefix = process.env.S3_BACKUP_PREFIX?.trim() || "backup";

const artifactPath = join(root, "orbit-opa-bundle.tar.gz");
if (!existsSync(artifactPath)) {
  console.error(
    `deploy: bundle not found at ${artifactPath}. Run yarn build first.`,
  );
  process.exit(1);
}

const body = readFileSync(artifactPath);
const client = new S3Client({ region });

if (backupEnabled) {
  await backupExistingObject(client, bucket, key, backupPrefix);
}

try {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/gzip",
    }),
  );
} catch (err) {
  if (err.name === "NoSuchBucket" || err.Code === "NoSuchBucket") {
    console.error(
      `deploy: bucket "${bucket}" does not exist in ${region} (or your credentials cannot see it).`,
    );
    console.error(
      `Create the bucket out of band (e.g. aws s3 mb s3://${bucket} --region ${region}) or set S3_BUCKET to an existing bucket.`,
    );
    process.exit(1);
  }
  throw err;
}

console.log(`Uploaded s3://${bucket}/${key}`);

async function backupExistingObject(client, bucket, key, backupPrefix) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    const code = err.name || err.Code;
    const status = err.$metadata?.httpStatusCode;
    if (status === 404 || code === "NotFound" || code === "NoSuchKey") {
      console.log(
        `deploy: no existing object at s3://${bucket}/${key}; skipping backup.`,
      );
      return;
    }
    throw err;
  }

  const stamp = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replace(/\.\d{3}Z$/, "Z");
  const destKey = `${backupPrefix.replace(/\/$/, "")}/${stamp}/${key}`;

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: destKey,
      CopySource: copySourceForS3(bucket, key),
    }),
  );
  console.log(`deploy: backed up to s3://${bucket}/${destKey}`);
}

function copySourceForS3(bucket, key) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${bucket}/${encodedKey}`;
}
