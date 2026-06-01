"use server";

import { revalidateTag } from "next/cache";
import { markRead } from "@/lib/r2/messages";

export async function markMessageReadAction(id: string): Promise<void> {
  await markRead(id);
  revalidateTag("messages");
}
