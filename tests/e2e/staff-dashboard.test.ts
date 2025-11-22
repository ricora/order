import { expect, test } from "@playwright/test"
import { waitForHydration } from "./utils"

test.describe("スタッフダッシュボード", () => {
  test("チャートがクライアントレンダリングされる", async ({ page }) => {
    await waitForHydration(page, "/staff")

    const trendChart = page.getByRole("img", {
      name: "日別の注文数と売上の推移",
    })
    const statusChart = page.getByRole("img", {
      name: "ステータス別注文数の内訳",
    })

    await expect(trendChart).toBeVisible()
    await expect(statusChart).toBeVisible()

    await page.waitForFunction(
      (selector) =>
        !!document
          .querySelector<HTMLCanvasElement>(selector)
          ?.getAttribute("style"),
      'canvas[aria-label="日別の注文数と売上の推移"]',
    )
    await page.waitForFunction(
      (selector) =>
        !!document
          .querySelector<HTMLCanvasElement>(selector)
          ?.getAttribute("style"),
      'canvas[aria-label="ステータス別注文数の内訳"]',
    )

    const trendBox = await trendChart.boundingBox()
    expect(trendBox?.height ?? 0).toBeGreaterThan(100)
    expect(trendBox?.width ?? 0).toBeGreaterThan(100)
  })
})
