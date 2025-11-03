import { describe, expect, it } from "bun:test"
import type { TransactionDbClient } from "../../../infrastructure/db/client"
import type { User, UserRole } from "../entities/user"
import {
  type CreateUser,
  createUser,
  type UpdateUser,
  updateUser,
} from "./userCommandRepository"

const validUser: Omit<User, "id" | "createdAt" | "updatedAt"> = {
  oidcSub: "auth0|123456789",
  email: "test@example.com",
  name: "Test User",
  role: "staff" as UserRole,
}

describe("createUser", () => {
  const mockDbClient = {} as TransactionDbClient

  it("バリデーションを通過したユーザーを作成できる", async () => {
    const mockImpl: CreateUser = async ({ user }) => ({
      ...user,
      id: "test-id-123",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    })
    
    const result = await createUser({
      user: validUser,
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    
    expect(result).not.toBeNull()
    expect(result.email).toBe(validUser.email)
    expect(result.oidcSub).toBe(validUser.oidcSub)
    expect(result.role).toBe(validUser.role)
  })

  it("OIDC Subjectが空の場合はエラーを返す", async () => {
    await expect(
      createUser({
        user: { ...validUser, oidcSub: "" },
        repositoryImpl: async () => ({} as User),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("OIDC Subjectは必須です")
  })

  it("無効なメールアドレスの場合はエラーを返す", async () => {
    await expect(
      createUser({
        user: { ...validUser, email: "invalid-email" },
        repositoryImpl: async () => ({} as User),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("有効なメールアドレスを入力してください")
  })

  it("メールアドレスが空の場合はエラーを返す", async () => {
    await expect(
      createUser({
        user: { ...validUser, email: "" },
        repositoryImpl: async () => ({} as User),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("有効なメールアドレスを入力してください")
  })

  it("無効なロールの場合はエラーを返す", async () => {
    await expect(
      createUser({
        user: { ...validUser, role: "invalid" as UserRole },
        repositoryImpl: async () => ({} as User),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("無効なロールです")
  })

  it("nameがnullでも作成できる", async () => {
    const mockImpl: CreateUser = async ({ user }) => ({
      ...user,
      id: "test-id-123",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    })
    
    const result = await createUser({
      user: { ...validUser, name: null },
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    
    expect(result).not.toBeNull()
    expect(result.name).toBeNull()
  })
})

describe("updateUser", () => {
  const mockDbClient = {} as TransactionDbClient

  it("バリデーションを通過したユーザーを更新できる", async () => {
    const existingUser: Omit<User, "createdAt"> = {
      ...validUser,
      id: "existing-id",
      updatedAt: new Date("2025-01-02"),
    }

    const mockImpl: UpdateUser = async ({ user }) => ({
      ...user,
      createdAt: new Date("2025-01-01"),
    })
    
    const result = await updateUser({
      user: existingUser,
      repositoryImpl: mockImpl,
      dbClient: mockDbClient,
    })
    
    expect(result).not.toBeNull()
    expect(result.id).toBe(existingUser.id)
    expect(result.email).toBe(existingUser.email)
  })

  it("無効なメールアドレスで更新しようとするとエラーを返す", async () => {
    await expect(
      updateUser({
        user: {
          ...validUser,
          id: "test-id",
          email: "not-an-email",
          updatedAt: new Date(),
        },
        repositoryImpl: async () => ({} as User),
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("有効なメールアドレスを入力してください")
  })
})
