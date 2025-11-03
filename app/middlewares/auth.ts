import {
  getAuth,
  initOidcAuthMiddleware,
  processOAuthCallback,
  revokeSession,
} from "@hono/oidc-auth"
import { createMiddleware } from "hono/factory"
import type { User, UserRole } from "../domain/user/entities/user"
import { resolveUserByOidcProfile } from "../usecases/user/resolveUserByOidcProfile"

// Honoの型拡張
declare module "hono" {
  interface ContextVariableMap {
    user?: User
    isAuthenticated: boolean
  }

  interface OidcAuthClaims {
    sub: string
    email: string
    name?: string
  }
}

/**
 * OIDC認証ミドルウェア設定
 */
export const oidcAuthMiddleware = initOidcAuthMiddleware({
  OIDC_AUTH_SECRET: process.env.OIDC_AUTH_SECRET || "",
  OIDC_ISSUER: process.env.OIDC_ISSUER || "",
  OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || "",
  OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET || "",
  OIDC_REDIRECT_URI: process.env.OIDC_REDIRECT_URI || "/auth/callback",
  OIDC_SCOPES: process.env.OIDC_SCOPES || "openid email profile",
  OIDC_COOKIE_NAME: process.env.OIDC_COOKIE_NAME || "auth-session",
  OIDC_COOKIE_PATH: process.env.OIDC_COOKIE_PATH || "/",
  OIDC_AUTH_EXPIRES: process.env.OIDC_AUTH_EXPIRES
    ? String(Number.parseInt(process.env.OIDC_AUTH_EXPIRES, 10))
    : String(60 * 60 * 24), // 1 day
  OIDC_AUTH_REFRESH_INTERVAL: process.env.OIDC_AUTH_REFRESH_INTERVAL || "900", // 15 minutes
})

/**
 * ユーザー情報をContextに設定するミドルウェア
 */
export const setUserMiddleware = createMiddleware(async (c, next) => {
  const auth = await getAuth(c)

  if (auth) {
    try {
      const dbClient = c.get("dbClient")
      const { user } = await resolveUserByOidcProfile({
        oidcSub: auth.sub,
        email: auth.email,
        name: auth.name,
        dbClient,
      })

      c.set("user", user)
      c.set("isAuthenticated", true)
    } catch (error) {
      console.error("Failed to resolve user by OIDC profile:", error)
      c.set("isAuthenticated", false)
    }
  } else {
    c.set("isAuthenticated", false)
  }

  await next()
})

/**
 * 認証が必須のルート用ミドルウェア
 */
export const requireAuth = createMiddleware(async (c, next) => {
  if (!c.get("isAuthenticated")) {
    // OIDCミドルウェアが自動的にログインページへリダイレクト
    return c.text("Unauthorized", 401)
  }
  await next()
})

/**
 * 特定のロールが必要なルート用ミドルウェア
 * @param roles 必要なロールの配列
 */
export const requireRole = (roles: UserRole[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user")

    if (!user) {
      return c.text("Unauthorized", 401)
    }

    if (!roles.includes(user.role)) {
      return c.text("Forbidden", 403)
    }

    await next()
  })

/**
 * 現在のユーザー情報を取得するヘルパー関数
 */
export const getCurrentUser = (c: {
  get: (key: "user") => User | undefined
}): User | undefined => {
  return c.get("user")
}

/**
 * 認証状態を確認するヘルパー関数
 */
export const isAuthenticated = (c: {
  get: (key: "isAuthenticated") => boolean | undefined
}): boolean => {
  return c.get("isAuthenticated") || false
}

// @hono/oidc-authのヘルパー関数をエクスポート
export { processOAuthCallback, revokeSession }
