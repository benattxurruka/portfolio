# GitHub Actions Workflows

## Overview

| Workflow | Trigger | Purpose |
|---|---|---|
| `deploy.yml` | Push to `main`, PR, manual | Lint, build, deploy to Vercel |
| `rotate-cloudflare-token.yml` | 1st of month, manual | Rotate Cloudflare R2 API token |
| `rotate-grafana-token.yml` | 1st of month, manual | Rotate Grafana OTLP Cloud Access Policy token |
| `terraform.yml` | Push/PR to `terraform/**`, manual | Plan and apply Grafana dashboards |

All workflows use the `production` GitHub Actions environment. Secrets must be set there:
**Repository → Settings → Environments → production → Environment secrets**.

---

## Secrets and variables reference

### Repository variables (`vars.*`)

| Name | Description |
|---|---|
| `GITHUB_USERNAME` | GitHub username for the repos feed |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public URL of the R2 bucket (e.g. `https://pub-xxx.r2.dev`) |
| `R2_PUBLIC_HOSTNAME` | Hostname extracted from the above (e.g. `pub-xxx.r2.dev`) |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name |
| `GRAFANA_PROMETHEUS_DS_UID` | Grafana Prometheus datasource UID (for Terraform) |
| `GRAFANA_LOKI_DS_UID` | Grafana Loki datasource UID (for Terraform) |
| `GRAFANA_TEMPO_DS_UID` | Grafana Tempo datasource UID (for Terraform) |

### Production environment secrets (`secrets.*`)

| Name | Used by | Description |
|---|---|---|
| `VERCEL_TOKEN` | all | Vercel team-scoped access token |
| `VERCEL_ORG_ID` | all | Vercel team ID (`team_xxx`) |
| `VERCEL_PROJECT_ID` | all | Vercel project ID (`prj_xxx`) |
| `SENTRY_AUTH_TOKEN` | deploy | Sentry token for source map upload |
| `SENTRY_ORG` | deploy | Sentry org slug |
| `SENTRY_PROJECT` | deploy | Sentry project slug |
| `NEXT_PUBLIC_SENTRY_DSN` | deploy | Sentry DSN |
| `CLOUDFLARE_ACCOUNT_ID` | rotate-cloudflare | Cloudflare account ID |
| `CLOUDFLARE_ADMIN_TOKEN` | rotate-cloudflare | Cloudflare token with R2 token management rights |
| `GRAFANA_ADMIN_TOKEN` | rotate-grafana | Cloud Access Policy token with `accesspolicies:read/write` scopes |
| `GRAFANA_CLOUD_ACCESS_POLICY_ID` | rotate-grafana | ID of the OTLP Cloud Access Policy |
| `GRAFANA_INSTANCE_ID` | rotate-grafana | Numeric Grafana Cloud stack/instance ID |
| `GRAFANA_URL` | terraform | Grafana stack URL (e.g. `https://yourstack.grafana.net`) |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | terraform | Grafana service account token with Editor role |
| `TF_API_TOKEN` | terraform | Terraform Cloud API token |

---

## GitHub App private key — manual annual rotation

GitHub's REST API does not support creating keys for user-owned GitHub Apps (`POST /app/keys` returns 404). Rotate the key manually once a year:

1. Go to **github.com/settings/apps → your App → Private keys → Generate a private key**
2. Download the new `.pem` file
3. Update the key in Vercel (used by the app at runtime):
   ```bash
   vercel env rm GH_TOKEN production
   # Paste the full PEM content when prompted — or use the Vercel dashboard
   ```
4. Revoke the old key in the GitHub App settings

> **Do not copy/paste PEM content through the clipboard** — it corrupts newlines. Use the Vercel dashboard or `< file` redirection.

---

## Local testing

> **Before running any command below, replace all placeholders with real values:**
>
> | Placeholder | Replace with |
> |---|---|
> | `your-username/portfolio` | Your GitHub `username/repo` (e.g. `benattxurruka/portfolio`) |
> | `your_cloudflare_account_id` | Cloudflare dashboard → top-right account ID |
> | `your_cloudflare_admin_token` | Cloudflare → My Profile → API Tokens |
> | `glc_your_admin_access_policy_token` | grafana.com → Security → Access Policies → your admin policy token |
> | `your_otlp_access_policy_id` | grafana.com → Security → Access Policies → OTLP policy → ID in the URL |
> | `your_terraform_cloud_token` | app.terraform.io → User Settings → Tokens |
> | `https://yourstack.grafana.net` | grafana.com → your stack → Stack URL |
> | `your_grafana_sa_token` | Grafana → Administration → Service Accounts |
> | `your_prometheus_uid` / `your_loki_uid` / `your_tempo_uid` | Grafana → Connections → Data sources → each source's UID |
> | `TOKEN_ID` | The `id` field returned by the Grafana token creation response |
>
> Never commit these values — use your password manager or `gh secret list` to recall names.

---

### `deploy.yml`

Runs automatically on push. To test locally:

```bash
npm run lint
npm run build
```

---

### `rotate-cloudflare-token.yml`

```bash
export CF_ACCOUNT_ID="your_cloudflare_account_id"
export CF_ADMIN_TOKEN="your_cloudflare_admin_token"
export R2_BUCKET_NAME="portfolio-photos"
```

**List existing rotating tokens (read-only check):**
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/tokens" \
  -H "Authorization: Bearer ${CF_ADMIN_TOKEN}" \
  | jq '.result[] | select(.name == "portfolio-r2-rotating") | {id, name}'
```

**Create a new token (actually rotates — do only when ready):**
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/tokens" \
  -H "Authorization: Bearer ${CF_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"portfolio-r2-rotating-test\",
    \"permissions\": [\"admin:read\", \"admin:write\"],
    \"buckets\": [{\"bucketName\": \"${R2_BUCKET_NAME}\"}],
    \"ttlSeconds\": 3456000
  }" | jq '{accessKeyId: .result.accessKeyId, ok: .success}'
```

---

### `rotate-grafana-token.yml`

```bash
export GRAFANA_ACCESS_POLICY_ADMIN_TOKEN="glc_your_admin_access_policy_token"
export POLICY_ID="your_otlp_access_policy_id"
```

**List tokens for the OTLP policy (read-only check):**
```bash
REGION="prod-eu-central-0"
TOKENS_URL="https://www.grafana.com/api/v1/tokens?region=${REGION}"
AUTH="Authorization: Bearer ${GRAFANA_ACCESS_POLICY_ADMIN_TOKEN}"

curl -s "${TOKENS_URL}" -H "${AUTH}" \
  | jq --arg pid "$POLICY_ID" '.items[] | select(.accessPolicyId == $pid) | {id, name, expiresAt}'
```

**Create a test token (use a different name to avoid affecting production):**
```bash
EXPIRY=$(date -u -v+40d '+%Y-%m-%dT%H:%M:%SZ')   # macOS
# EXPIRY=$(date -u -d '40 days' '+%Y-%m-%dT%H:%M:%SZ')  # Linux

curl -s -X POST "${TOKENS_URL}" \
  -H "${AUTH}" -H "Content-Type: application/json" \
  -d "{\"name\":\"otlp-rotating-test\",\"accessPolicyId\":\"${POLICY_ID}\",\"expiresAt\":\"${EXPIRY}\"}" | jq .
```

**Delete the test token once verified (use the `id` from the response above):**
```bash
curl -s -X DELETE "https://www.grafana.com/api/v1/tokens/TOKEN_ID?region=${REGION}" -H "${AUTH}"
```

---

### `terraform.yml`

Runs automatically when `terraform/**` files change. To run locally:

```bash
export TF_TOKEN_app_terraform_io="your_terraform_cloud_token"
export TF_VAR_grafana_url="https://yourstack.grafana.net"
export TF_VAR_grafana_service_account_token="your_grafana_sa_token"
export TF_VAR_prometheus_datasource_uid="your_prometheus_uid"
export TF_VAR_loki_datasource_uid="your_loki_uid"
export TF_VAR_tempo_datasource_uid="your_tempo_uid"

cd terraform
terraform init
terraform plan
terraform apply   # only when ready to apply changes
```
