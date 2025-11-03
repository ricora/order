import {
  createUserImpl,
  updateUserImpl,
} from "../../../infrastructure/domain/user/userCommandRepositoryImpl"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import type { User, UserRole } from "../entities/user"

const validateUser = (user: Omit<User, "id" | "createdAt" | "updatedAt">) => {
  if (!user.oidcSub || user.oidcSub.trim() === "") {
    throw new Error("OIDC Subjectは必須です")
  }

  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new Error("有効なメールアドレスを入力してください")
  }

  const validRoles: UserRole[] = ["admin", "staff", "viewer"]
  if (!validRoles.includes(user.role)) {
    throw new Error("無効なロールです")
  }
}

export type CreateUser = CommandRepositoryFunction<
  { user: Omit<User, "id" | "createdAt" | "updatedAt"> },
  User
>

export type UpdateUser = CommandRepositoryFunction<
  { user: Omit<User, "createdAt"> },
  User
>

export const createUser: WithRepositoryImpl<CreateUser> = async ({
  repositoryImpl = createUserImpl,
  dbClient,
  user,
}) => {
  validateUser(user)
  return repositoryImpl({ user, dbClient })
}

export const updateUser: WithRepositoryImpl<UpdateUser> = async ({
  repositoryImpl = updateUserImpl,
  dbClient,
  user,
}) => {
  validateUser(user)
  return repositoryImpl({ user, dbClient })
}
