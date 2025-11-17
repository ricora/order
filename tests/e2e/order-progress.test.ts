import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { waitForHydration } from "./utils"

/**
 * セクションが読み込まれるまで待機
 */
async function waitForSectionsLoaded(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const sections = document.querySelectorAll("section")
      return sections.length >= 4
    },
    { timeout: 15000 },
  )
}

/**
 * 処理待ちセクションから最初の注文カードを取得
 */
async function getPendingOrderCard(page: Page) {
  const pendingSection = page
    .locator("section")
    .filter({ hasText: "処理待ち" })
    .first()
  const card = pendingSection.locator("div[data-order-id]").first()
  await expect(card).toBeVisible({ timeout: 15000 })
  return card
}

/**
 * トースト通知が表示されるまで待機
 */
async function waitForToastWithOrderId(
  page: Page,
  orderId: string,
): Promise<void> {
  await page.waitForFunction(
    (id) =>
      Array.from(document.querySelectorAll('[role="alert"]')).some((el) =>
        el.textContent?.includes(`#${id}`),
      ),
    orderId,
    { timeout: 10000 },
  )
}

/**
 * 注文が処理待ちセクションから消えるまで待機
 */
async function waitForOrderToLeavePendingSection(
  page: Page,
  orderId: string,
): Promise<void> {
  const pendingSection = page
    .locator("section")
    .filter({ hasText: "処理待ち" })
    .first()
  await expect(
    pendingSection.locator(`div[data-order-id="${orderId}"]`),
  ).not.toBeVisible({ timeout: 10000 })
}

/**
 * ボタンが無効になるまで待機
 */
async function waitForButtonDisabled(
  page: Page,
  ariaLabel: string,
): Promise<void> {
  await page.waitForFunction(
    (label) => {
      const btn = document.querySelector(
        `button[aria-label="${label}"]`,
      ) as HTMLButtonElement | null
      return btn ? btn.disabled : false
    },
    ariaLabel,
    { timeout: 5000 },
  )
}

/**
 * ボタンが有効になるまで待機
 */
async function waitForButtonEnabled(
  page: Page,
  ariaLabel: string,
): Promise<void> {
  await page.waitForFunction(
    (label) => {
      const btn = document.querySelector(
        `button[aria-label="${label}"]`,
      ) as HTMLButtonElement | null
      return btn ? !btn.disabled : false
    },
    ariaLabel,
    { timeout: 3000 },
  )
}

test.describe("注文進捗管理", () => {
  test("ステータスを更新するとトーストが表示される", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/progress")
    await waitForSectionsLoaded(page)

    // 処理待ちセクションから注文カードを取得
    const card = await getPendingOrderCard(page)
    const orderId = await card.getAttribute("data-order-id")
    expect(orderId).toBeTruthy()
    if (!orderId) throw new Error("Order ID not found")

    // 「処理中」に移動させるボタンをクリック
    const toProcessingButton = card
      .getByRole("button", { name: /処理中に移動/ })
      .first()
    await toProcessingButton.scrollIntoViewIfNeeded()
    await expect(toProcessingButton).toBeEnabled({ timeout: 10000 })
    await toProcessingButton.click()

    // トーストが表示されるまで待機
    await waitForToastWithOrderId(page, orderId)

    // この注文IDを含むトーストが1件だけ表示されている
    const toastsWithId = page
      .locator('div[role="alert"]')
      .filter({ hasText: `#${orderId}` })
    expect(await toastsWithId.count()).toBe(1)

    // 注文が処理待ちセクションから消えるまで待機
    await waitForOrderToLeavePendingSection(page, orderId)

    // ローカル更新後は手動更新ボタンが有効である
    const manualRefreshBtn = page.getByRole("button", {
      name: "注文一覧を更新する",
    })
    await expect(manualRefreshBtn).toBeEnabled({ timeout: 10000 })
  })

  test("手動更新ボタンがクールダウン中は無効になる", async ({ page }) => {
    await waitForHydration(page, "/staff/orders/progress")
    await waitForSectionsLoaded(page)

    const refreshBtn = page.getByRole("button", { name: "注文一覧を更新する" })
    await expect(refreshBtn).toBeVisible()
    await expect(refreshBtn).toBeEnabled()

    // 手動更新ボタンをクリック
    await refreshBtn.click()

    // ボタンが無効化されるまで待機
    await waitForButtonDisabled(page, "注文一覧を更新する")
    await expect(refreshBtn).toBeDisabled()

    // クールダウン後に有効になるまで待機
    await waitForButtonEnabled(page, "注文一覧を更新する")
    await expect(refreshBtn).toBeEnabled()
  })
})
