"use client";

import { useActionState } from "react";

interface Props {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string }>;
}

export function LoginForm({ action }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm text-ink-secondary mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border
                     text-ink-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium
                   hover:bg-accent/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
