"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/en";

/** V1 assistant is UI-only: no messages, no network, no AI. */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="assistant">
      <section
        id="assistant-panel"
        className="assistant-panel"
        data-open={open}
        aria-labelledby="assistant-title"
        data-testid="assistant-panel"
      >
        <div className="assistant-panel__head">
          <h2 id="assistant-title" className="assistant-panel__title">
            {copy.assistantTitle}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="assistant-panel__close"
            aria-label={copy.assistantClose}
            onClick={close}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
              <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z" />
            </svg>
          </button>
        </div>
        <p className="assistant-panel__body">{copy.assistantBody}</p>
        <Link href="/search" className="button" onClick={() => setOpen(false)}>
          {copy.findProfessional}
        </Link>
      </section>
      <button
        ref={triggerRef}
        type="button"
        className="assistant-trigger"
        aria-label={copy.assistantOpen}
        aria-expanded={open}
        aria-controls="assistant-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7.2L8 22v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
          />
          <path fill="var(--color-brand)" d="M12 6.5 7 10.6h1.5V14h7v-3.4H17z" />
        </svg>
      </button>
    </div>
  );
}
