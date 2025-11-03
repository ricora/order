import {
  findUserByIdImpl,
  findUserByOidcSubImpl,
} from "../../../infrastructure/domain/user/userQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type { User } from "../entities/user"

export type FindUserById = QueryRepositoryFunction<
  { user: Pick<User, "id"> },
  User | null
>

export type FindUserByOidcSub = QueryRepositoryFunction<
  { oidcSub: string },
  User | null
>

export const findUserById: WithRepositoryImpl<FindUserById> = async ({
  user,
  repositoryImpl = findUserByIdImpl,
  dbClient,
}) => {
  return repositoryImpl({ user, dbClient })
}

export const findUserByOidcSub: WithRepositoryImpl<FindUserByOidcSub> = async ({
  oidcSub,
  repositoryImpl = findUserByOidcSubImpl,
  dbClient,
}) => {
  return repositoryImpl({ oidcSub, dbClient })
}
