import { describe, expect, it, beforeEach, afterEach, mock, spyOn } from "bun:test"
import { Hono } from "hono"
import type { User } from "../domain/user/entities/user"
import type { DbClient } from "../infrastructure/db/client"
import * as oidcAuth from "@hono/oidc-auth"
import * as resolveUserModule from "../usecases/user/resolveUserByOidcProfile"
import { setUserMiddleware, requireAuth, requireRole, getCurrentUser, isAuthenticated } from "./auth"

const mockUser: User = {
  id: "test-id-123",
  oidcSub: "auth0|123456789",
  email: "test@example.com",
  name: "Test User",
  role: "staff",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}

describe("setUserMiddleware", () => {
  let getAuthSpy: ReturnType<typeof spyOn>
  let findOrCreateUserSpy: ReturnType<typeof spyOn>
  const mockDbClient = {} as DbClient
  
  beforeEach(() => {
    getAuthSpy = spyOn(oidcAuth, "getAuth")
    findOrCreateUserSpy = spyOn(
      resolveUserModule,
      "resolveUserByOidcProfile",
    )
  })

  afterEach(() => {
    mock.restore()
  })

  it("認証済みユーザーの情報をContextに設定する", async () => {
    const app = new Hono()
    
    getAuthSpy.mockImplementation(async () => ({
      sub: mockUser.oidcSub,
      email: mockUser.email,
      name: mockUser.name,
    }))
    
    findOrCreateUserSpy.mockImplementation(async () => ({
      user: mockUser,
      isNewUser: false,
    }))

    app.use("*", async (c, next) => {
      c.set("dbClient", mockDbClient)
      await next()
    })
    app.use("*", setUserMiddleware)
    app.get("/", (c) => {
      const user = c.get("user")
      const isAuth = c.get("isAuthenticated")
      return c.json({ user, isAuthenticated: isAuth })
    })

    const res = await app.request("/")
    const json = await res.json()
    
    expect(json.isAuthenticated).toBe(true)
    expect(json.user).toEqual(mockUser)
  })

  it("未認証の場合はisAuthenticatedがfalseになる", async () => {
    const app = new Hono()
    
    getAuthSpy.mockImplementation(async () => null)

    app.use("*", async (c, next) => {
      c.set("dbClient", mockDbClient)
      await next()
    })
    app.use("*", setUserMiddleware)
    app.get("/", (c) => {
      const user = c.get("user")
      const isAuth = c.get("isAuthenticated")
      return c.json({ user, isAuthenticated: isAuth })
    })

    const res = await app.request("/")
    const json = await res.json()
    
    expect(json.isAuthenticated).toBe(false)
    expect(json.user).toBeUndefined()
  })

  it("ユーザー作成/取得でエラーが発生した場合はisAuthenticatedがfalseになる", async () => {
    const app = new Hono()
    
    getAuthSpy.mockImplementation(async () => ({
      sub: "error-user",
      email: "error@example.com",
      name: "Error User",
    }))
    
    findOrCreateUserSpy.mockImplementation(async () => {
      throw new Error("Database error")
    })

    const consoleSpy = spyOn(console, "error").mockImplementation(() => {})

    app.use("*", async (c, next) => {
      c.set("dbClient", mockDbClient)
      await next()
    })
    app.use("*", setUserMiddleware)
    app.get("/", (c) => {
      const isAuth = c.get("isAuthenticated")
      return c.json({ isAuthenticated: isAuth })
    })

    const res = await app.request("/")
    const json = await res.json()
    
    expect(json.isAuthenticated).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
  })
})

describe("requireAuth", () => {
  it("認証済みユーザーは次の処理へ進める", async () => {
    const app = new Hono()
    
    app.use("*", async (c, next) => {
      c.set("isAuthenticated", true)
      c.set("user", mockUser)
      await next()
    })
    app.use("*", requireAuth)
    app.get("/", (c) => c.text("OK"))

    const res = await app.request("/")
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("OK")
  })

  it("未認証ユーザーは401エラーになる", async () => {
    const app = new Hono()
    
    app.use("*", async (c, next) => {
      c.set("isAuthenticated", false)
      await next()
    })
    app.use("*", requireAuth)
    app.get("/", (c) => c.text("OK"))

    const res = await app.request("/")
    expect(res.status).toBe(401)
    expect(await res.text()).toBe("Unauthorized")
  })
})

describe("requireRole", () => {
  it("必要なロールを持つユーザーは次の処理へ進める", async () => {
    const app = new Hono()
    
    app.use("*", async (c, next) => {
      c.set("user", mockUser)
      await next()
    })
    app.use("*", requireRole(["staff", "admin"]))
    app.get("/", (c) => c.text("OK"))

    const res = await app.request("/")
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("OK")
  })

  it("必要なロールを持たないユーザーは403エラーになる", async () => {
    const app = new Hono()
    const viewerUser: User = { ...mockUser, role: "viewer" }
    
    app.use("*", async (c, next) => {
      c.set("user", viewerUser)
      await next()
    })
    app.use("*", requireRole(["staff", "admin"]))
    app.get("/", (c) => c.text("OK"))

    const res = await app.request("/")
    expect(res.status).toBe(403)
    expect(await res.text()).toBe("Forbidden")
  })

  it("ユーザー情報がない場合は401エラーになる", async () => {
    const app = new Hono()
    
    app.use("*", requireRole(["staff"]))
    app.get("/", (c) => c.text("OK"))

    const res = await app.request("/")
    expect(res.status).toBe(401)
    expect(await res.text()).toBe("Unauthorized")
  })

  it("adminロールはadmin専用ルートにアクセスできる", async () => {
    const app = new Hono()
    const adminUser: User = { ...mockUser, role: "admin" }
    
    app.use("*", async (c, next) => {
      c.set("user", adminUser)
      await next()
    })
    app.use("*", requireRole(["admin"]))
    app.get("/", (c) => c.text("Admin only"))

    const res = await app.request("/")
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("Admin only")
  })
})

describe("Helper functions", () => {
  type MockContext = {
    get: <K extends string>(key: K) => K extends 'user' ? User | undefined : K extends 'isAuthenticated' ? boolean | undefined : undefined
  }

  it("getCurrentUserは現在のユーザーを返す", () => {
    const mockContext: MockContext = {
      get: (key) => key === "user" ? mockUser : undefined
    }
    
    const user = getCurrentUser(mockContext as Parameters<typeof getCurrentUser>[0])
    expect(user).toEqual(mockUser)
  })

  it("getCurrentUserはユーザーがいない場合undefinedを返す", () => {
    const mockContext: MockContext = {
      get: () => undefined
    }
    
    const user = getCurrentUser(mockContext as Parameters<typeof getCurrentUser>[0])
    expect(user).toBeUndefined()
  })

  it("isAuthenticatedは認証状態を返す", () => {
    const mockContext = {
      get: (key: 'isAuthenticated') => true as boolean | undefined
    }
    
    expect(isAuthenticated(mockContext)).toBe(true)
  })

  it("isAuthenticatedは未設定の場合falseを返す", () => {
    const mockContext = {
      get: (key: 'isAuthenticated') => undefined
    }
    
    expect(isAuthenticated(mockContext)).toBe(false)
  })
})
