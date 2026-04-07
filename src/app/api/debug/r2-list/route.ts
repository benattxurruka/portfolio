import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { BUCKET, getR2Client } from "@/lib/r2/client";

export const dynamic = "force-dynamic";

// Lists the first 50 keys in the bucket without any prefix filter.
// Use this to discover the actual key structure: GET /api/debug/r2-list
// Optional: GET /api/debug/r2-list?prefix=somefolder/
export async function GET(req: Request) {
  const prefix = new URL(req.url).searchParams.get("prefix") ?? undefined;

  let client;
  try {
    client = getR2Client();
  } catch (err) {
    return NextResponse.json({ error: `R2 client init failed: ${err}` }, { status: 500 });
  }

  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 50 })
    );

    const publicBase = process.env.R2_PUBLIC_URL ?? "(R2_PUBLIC_URL not set)";
    const keys = (res.Contents ?? []).map((o) => o.Key);

    return NextResponse.json({
      bucket: BUCKET,
      prefix: prefix ?? "(none)",
      keyCount: res.KeyCount ?? 0,
      isTruncated: res.IsTruncated ?? false,
      r2PublicUrl: publicBase,
      sampleImageUrl: keys[0] ? `${publicBase}/${keys[0]}` : null,
      keys,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
