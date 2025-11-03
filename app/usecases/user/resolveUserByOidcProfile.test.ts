import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type { DbClient, TransactionDbClient } from "../../infrastructure/db/client"
import type { User } from "../../domain/user/entities/user"
import * as userQueryRepository from "../../domain/user/repositories/userQueryRepository"
import * as userCommandRepository from "../../domain/user/repositories/userCommandRepository"
import { resolveUserByOidcProfile, determineInitialRole } from "./resolveUserByOidcProfile"

const mockUser: User = {
  id: "test-id-123",
  oidcSub: "auth0|123456789",
  email: "test@example.com",
  name: "Test User",
  role: "viewer",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

describe("resolveUserByOidcProfile", () => {
  let findUserByOidcSubSpy: ReturnType<typeof spyOn>
  let createUserSpy: ReturnType<typeof spyOn>
  let updateUserSpy: ReturnType<typeof spyOn>
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    // トランザクションのモック設定
    txMock = {} as TransactionDbClient
    const transactionHolder = {
      async transaction<T>(callback: (tx: TransactionDbClient) => Promise<T>) {
        return callback(txMock)
      },
    }
    dbClient = transactionHolder as unknown as DbClient

    transactionSpy = spyOn(transactionHolder, "transaction").mockImplementation(
      async <T>(callback: (tx: TransactionDbClient) => Promise<T>) =>
        callback(txMock),
    )

    // リポジトリ関数のスパイ設定
    findUserByOidcSubSpy = spyOn(
      userQueryRepository,
      "findUserByOidcSub",
    )
    createUserSpy = spyOn(
      userCommandRepository,
      "createUser",
    )
    updateUserSpy = spyOn(
      userCommandRepository,
      "updateUser",
    )
  })

  afterEach(() => {
    mock.restore()
  })

  it("既存ユーザーが存在する場合はそのユーザーを返す", async () => {
    findUserByOidcSubSpy.mockImplementation(async () => mockUser)

    const result = await resolveUserByOidcProfile({
      oidcSub: mockUser.oidcSub,
      email: mockUser.email,
      name: mockUser.name ?? undefined,
      dbClient,
    })

    expect(result.user).toEqual(mockUser)
    expect(result.isNewUser).toBe(false)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findUserByOidcSubSpy).toHaveBeenCalledTimes(1)
    expect(findUserByOidcSubSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        oidcSub: mockUser.oidcSub,
        dbClient: txMock,
      })
    )
    expect(createUserSpy).not.toHaveBeenCalled()
    expect(updateUserSpy).not.toHaveBeenCalled()
  })

  it("既存ユーザーのメールアドレスが変更されている場合は更新する", async () => {
    findUserByOidcSubSpy.mockImplementation(async () => mockUser)
    const updatedUser = { ...mockUser, email: "new@example.com" }
    updateUserSpy.mockImplementation(async () => updatedUser)

    const result = await resolveUserByOidcProfile({
      oidcSub: mockUser.oidcSub,
      email: "new@example.com",
      name: mockUser.name ?? undefined,
      dbClient,
    })

    expect(result.user.email).toBe("new@example.com")
    expect(result.isNewUser).toBe(false)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findUserByOidcSubSpy).toHaveBeenCalledTimes(1)
    expect(updateUserSpy).toHaveBeenCalledTimes(1)
    expect(updateUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dbClient: txMock,
      })
    )
    expect(createUserSpy).not.toHaveBeenCalled()
  })

  it("既存ユーザーの名前が変更されている場合は更新する", async () => {
    findUserByOidcSubSpy.mockImplementation(async () => mockUser)
    const updatedUser = { ...mockUser, name: "Updated Name" }
    updateUserSpy.mockImplementation(async () => updatedUser)

    const result = await resolveUserByOidcProfile({
      oidcSub: mockUser.oidcSub,
      email: mockUser.email,
      name: "Updated Name",
      dbClient,
    })

    expect(result.user.name).toBe("Updated Name")
    expect(result.isNewUser).toBe(false)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(updateUserSpy).toHaveBeenCalledTimes(1)
  })

  it("新規ユーザーの場合は作成する", async () => {
    findUserByOidcSubSpy.mockImplementation(async () => null)
    const newUser = {
      ...mockUser,
      id: "new-id-456",
      oidcSub: "google-oauth2|987654321",
      email: "newuser@example.com",
    }
    createUserSpy.mockImplementation(async () => newUser)

    const result = await resolveUserByOidcProfile({
      oidcSub: "google-oauth2|987654321",
      email: "newuser@example.com",
      name: "New User",
      dbClient,
    })

    expect(result.user.email).toBe("newuser@example.com")
    expect(result.isNewUser).toBe(true)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findUserByOidcSubSpy).toHaveBeenCalledTimes(1)
    expect(createUserSpy).toHaveBeenCalledTimes(1)
    expect(createUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dbClient: txMock,
      })
    )
    expect(updateUserSpy).not.toHaveBeenCalled()
  })

  it("名前がundefinedの場合はnullとして扱う", async () => {
    findUserByOidcSubSpy.mockImplementation(async () => null)
    createUserSpy.mockImplementation(async ({ user }) => ({
      ...user,
      id: "new-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await resolveUserByOidcProfile({
      oidcSub: "auth0|new",
      email: "test@example.com",
      dbClient,
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(createUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          name: null,
        }),
        dbClient: txMock,
      })
    )
  })
})

describe("determineInitialRole", () => {
  it("常にviewerロールを返す", () => {
    expect(determineInitialRole()).toBe("viewer")
  })
})
