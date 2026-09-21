"use client";

import { useEffect } from "react";

export function StickyHeader() {
  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!(header instanceof HTMLElement)) {
      return;
    }
    const bar = header;

    function update() {
      bar.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return null;
}
