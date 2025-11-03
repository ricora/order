import { eq } from "drizzle-orm"
import type {
  CreateUser,
  UpdateUser,
} from "../../../domain/user/repositories/userCommandRepository"
import { generateId } from "../../../utils/id"
import { userTable } from "../../db/schema"

export const createUserImpl: CreateUser = async ({ user, dbClient }) => {
  const id = generateId()
  const now = new Date()

  const newUser = {
    id,
    oidcSub: user.oidcSub,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: now,
    updatedAt: now,
  }

  await dbClient.insert(userTable).values(newUser)

  return newUser
}

export const updateUserImpl: UpdateUser = async ({ user, dbClient }) => {
  const now = new Date()

  const [updatedUser] = await dbClient
    .update(userTable)
    .set({
      email: user.email,
      name: user.name,
      role: user.role,
      updatedAt: now,
    })
    .where(eq(userTable.id, user.id))
    .returning()

  return (
    updatedUser || {
      ...user,
      createdAt: now,
      updatedAt: now,
    }
  )
}
