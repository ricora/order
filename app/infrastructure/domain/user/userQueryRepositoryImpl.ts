import { eq } from "drizzle-orm"
import type { User } from "../../../domain/user/entities/user"
import type {
  FindUserById,
  FindUserByOidcSub,
} from "../../../domain/user/repositories/userQueryRepository"
import { userTable } from "../../db/schema"

export const findUserByIdImpl: FindUserById = async ({ user, dbClient }) => {
  const results = await dbClient
    .select()
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1)

  const result = results[0]
  if (!result) {
    return null
  }

  return {
    id: result.id,
    oidcSub: result.oidcSub,
    email: result.email,
    name: result.name,
    role: result.role as User["role"],
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export const findUserByOidcSubImpl: FindUserByOidcSub = async ({
  oidcSub,
  dbClient,
}) => {
  const results = await dbClient
    .select()
    .from(userTable)
    .where(eq(userTable.oidcSub, oidcSub))
    .limit(1)

  const result = results[0]
  if (!result) {
    return null
  }

  return {
    id: result.id,
    oidcSub: result.oidcSub,
    email: result.email,
    name: result.name,
    role: result.role as User["role"],
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}
