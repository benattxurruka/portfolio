import { getPhotos } from "@/lib/r2/photos";
import { deriveGalleries } from "@/lib/utils/galleries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const photos = await getPhotos();
    const galleries = deriveGalleries(photos)
      .filter((g) => g.id !== "all")
      .map((g) => ({ id: g.id, name: g.name, type: g.type }));

    return NextResponse.json({ galleries });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
