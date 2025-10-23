import { expect, test } from "@playwright/test"

test("トップページが表示される", async ({ page }) => {
  await page.goto("/")

  // タイトルが "Hono" であることを確認
  await expect(page).toHaveTitle("Hono")

  // "Hello, Hono!" という見出しが表示されることを確認
  await expect(
    page.getByRole("heading", { name: "Hello, Hono!" }),
  ).toBeVisible()
})
