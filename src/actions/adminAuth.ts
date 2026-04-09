"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "admin_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Hash the secret using the Web Crypto API (Edge-compatible). */
async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function adminLogin(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const password = formData.get("password") as string;
  const secret = process.env.ADMIN_SECRET;

  if (!secret) return { error: "ADMIN_SECRET env var is not configured." };
  if (!password || password !== secret) return { error: "Wrong password." };

  const hash = await hashSecret(secret);
  const jar = await cookies();
  jar.set(COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: THIRTY_DAYS,
    path: "/",
  });

  redirect("/admin/photos");
}

export async function adminLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
  redirect("/admin/login");
}
