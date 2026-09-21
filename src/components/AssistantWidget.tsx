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
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
          <path
            d="M3.9 12.6v-1a8.1 8.1 0 0 1 16.2 0v1"
            fill="none"
            stroke="#b9c1ce"
            strokeWidth="1.2"
          />
          <rect x="10" y="4.7" width="4" height="2.4" rx="1.1" fill="#d5dae4" />
          <rect x="10" y="15" width="4" height="3" rx="1" fill="#c5ccd9" />
          <path d="M5.5 22.6v-2c0-2 1.4-3.3 3.4-3.3h6.2c2 0 3.4 1.3 3.4 3.3v2z" fill="#e6eaf2" />
          <rect x="4.4" y="6.6" width="15.2" height="10" rx="4.4" fill="#f1f4f9" />
          <rect x="2.3" y="9.7" width="3" height="5.2" rx="1.3" fill="#c5ccd9" />
          <rect x="18.7" y="9.7" width="3" height="5.2" rx="1.3" fill="#c5ccd9" />
          <rect x="5.9" y="8" width="12.2" height="7.1" rx="3" fill="#10222d" />
          <path d="M7.7 12.3a1.7 1.7 0 0 1 3.4 0z" fill="#6df5ff" />
          <path d="M12.9 12.3a1.7 1.7 0 0 1 3.4 0z" fill="#6df5ff" />
          <path d="M10.8 13.3a1.2 1.2 0 0 0 2.4 0z" fill="#6df5ff" />
        </svg>
      </button>
    </div>
  );
}
