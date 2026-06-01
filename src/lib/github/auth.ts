/**
 * GitHub App authentication — runtime installation token generation.
 *
 * Why this instead of a static PAT?
 *   - Installation tokens are short-lived (≤ 1 hour) and generated automatically,
 *     so there is nothing to manually rotate.
 *   - The only long-lived credential is the App private key, which is rotated
 *     annually via the rotate-github-token workflow.
 *   - A PAT that never expires is a security liability; this eliminates it.
 *
 * Required Vercel env vars:
 *   GH_APP_ID               — numeric GitHub App ID (e.g. "123456")
 *   GH_APP_INSTALLATION_ID  — ID of the App installation on your account
 *   GH_APP_PRIVATE_KEY      — RSA private key PEM, newlines stored as \n
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
function makeAppJWT(appId: string, privateKeyPem: string): string {
  const now     = Math.floor(Date.now() / 1000);
  const header  = b64u(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64u(Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId })));
  const body    = `${header}.${payload}`;
  const sig     = b64u(crypto.createSign("RSA-SHA256").update(body).sign(privateKeyPem));
  return `${body}.${sig}`;
}

/**
 * Exchange a GitHub App JWT for a short-lived installation access token (max 1 h).
 *
 * The token is scoped to the repositories accessible to the given installation.
 * For a personal portfolio, this typically means read access to your public repos.
 */
export async function getInstallationToken(
  appId: string,
  privateKey: string,
  installationId: string,
): Promise<string> {
  // Normalise the PEM: Vercel can deliver it with literal \n sequences,
  // Windows-style CRLF, or (after a botched rotation) JSON-quoted with leading ".
  let pem = privateKey
    .replace(/\\r\\n/g, "\n") // literal \r\n → newline
    .replace(/\\n/g, "\n")    // literal \n  → newline
    .replace(/\r\n/g, "\n")   // actual CRLF → newline
    .replace(/\r/g, "\n")     // stray CR    → newline
    .trim();

  // If the rotation stored the value as a JSON string (starts/ends with "),
  // unwrap it so OpenSSL receives bare PEM content.
  if (pem.startsWith('"') && pem.endsWith('"')) {
    try { pem = JSON.parse(pem); } catch { /* leave as-is */ }
  }
  const jwt = makeAppJWT(appId, pem);

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization:          `Bearer ${jwt}`,
        Accept:                 "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent":           "portfolio-app",
      },
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
  const appId          = process.env.GH_APP_ID?.trim();
  const installationId = process.env.GH_APP_INSTALLATION_ID?.trim();
  const privateKey     = process.env.GH_APP_PRIVATE_KEY?.trim();

  if (appId && installationId && privateKey) {
    const token = await getInstallationToken(appId, privateKey, installationId);
    return `Bearer ${token}`;
  }

  const pat = process.env.GH_TOKEN?.trim();
  return pat ? `Bearer ${pat}` : undefined;
}
