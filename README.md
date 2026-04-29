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

1. First, set up this `sso-policies-template` repository.
2. Install dependencies:
   - `yarn install`
3. Run bootstrap from this repo to replace the default `icm` prefix with your dedicated name:
   - `yarn bootstrap <your-prefix>`
   - Example: `yarn bootstrap orbit`
   - This updates `package.json`, deployment defaults, and renames `opa/bundle/icm` to `opa/bundle/<your-prefix>` when present.
4. After running bootstrap, set up your policies and data files under `opa/bundle` (including your renamed namespace folder).
5. Build bundle:
   - `yarn build`
6. Deploy bundle:
   - `yarn deploy`
7. Update both GitHub workflows before enabling CI/CD:
   - `.github/workflows/deploy-preprod.yml`
   - `.github/workflows/deploy-prod.yml`
   - Replace default bucket names and AWS role ARNs with your preprod/prod values.

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
- Ensure `preprod` and `prod` workflow bucket defaults match your selected bootstrap prefix.
- This template intentionally excludes all editor-related files/scripts.
