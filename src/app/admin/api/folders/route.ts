import { getPhotos } from "@/lib/r2/photos";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const photos = await getPhotos();

    const folders = new Set<string>();
    for (const p of photos) {
      const lastSlash = p.r2Key.lastIndexOf("/");
      if (lastSlash > 0) {
        folders.add(p.r2Key.slice(0, lastSlash));
      }
    }

    return NextResponse.json({ folders: [...folders].sort() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
