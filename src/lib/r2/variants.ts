import sharp from "sharp";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { VARIANT_WIDTHS, getAvailableVariantWidths } from "./photos";

const WEBP_QUALITY = 82;
// Objects are versioned via a `?v=<updatedAt>` query param at read time, so
// once uploaded a given derivative's bytes never change under that URL.
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function variantKey(r2Key: string, width: number): string {
  return `_variants/${r2Key}/${width}.webp`;
}

/**
 * Resize the given image buffer into the standard set of WebP derivatives
 * (capped to the source's own pixel width) and upload each to R2 under
 * `_variants/<r2Key>/<width>.webp`.
 *
 * Returns the source image's real pixel dimensions, read directly from the
 * file rather than trusting caller-supplied metadata.
 */
export async function generateAndUploadVariants(
  client: S3Client,
  bucket: string,
  r2Key: string,
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const image = sharp(buffer, { failOn: "none" }).rotate(); // .rotate() applies EXIF orientation
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error(`Could not read image dimensions for ${r2Key}`);
  }

  const widths = getAvailableVariantWidths(width);

  await Promise.all(
    widths.map(async (w) => {
      const resized = await image
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: variantKey(r2Key, w),
          Body: resized,
          ContentType: "image/webp",
          CacheControl: IMMUTABLE_CACHE_CONTROL,
        })
      );
    })
  );

  return { width, height };
}

/**
 * Delete every pre-generated derivative for a photo (all widths). Used
 * before regenerating on replace — so a photo that shrinks doesn't leave
 * orphaned larger variants behind — and when a photo is deleted outright.
 */
export async function deleteVariants(client: S3Client, bucket: string, r2Key: string): Promise<void> {
  const prefix = `_variants/${r2Key}/`;
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token })
    );
    keys.push(...(res.Contents ?? []).map((o) => o.Key!).filter(Boolean));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  if (keys.length === 0) return;

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
}

export { VARIANT_WIDTHS };
