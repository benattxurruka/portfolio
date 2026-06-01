"use client";

import { useState, useTransition } from "react";
import { markMessageReadAction } from "@/actions/markMessageRead";
import type { Message } from "@/lib/r2/messages";
import { cn } from "@/lib/utils/cn";

interface Props {
  message: Message;
}

export function InboxMessage({ message }: Props) {
  const [isRead, setIsRead] = useState(message.read);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, startTransition] = useTransition();

  function handleClick() {
    setIsExpanded(true);
    if (!isRead) {
      setIsRead(true);
      startTransition(() => {
        markMessageReadAction(message.id);
      });
    }
  }

  const formattedDate = new Date(message.createdAt).toLocaleString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all",
        isRead
          ? "bg-surface-1 border-border"
          : "bg-accent/5 border-accent/30"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {!isRead && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-accent mt-0.5" />
          )}
          <span
            className={cn(
              "text-sm truncate",
              isRead ? "text-ink-secondary" : "text-ink-primary font-semibold"
            )}
          >
            {message.name}
          </span>
          {message.email && (
            <span className="text-ink-muted text-xs truncate">{message.email}</span>
          )}
        </div>
        <span className="text-ink-muted text-xs shrink-0">{formattedDate}</span>
      </div>

      <p
        className={cn(
          "text-sm text-ink-secondary whitespace-pre-wrap break-words",
          !isExpanded && "line-clamp-2"
        )}
      >
        {message.body}
      </p>

      {!isExpanded && (
        <span className="text-xs text-ink-muted mt-1 inline-block">
          Haz clic para leer
        </span>
      )}
    </button>
  );
}
