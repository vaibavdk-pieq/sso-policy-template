# SSO Policies Template

This template builds and deploys an OPA bundle from `opa/bundle` to S3.

## Included

- `package.json` with `build`, `deploy`, and `release` scripts
- `scripts/run-opa.mjs` to run OPA using a managed local binary
- `scripts/opa-binary.mjs` to download pinned OPA (`0.69.0`)
- `scripts/deploy-s3.mjs` to upload `icm-opa-bundle.tar.gz` to S3
- `.github/workflows/deploy-preprod.yml` (auto on `main` + manual)
- `.github/workflows/deploy-prod.yml` (manual only)

## Quick Start

1. Copy your policy/data files under `opa/bundle`.
2. Install dependencies:
   - `yarn install`
3. Build bundle:
   - `yarn build`
4. Deploy bundle:
   - `yarn deploy`

## Environment Variables

- `S3_BUCKET` (default: `icm-sso-policies`)
- `S3_BUNDLE_KEY` (default: `icm-opa-bundle.tar.gz`)
- `AWS_REGION` (default: `us-east-1`)
- `S3_BACKUP_BEFORE_DEPLOY` (`1|true|yes` to backup existing object)
- `S3_BACKUP_PREFIX` (default: `backup`)
- `OPA_PATH` (optional custom OPA binary path)
- `OPA_VERSION` (default: `0.69.0`)

## Notes

- Update workflow role ARNs in `.github/workflows/*` before using in your AWS account.
- This template intentionally excludes all editor-related files/scripts.
