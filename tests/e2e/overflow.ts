import type { Page } from "@playwright/test";

/**
 * True when the document and primary UI controls fit the viewport width.
 * Decorative SVG scene shapes are ignored: they are clipped by `.scene`.
 */
export function pageFitsViewport(page: Page) {
  return page.evaluate(() => {
    const limit = window.innerWidth + 1;
    if (document.documentElement.scrollWidth > limit) {
      return false;
    }
    if (document.body.scrollWidth > limit) {
      return false;
    }
    const selector = [
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "h1",
      "h2",
      "h3",
      ".hero-search",
      ".pro-card",
      ".auth-card",
      ".assistant-panel",
      ".assistant-trigger",
      ".site-header",
      ".button",
      "summary.nav-toggle",
    ].join(",");
    for (const el of document.querySelectorAll(selector)) {
      if (el.classList.contains("skip-link") || el.classList.contains("sr-only")) {
        continue;
      }
      if (el.closest(".booking-dates, .slot-list")) {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        continue;
      }
      if (rect.right > limit) {
        return false;
      }
    }
    return true;
  });
}
