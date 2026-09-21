"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const MENU = "details.site-nav-wrap";

/**
 * Keeps the native <details> mobile menu: the header persists across client
 * navigations, so the menu must be closed explicitly after a link is chosen
 * or Escape is pressed.
 */
export function NavMenuBehavior() {
  const pathname = usePathname();

  useEffect(() => {
    document.querySelector(MENU)?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const menu = document.querySelector(MENU);
    if (!(menu instanceof HTMLDetailsElement)) {
      return;
    }
    const details = menu;

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("a, button")) {
        details.removeAttribute("open");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && details.open) {
        details.removeAttribute("open");
        details.querySelector("summary")?.focus();
      }
    }

    details.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      details.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
