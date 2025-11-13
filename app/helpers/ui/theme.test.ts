import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  applyColorScheme,
  getStoredColorScheme,
  getSystemColorScheme,
  resolveColorScheme,
  setStoredColorScheme,
  THEME_STORAGE_KEY,
} from "./theme"
import { initColorScheme } from "./theme-init"

// Utility function to mock prefers-color-scheme
const withPrefersColorScheme = (
  scheme: "light" | "dark",
  testFn: () => void | Promise<void>,
) => {
  return () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = (query: string) => ({
      matches: scheme === "dark" ? query.includes("dark") : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    })

    try {
      const result = testFn()
      if (result instanceof Promise) {
        return result.finally(() => {
          window.matchMedia = originalMatchMedia
        })
      }
    } finally {
      window.matchMedia = originalMatchMedia
    }
  }
}

describe("theme helper functions", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove("dark")
  })

  describe("getSystemColorScheme", () => {
    it(
      "prefers-color-scheme: darkがtrueの場合、darkを返す",
      withPrefersColorScheme("dark", () => {
        expect(getSystemColorScheme()).toBe("dark")
      }),
    )

    it(
      "prefers-color-scheme: darkがfalseの場合、lightを返す",
      withPrefersColorScheme("light", () => {
        expect(getSystemColorScheme()).toBe("light")
      }),
    )
  })

  describe("getStoredColorScheme", () => {
    it("localStorageにlightが保存されている場合、lightを返す", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "light")
      expect(getStoredColorScheme()).toBe("light")
    })

    it("localStorageにdarkが保存されている場合、darkを返す", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
      expect(getStoredColorScheme()).toBe("dark")
    })

    it("localStorageにautoが保存されている場合、autoを返す", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "auto")
      expect(getStoredColorScheme()).toBe("auto")
    })

    it("localStorageに無効な値が保存されている場合、nullを返す", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "invalid")
      expect(getStoredColorScheme()).toBeNull()
    })

    it("localStorageが空の場合、nullを返す", () => {
      expect(getStoredColorScheme()).toBeNull()
    })
  })

  describe("setStoredColorScheme", () => {
    it("lightをlocalStorageに保存する", () => {
      setStoredColorScheme("light")
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    })

    it("darkをlocalStorageに保存する", () => {
      setStoredColorScheme("dark")
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    })

    it("autoをlocalStorageに保存する", () => {
      setStoredColorScheme("auto")
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto")
    })
  })

  describe("resolveColorScheme", () => {
    it("lightが渡された場合、lightを返す", () => {
      expect(resolveColorScheme("light")).toBe("light")
    })

    it("darkが渡された場合、darkを返す", () => {
      expect(resolveColorScheme("dark")).toBe("dark")
    })

    it(
      "autoが渡された場合、システムの設定に基づいた値を返す（dark）",
      withPrefersColorScheme("dark", () => {
        expect(resolveColorScheme("auto")).toBe("dark")
      }),
    )

    it(
      "autoが渡された場合、システムの設定に基づいた値を返す（light）",
      withPrefersColorScheme("light", () => {
        expect(resolveColorScheme("auto")).toBe("light")
      }),
    )
  })

  describe("applyColorScheme", () => {
    it("darkが渡された場合、htmlタグにdarkクラスを追加する", () => {
      applyColorScheme("dark")
      expect(document.documentElement.classList.contains("dark")).toBe(true)
    })

    it("lightが渡された場合、htmlタグからdarkクラスを削除する", () => {
      // First add dark class
      document.documentElement.classList.add("dark")
      expect(document.documentElement.classList.contains("dark")).toBe(true)

      // Then apply light
      applyColorScheme("light")
      expect(document.documentElement.classList.contains("dark")).toBe(false)
    })

    it("darkからlightに切り替えた場合、darkクラスが削除される", () => {
      applyColorScheme("dark")
      expect(document.documentElement.classList.contains("dark")).toBe(true)

      applyColorScheme("light")
      expect(document.documentElement.classList.contains("dark")).toBe(false)
    })
  })

  describe("initColorScheme", () => {
    it("localStorageにdarkが保存されている場合、そのまま適用する", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
      initColorScheme()
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
      expect(document.documentElement.classList.contains("dark")).toBe(true)
    })

    it("localStorageにlightが保存されている場合、darkクラスを外す", () => {
      document.documentElement.classList.add("dark")
      window.localStorage.setItem(THEME_STORAGE_KEY, "light")
      initColorScheme()
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
      expect(document.documentElement.classList.contains("dark")).toBe(false)
    })

    it(
      "localStorageにautoが保存されている場合、システム設定に合わせて適用する",
      withPrefersColorScheme("dark", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "auto")
        initColorScheme()
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto")
        expect(document.documentElement.classList.contains("dark")).toBe(true)
      }),
    )

    it(
      "localStorageが空の場合、自動的にautoを保存しシステム設定を適用する",
      withPrefersColorScheme("dark", () => {
        initColorScheme()
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto")
        expect(document.documentElement.classList.contains("dark")).toBe(true)
      }),
    )

    it(
      "localStorageに無効な値がある場合、autoにリセットしてシステム設定を適用する",
      withPrefersColorScheme("light", () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, "unknown")
        initColorScheme()
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("auto")
        expect(document.documentElement.classList.contains("dark")).toBe(false)
      }),
    )
  })

  describe("統合シナリオ", () => {
    it(
      "初回訪問時（localStorage未設定）からdarkテーマを設定するフロー",
      withPrefersColorScheme("light", () => {
        // 1. 初回訪問時はlocalStorageが空
        expect(getStoredColorScheme()).toBeNull()

        // 2. システム設定を取得（light）
        const systemScheme = getSystemColorScheme()
        expect(systemScheme).toBe("light")

        // 3. ユーザーがdarkを選択
        setStoredColorScheme("dark")
        const resolved = resolveColorScheme("dark")
        applyColorScheme(resolved)

        // 4. 検証
        expect(getStoredColorScheme()).toBe("dark")
        expect(resolved).toBe("dark")
        expect(document.documentElement.classList.contains("dark")).toBe(true)
      }),
    )

    it(
      "auto設定でシステムがdarkの場合のフロー",
      withPrefersColorScheme("dark", () => {
        // 1. autoを設定
        setStoredColorScheme("auto")

        // 2. 解決してdarkになることを確認
        const stored = getStoredColorScheme()
        expect(stored).toBe("auto")

        const resolved = resolveColorScheme(stored ?? "auto")
        expect(resolved).toBe("dark")

        // 3. 適用
        applyColorScheme(resolved)
        expect(document.documentElement.classList.contains("dark")).toBe(true)
      }),
    )

    it(
      "light → auto → darkの切り替えフロー",
      withPrefersColorScheme("dark", () => {
        // 1. lightを設定
        setStoredColorScheme("light")
        applyColorScheme(resolveColorScheme("light"))
        expect(getStoredColorScheme()).toBe("light")
        expect(document.documentElement.classList.contains("dark")).toBe(false)

        // 2. autoに変更（システムはdark）
        setStoredColorScheme("auto")
        applyColorScheme(resolveColorScheme("auto"))
        expect(getStoredColorScheme()).toBe("auto")
        expect(document.documentElement.classList.contains("dark")).toBe(true)

        // 3. darkに明示的に変更
        setStoredColorScheme("dark")
        applyColorScheme(resolveColorScheme("dark"))
        expect(getStoredColorScheme()).toBe("dark")
        expect(document.documentElement.classList.contains("dark")).toBe(true)
      }),
    )
  })
})
