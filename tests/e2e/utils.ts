import type { Page } from "@playwright/test"

/**
 * Wait for hono/jsx hydration to complete.
 * This function waits for the page to be loaded and then waits for the network
 * to be idle, indicating that client-side hydration has completed.
 *
 * @param page - The Playwright page object
 * @param url - The URL to navigate to
 */
export async function waitForHydration(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" })
  // Wait for network to be idle after DOM is loaded, which typically indicates
  // that hono/jsx hydration has completed
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 })
  } catch {
    // If networkidle times out, continue anyway as the page may still be functional
    // This is a fallback for cases where the page has ongoing network activity
  }
}
