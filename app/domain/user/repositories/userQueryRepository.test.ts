import { describe, expect, it } from "bun:test"
import type { DbClient } from "../../../infrastructure/db/client"
import type { User } from "../entities/user"
import {
  type FindUserById,
  type FindUserByOidcSub,
  findUserById,
  findUserByOidcSub,
} from "./userQueryRepository"

const mockUser: User = {
  id: "test-id-123",
  oidcSub: "auth0|123456789",
  email: "test@example.com",
  name: "Test User",
  role: "staff",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}

describe("findUserById", () => {
  const mockDbClient = {} as DbClient

  it("存在するユーザーをIDで取得できる", async () => {
    const mockImpl: FindUserById = async ({ user }) => 
      user.id === mockUser.id ? mockUser : null

    const result = await findUserById({
      user: { id: "test-id-123" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(result).not.toBeNull()
    expect(result?.id).toBe(mockUser.id)
    expect(result?.email).toBe(mockUser.email)
  })

  it("存在しないIDならnullを返す", async () => {
    const mockImpl: FindUserById = async () => null

    const result = await findUserById({
      user: { id: "non-existent" },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(result).toBeNull()
  })
})

describe("findUserByOidcSub", () => {
  const mockDbClient = {} as DbClient

  it("存在するユーザーをOIDC Subjectで取得できる", async () => {
    const mockImpl: FindUserByOidcSub = async ({ oidcSub }) =>
      oidcSub === mockUser.oidcSub ? mockUser : null

    const result = await findUserByOidcSub({
      oidcSub: "auth0|123456789",
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(result).not.toBeNull()
    expect(result?.id).toBe(mockUser.id)
    expect(result?.oidcSub).toBe(mockUser.oidcSub)
  })

  it("存在しないOIDC Subjectならnullを返す", async () => {
    const mockImpl: FindUserByOidcSub = async () => null

    const result = await findUserByOidcSub({
      oidcSub: "non-existent",
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(result).toBeNull()
  })

  it("異なるプロバイダーのOIDC Subjectでも取得できる", async () => {
    const googleUser: User = {
      ...mockUser,
      id: "google-user-id",
      oidcSub: "google-oauth2|987654321",
    }

    const mockImpl: FindUserByOidcSub = async ({ oidcSub }) => {
      if (oidcSub === mockUser.oidcSub) return mockUser
      if (oidcSub === googleUser.oidcSub) return googleUser
      return null
    }

    const result = await findUserByOidcSub({
      oidcSub: "google-oauth2|987654321",
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })

    expect(result).not.toBeNull()
    expect(result?.oidcSub).toBe(googleUser.oidcSub)
  })
})
