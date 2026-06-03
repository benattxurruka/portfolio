# GitHub Actions Workflows

## Overview

| Workflow | Trigger | Purpose |
|---|---|---|
| `deploy.yml` | Push to `main`, PR, manual | Lint, build, deploy to Vercel |
| `rotate-cloudflare-token.yml` | 1st of month, manual | Rotate Cloudflare R2 API token |
| `rotate-github-token.yml` | 1 January, manual | Rotate GitHub App private key |
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
| `GH_CLIENT_ID` | rotate-github | GitHub App client ID (`Iv23li...` string, shown in App settings) |
| `GH_APP_PRIVATE_KEY` | rotate-github | Current GitHub App private key PEM (also stored in Vercel for the app) |
| `GRAFANA_ADMIN_TOKEN` | rotate-grafana | Cloud Access Policy token with `accesspolicies:read/write` scopes |
| `GRAFANA_CLOUD_ACCESS_POLICY_ID` | rotate-grafana | ID of the OTLP Cloud Access Policy |
| `GRAFANA_INSTANCE_ID` | rotate-grafana | Numeric Grafana Cloud stack/instance ID |
| `GRAFANA_URL` | terraform | Grafana stack URL (e.g. `https://yourstack.grafana.net`) |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | terraform | Grafana service account token with Editor role |
| `TF_API_TOKEN` | terraform | Terraform Cloud API token |

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
> | `Iv23liXXXXXXXXXX` (CLIENT_ID) | github.com/settings/apps → your App → Client ID |
> | `/path/to/key.pem` | Path to the downloaded `.pem` file — never copy/paste, always use the file directly |
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

### `rotate-github-token.yml`

The workflow reads the current private key from the `GH_APP_PRIVATE_KEY` GitHub Actions secret (not from Vercel — Vercel's API cannot decrypt `sensitive`-type env vars with standard tokens).

**One-time setup — store the current private key as a GitHub Actions secret:**
```bash
# Always use the downloaded .pem file directly — do NOT copy/paste (clipboard mangles PEM newlines)
gh secret set GH_APP_PRIVATE_KEY --env production --repo your-username/portfolio < /path/to/key.pem
```

**Environment variables for local testing:**
```bash
# CLIENT_ID: github.com/settings/apps → your App → Client ID (Iv23li... string, shown near the top)
export CLIENT_ID="Iv23liXXXXXXXXXX"
```

**Step 1 — copy the current key from the GitHub Actions secret into `/tmp/current-key.pem`:**

Copy the downloaded .pem file directly — do NOT use the clipboard:
```bash
cp /path/to/key.pem /tmp/current-key.pem
head -1 /tmp/current-key.pem   # should print: -----BEGIN RSA PRIVATE KEY-----
```

**Step 2 — verify JWT auth against GitHub (read-only, lists existing keys):**

Save as `/tmp/gh-rotate-test.mjs` and run with `CLIENT_ID=$CLIENT_ID node /tmp/gh-rotate-test.mjs`:

```js
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';

const clientId = process.env.CLIENT_ID;
const key = crypto.createPrivateKey(fs.readFileSync('/tmp/current-key.pem'));
const now = Math.floor(Date.now() / 1000);
const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: clientId })).toString('base64url');
const body    = `${header}.${payload}`;
const sig     = crypto.sign('sha256', Buffer.from(body), { key, padding: crypto.constants.RSA_PKCS1_PADDING }).toString('base64url');
const jwt     = `${body}.${sig}`;

const res = await new Promise((resolve, reject) => {
  const req = https.request({
    hostname: 'api.github.com', path: '/app', method: 'GET',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-key-rotation',
    },
  }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); });
  req.on('error', reject); req.end();
});

console.log('Status:', res.status);
if (res.status === 200) {
  const app = JSON.parse(res.body);
  console.log('App:', app.slug, '— JWT auth works, rotation script will succeed.');
} else {
  console.log('Body:', res.body);
}
```

`Status: 200` with the app slug means the JWT auth works and the rotation script will succeed.

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
