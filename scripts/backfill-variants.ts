/**
 * One-off migration: generate `_variants/` WebP derivatives and populate
 * width/height metadata for every photo already in R2 (i.e. everything
 * uploaded before the R2Image / pre-generated-derivatives pipeline existed).
 *
 * Run once with:
 *   node --env-file=.env.local -r tsx/cjs scripts/backfill-variants.ts
 * or:
 *   npx tsx --env-file=.env.local scripts/backfill-variants.ts
 */
import {
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2Client, BUCKET } from "../src/lib/r2/client";
import { generateAndUploadVariants } from "../src/lib/r2/variants";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;
const VARIANTS_PREFIX = "_variants/";
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const CONCURRENCY = 4;

async function listPhotoKeys(client: ReturnType<typeof getR2Client>): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token })
    );
    for (const o of res.Contents ?? []) {
      if (o.Key && IMAGE_RE.test(o.Key) && !o.Key.startsWith(VARIANTS_PREFIX)) {
        keys.push(o.Key);
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function processKey(client: ReturnType<typeof getR2Client>, key: string): Promise<void> {
  const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  const existingMetadata = head.Metadata ?? {};

  const got = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const buffer = await streamToBuffer(got.Body as NodeJS.ReadableStream);

  const { width, height } = await generateAndUploadVariants(client, BUCKET, key, buffer);

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: head.ContentType || "image/jpeg",
      Metadata: { ...existingMetadata, width: String(width), height: String(height) },
      CacheControl: IMMUTABLE_CACHE_CONTROL,
    })
  );
}

async function runWithConcurrency<T>(items: T[], limit: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  let done = 0;
  let failed = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        await fn(items[i], i);
        done++;
        process.stdout.write(`\r${done + failed}/${items.length} (failed: ${failed})`);
      } catch (err) {
        failed++;
        process.stdout.write(`\n[FAILED] ${items[i]}: ${String(err)}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  console.log(`\nDone. ${done} succeeded, ${failed} failed out of ${items.length}.`);
}

async function main() {
  const client = getR2Client();
  console.log(`Listing photos in bucket "${BUCKET}"...`);
  const keys = await listPhotoKeys(client);
  console.log(`Found ${keys.length} photos. Generating variants with concurrency=${CONCURRENCY}...`);
  await runWithConcurrency(keys, CONCURRENCY, (key) => processKey(client, key));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
