/**
 * GitHub App authentication — runtime installation token generation.
 *
 * Why this instead of a static PAT?
 *   - Installation tokens are short-lived (≤ 1 hour) and generated automatically,
 *     so there is nothing to manually rotate.
 *   - The only long-lived credential is the App private key, rotated annually.
 *   - A PAT that never expires is a security liability; this eliminates it.
 *
 * Required Vercel env vars:
 *   GH_APP_CLIENT_ID   — client_id string shown in App settings (e.g. "Iv23li...")
 *                        NOT the numeric App ID — GitHub uses client_id as the JWT issuer
 *   GH_APP_PRIVATE_KEY — RSA private key PEM, newlines stored as \n
 *
 * Optional:
 *   GH_APP_INSTALLATION_ID — if omitted, the installation is discovered automatically
 *                            via GET /app/installations (one extra call per cold start)
 */

import crypto from "crypto";

/** Base64url (RFC 4648 §5): no padding, + → -, / → _ */
function b64u(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Build a signed RS256 JWT for GitHub App authentication.
 * iat is backdated 60 s to tolerate clock skew; exp is 10 min ahead.
 */
function makeAppJWT(clientId: string, privateKeyPem: string): string {
  const now     = Math.floor(Date.now() / 1000);
  const header  = b64u(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64u(Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 600, iss: clientId })));
  const body    = `${header}.${payload}`;
  const sig     = b64u(crypto.createSign("RSA-SHA256").update(body).sign(privateKeyPem));
  return `${body}.${sig}`;
}

function normalizePem(raw: string): string {
  let pem = raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (pem.startsWith('"') && pem.endsWith('"')) {
    try { pem = JSON.parse(pem); } catch { /* leave as-is */ }
  }
  return pem;
}

const ghHeaders = {
  Accept:                 "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent":           "portfolio-app",
};

/** Discover the first installation ID for the authenticated app. */
async function discoverInstallationId(jwt: string): Promise<string> {
  const res = await fetch("https://api.github.com/app/installations", {
    headers: { ...ghHeaders, Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub App JWT invalid (${res.status}): ${body}`);
  }
  const list = (await res.json()) as Array<{ id: number }>;
  if (!list.length) throw new Error("GitHub App has no installations");
  return String(list[0].id);
}

/**
 * Exchange a GitHub App JWT for a short-lived installation access token (max 1 h).
 */
export async function getInstallationToken(
  clientId: string,
  privateKey: string,
  installationId?: string,
): Promise<string> {
  const pem = normalizePem(privateKey);
  const jwt = makeAppJWT(clientId, pem);

  const id = installationId || await discoverInstallationId(jwt);

  const res = await fetch(
    `https://api.github.com/app/installations/${id}/access_tokens`,
    {
      method: "POST",
      headers: { ...ghHeaders, Authorization: `Bearer ${jwt}` },
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub App auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

/**
 * Resolve the best available Authorization header value for GitHub API calls.
 *
 * Priority:
 *   1. GitHub App installation token  (auto-rotated, preferred)
 *   2. Static PAT from GH_TOKEN       (legacy fallback)
 *   3. Unauthenticated                (60 req/h rate limit)
 */
export async function resolveGitHubAuthHeader(): Promise<string | undefined> {
  const clientId       = process.env.GH_APP_CLIENT_ID?.trim();
  const privateKey     = process.env.GH_APP_PRIVATE_KEY?.trim();
  const installationId = process.env.GH_APP_INSTALLATION_ID?.trim();

  if (clientId && privateKey) {
    const token = await getInstallationToken(clientId, privateKey, installationId);
    return `Bearer ${token}`;
  }

  const pat = process.env.GH_TOKEN?.trim();
  return pat ? `Bearer ${pat}` : undefined;
}
