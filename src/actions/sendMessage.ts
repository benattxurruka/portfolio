"use server";

import { revalidateTag } from "next/cache";
import { saveMessage } from "@/lib/r2/messages";

export interface SendMessageState {
  success?: boolean;
  error?: string;
}

export async function sendMessage(
  _prev: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";

  if (!body || body.length < 10) {
    return { error: "El mensaje debe tener al menos 10 caracteres." };
  }

  try {
    await saveMessage({
      name: name || "Anónimo",
      email: email || "",
      body,
    });
    revalidateTag("messages");
    return { success: true };
  } catch (err) {
    console.error("[sendMessage] Failed to save message:", err);
    return { error: "No se pudo enviar el mensaje. Inténtalo de nuevo." };
  }
}
