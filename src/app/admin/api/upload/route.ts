import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidateTag } from "next/cache";
import { BUCKET, getR2Client } from "@/lib/r2/client";

export const maxDuration = 60;

/**
 * POST /admin/api/upload
 *
 * Accepts a multipart/form-data body with:
 *   - file        : the image file
 *   - folder      : destination folder prefix inside R2 (e.g. "places/japan-2024")
 *   - title       : (optional) human-readable title
 *   - takenAt     : (optional) ISO date "2024-03-15"
 *   - location    : (optional) display text
 *   - tags        : (optional) comma-separated tags
 *   - lat         : (optional) decimal latitude
 *   - lng         : (optional) decimal longitude
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

  const folder = (formData.get("folder") as string | null)?.trim() ?? "";
  const filename = file.name.replace(/\s+/g, "-");
  const r2Key = folder ? `${folder}/${filename}` : filename;

  const enc = encodeURIComponent;
  const encList = (raw: string | null) =>
    (raw ?? "")
      .split(",")
      .map((v) => enc(v.trim()))
      .filter(Boolean)
      .join(",");

  const metadata: Record<string, string> = {};
  const title = (formData.get("title") as string | null)?.trim();
  if (title) metadata["title"] = enc(title);
  const takenAt = (formData.get("takenAt") as string | null)?.trim();
  if (takenAt) metadata["taken-at"] = takenAt;
  const location = (formData.get("location") as string | null)?.trim();
  if (location) metadata["location"] = enc(location);
  const tags = encList(formData.get("tags") as string | null);
  if (tags) metadata["tags"] = tags;
  const lat = (formData.get("lat") as string | null)?.trim();
  if (lat) metadata["lat"] = lat;
  const lng = (formData.get("lng") as string | null)?.trim();
  if (lng) metadata["lng"] = lng;
  const extraGalleries = (formData.get("extraGalleries") as string | null)
    ?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const galleryList = folder ? [folder] : [];
  for (const g of extraGalleries) {
    if (g !== folder) galleryList.push(g);
  }
  if (galleryList.length) metadata["galleries"] = galleryList.map(enc).join(",");

  // Width / height from exifr are passed as strings
  const width = (formData.get("width") as string | null)?.trim();
  if (width) metadata["width"] = width;
  const height = (formData.get("height") as string | null)?.trim();
  if (height) metadata["height"] = height;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
        Metadata: metadata,
      })
    );

    revalidateTag("r2-photos");

    return NextResponse.json({ r2Key });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
