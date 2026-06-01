import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { revalidateTag } from "next/cache";
import { BUCKET, getR2Client } from "@/lib/r2/client";

export const maxDuration = 60;

/**
 * POST /admin/api/replace
 *
 * Replaces the image bytes of an existing R2 object while preserving all
 * existing metadata. The r2Key (path) stays the same.
 *
 * Body: multipart/form-data
 *   - file   : the new image file
 *   - r2Key  : the existing R2 object key to overwrite
 *
 * Returns: { r2Key: string }
 */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const r2Key = (formData.get("r2Key") as string | null)?.trim();
  if (!r2Key) {
    return NextResponse.json({ error: "r2Key is required" }, { status: 400 });
  }

  try {
    const client = getR2Client();

    // Read existing metadata so we can preserve it on the new upload
    const head = await client.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key })
    );
    const existingMetadata = head.Metadata ?? {};

    // Re-derive width/height from the new file if the caller supplied them
    const width = (formData.get("width") as string | null)?.trim();
    const height = (formData.get("height") as string | null)?.trim();
    const mergedMetadata = {
      ...existingMetadata,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    };

    const buffer = Buffer.from(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type || head.ContentType || "image/jpeg",
        Metadata: mergedMetadata,
      })
    );

    revalidateTag("r2-photos");

    return NextResponse.json({ r2Key });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
