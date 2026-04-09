import { CopyObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, getR2Client } from "./client";

/**
 * Update the custom metadata on an existing R2 object.
 *
 * S3/R2 does not support in-place metadata updates — we must copy the object
 * to itself with `MetadataDirective: "REPLACE"` and the full new metadata map.
 *
 * The caller supplies only the fields they want to change; the rest are
 * preserved from the current object's HeadObject response.
 */
export async function updatePhotoMetadata(
  r2Key: string,
  updates: Record<string, string | undefined>
): Promise<void> {
  const client = getR2Client();

  // 1. Read current metadata so we can merge rather than overwrite everything.
  const head = await client.send(
    new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key })
  );
  const current = head.Metadata ?? {};

  // 2. Merge: updates override current; undefined values remove the key.
  const merged: Record<string, string> = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  // 3. Copy the object to itself with the merged metadata.
  // CopySource must be URL-encoded (R2 / S3 requirement — filenames with spaces
  // or special characters cause a signature mismatch if sent unencoded).
  const encodedKey = r2Key.split("/").map(encodeURIComponent).join("/");
  await client.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${encodedKey}`,
      Key: r2Key,
      Metadata: merged,
      MetadataDirective: "REPLACE",
      ...(head.ContentType ? { ContentType: head.ContentType } : {}),
    })
  );
}
