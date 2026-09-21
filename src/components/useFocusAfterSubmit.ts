"use client";

import { useEffect, useRef } from "react";

/**
 * After a booking action succeeds the form usually disappears with the
 * revalidated page, which would drop keyboard/screen-reader focus to <body>.
 * If the form unmounts after being submitted, focus moves to its booking card.
 */
export function useFocusAfterSubmit<T extends HTMLElement>(pending: boolean) {
  const ref = useRef<T | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (pending) {
      submitted.current = true;
    }
  }, [pending]);

  useEffect(() => {
    const item = ref.current?.closest<HTMLElement>("[data-booking-item]");
    return () => {
      if (submitted.current && item?.isConnected) {
        item.focus({ preventScroll: true });
      }
    };
  }, []);

  return ref;
}
