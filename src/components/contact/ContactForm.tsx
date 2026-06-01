"use client";

import { useActionState } from "react";
import { sendMessage } from "@/actions/sendMessage";
import type { SendMessageState } from "@/actions/sendMessage";

const initialState: SendMessageState = {};

const inputBase =
  "w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink-primary text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(sendMessage, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-400 text-sm">
        ¡Mensaje enviado! Me pondré en contacto contigo pronto.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm text-ink-secondary mb-1">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Tu nombre (opcional)"
          className={inputBase}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-ink-secondary mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com (opcional)"
          className={inputBase}
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm text-ink-secondary mb-1">
          Mensaje <span className="text-ink-muted">(requerido)</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          placeholder="Escribe aquí tu mensaje…"
          className={inputBase + " resize-y"}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium
                   hover:bg-accent/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
