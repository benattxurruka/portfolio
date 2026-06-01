import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { revalidateTag } from "next/cache";
import { BUCKET, getR2Client } from "@/lib/r2/client";

export async function POST(req: NextRequest) {
  const body = await req.json() as { r2Key?: string };
  const r2Key = body.r2Key?.trim();
  if (!r2Key) {
    return NextResponse.json({ error: "r2Key is required" }, { status: 400 });
  }

  try {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: r2Key }));
    revalidateTag("r2-photos");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
