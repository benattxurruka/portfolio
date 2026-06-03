#!/usr/bin/env node
/**
 * sync-exif.mjs
 *
 * Reads EXIF metadata from local photo files and writes it to the matching
 * Cloudflare R2 objects as custom object metadata (x-amz-meta-*).
 *
 * Usage:
 *   # Photos in bucket root (no subfolders):
 *   node scripts/sync-exif.mjs --dir ./my-photos
 *
 *   # Photos inside a subfolder in R2:
 *   node scripts/sync-exif.mjs --dir ./my-photos --prefix photos/japan-2024
 *
 *   # Preview changes without writing:
 *   node scripts/sync-exif.mjs --dir ./my-photos --dry-run
 *
 *   # Overwrite existing title/description/location too:
 *   node scripts/sync-exif.mjs --dir ./my-photos --force
 *
 * Options:
 *   --dir      Local directory containing the photos (required)
 *   --prefix   R2 key prefix to prepend to filenames (optional)
 *              Omit if photos are in the bucket root.
 *              e.g. "photos/japan-2024" → R2 key "photos/japan-2024/IMG_001.jpg"
 *   --force    Overwrite title/description/location even if already set.
 *              GPS and date are always written (they come from ground truth EXIF).
 *   --dry-run  Print what would change without touching R2
 *
 * Prerequisites:
 *   npm install --save-dev exifr dotenv
 *
 * R2 credentials are read from .env.local (same vars as the Next.js app):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { S3Client, HeadObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { config as loadDotenv } from "dotenv";
import exifr from "exifr";

// ── Load .env.local ──────────────────────────────────────────────────────────
loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" }); // fallback

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};
const has = (flag) => args.includes(flag);

const localDir = get("--dir");
const r2Prefix = get("--prefix") ?? ""; // empty = photos are in the bucket root
const force    = has("--force");
const dryRun   = has("--dry-run");

if (!localDir) {
  console.error("Usage: node scripts/sync-exif.mjs --dir <path> [--prefix <r2-prefix>] [--force] [--dry-run]");
  console.error("  --prefix is optional; omit it if your photos are in the bucket root.");
  process.exit(1);
}

// ── R2 client ────────────────────────────────────────────────────────────────
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing R2 credentials in .env.local. Need: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});
const BUCKET = R2_BUCKET_NAME;

// ── Helpers ──────────────────────────────────────────────────────────────────
const IMAGE_RE = /\.(jpe?g|png|webp|avif|tiff?)$/i;

function pad(n) { return String(n).padStart(2, "0"); }

function formatDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return undefined;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function decimalGps(dms, ref) {
  if (!dms || !Array.isArray(dms)) return undefined;
  const [deg, min, sec] = dms;
  let decimal = deg + min / 60 + (sec ?? 0) / 3600;
  if (ref === "S" || ref === "W") decimal = -decimal;
  return Math.round(decimal * 1e7) / 1e7; // 7 decimal places
}

async function extractExif(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      gps: true,
      iptc: true,
      xmp: false,
      ifd0: true,
      exif: true,
      translateValues: true,
    });
    if (!data) return {};

    const lat = data.latitude  ?? decimalGps(data.GPSLatitude,  data.GPSLatitudeRef);
    const lng = data.longitude ?? decimalGps(data.GPSLongitude, data.GPSLongitudeRef);

    const takenAt = formatDate(
      data.DateTimeOriginal ?? data.CreateDate ?? data.ModifyDate
    );

    // IPTC fields (if the photo was tagged in Lightroom / Capture One)
    const title       = data.ObjectName ?? data.Headline ?? undefined;
    const description = data.Caption    ?? data.ImageDescription ?? undefined;
    const location    = data.City
      ? [data.City, data.Country].filter(Boolean).join(", ")
      : undefined;
    const keywords    = Array.isArray(data.Keywords)
      ? data.Keywords.join(",")
      : typeof data.Keywords === "string" ? data.Keywords : undefined;

    return { lat, lng, takenAt, title, description, location, keywords };
  } catch {
    return {};
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const entries = await readdir(localDir);
const images = [];
for (const name of entries) {
  if (!IMAGE_RE.test(name)) continue;
  const fullPath = join(localDir, name);
  const s = await stat(fullPath);
  if (s.isFile()) images.push({ name, fullPath });
}

if (images.length === 0) {
  console.log("No image files found in", localDir);
  process.exit(0);
}

console.log(`Found ${images.length} images in ${localDir}`);
if (dryRun)  console.log("DRY RUN — no changes will be written to R2.");
if (force)   console.log("FORCE — will overwrite existing title / description / location.");
console.log("");

let updated = 0, skipped = 0, missing = 0, errors = 0;

for (const { name, fullPath } of images) {
  const r2Key = r2Prefix ? `${r2Prefix.replace(/\/$/, "")}/${name}` : name;
  process.stdout.write(`  ${name} … `);

  // 1. Check object exists in R2
  let current = {};
  let contentType;
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key }));
    current = head.Metadata ?? {};
    contentType = head.ContentType;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      console.log("NOT FOUND in R2 — skipped");
      missing++;
      continue;
    }
    console.log(`ERROR reading R2: ${err.message}`);
    errors++;
    continue;
  }

  // 2. Extract EXIF
  const exif = await extractExif(fullPath);

  // 3. Build merged metadata
  //    GPS and date: always set from EXIF (ground truth)
  //    title/description/location/keywords: only set if missing, or if --force
  const merged = { ...current };

  const setIfAbsent = (key, value) => {
    if (value !== undefined && (force || !merged[key])) {
      merged[key] = String(value);
    }
  };
  const setAlways = (key, value) => {
    if (value !== undefined) merged[key] = String(value);
  };

  setAlways("lat",      exif.lat);
  setAlways("lng",      exif.lng);
  setAlways("taken-at", exif.takenAt);
  setIfAbsent("title",       exif.title);
  setIfAbsent("description", exif.description);
  setIfAbsent("location",    exif.location);
  setIfAbsent("tags",        exif.keywords);

  // 4. Detect changes
  const changed = Object.entries(merged).some(([k, v]) => current[k] !== v) ||
                  Object.keys(current).some((k) => merged[k] === undefined);

  if (!changed) {
    console.log("up to date");
    skipped++;
    continue;
  }

  const diff = Object.entries(merged)
    .filter(([k, v]) => current[k] !== v)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  console.log(`updating (${diff})`);

  if (dryRun) { updated++; continue; }

  // 5. Copy-to-self with updated metadata
  try {
    const encodedKey = r2Key.split("/").map(encodeURIComponent).join("/");
    await client.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${encodedKey}`,
      Key: r2Key,
      Metadata: merged,
      MetadataDirective: "REPLACE",
      ...(contentType ? { ContentType: contentType } : {}),
    }));
    updated++;
  } catch (err) {
    console.log(`  → ERROR writing R2: ${err.message}`);
    errors++;
  }
}

console.log(`\nDone. ${updated} updated, ${skipped} already up to date, ${missing} not found in R2, ${errors} errors.`);
if (updated > 0 && !dryRun) {
  console.log("\nThe Next.js photo cache will refresh automatically within 5 minutes.");
  console.log("To force immediate refresh, visit /admin/photos and save any photo.");
}
