import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"

/**
 * リポジトリ関数の型定義に、実装関数（repositoryImpl）をparamsオブジェクトとして追加するユーティリティ型。
 * ドメイン層でリポジトリ関数のDI（依存性注入）を行う際に利用する。
 * 引数がない関数の場合は空オブジェクト型（Record<string, never>）となる。
 * @template T リポジトリ関数の型
 * @example
 * type FindById = (params: { id: number }) => Promise<Product | null>
 * const findById: WithRepositoryImpl<FindById> = async ({ id, repositoryImpl }) => repositoryImpl({ id })
 */
// biome-ignore lint/suspicious/noExplicitAny: For flexible generic types.
export type WithRepositoryImpl<T extends (...args: any) => any> =
  Parameters<T> extends [infer P]
    ? (params: P & { repositoryImpl?: T }) => ReturnType<T>
    : (params: { repositoryImpl?: T }) => ReturnType<T>

/**
 * Query系リポジトリ関数の型定義。
 * DB参照系のRepository関数はこの型を継承して定義する。
 * @template P paramsの型
 * @template R 戻り値の型
 * @example
 * type FindById = QueryRepositoryFunction<{ id: number }, Product | null>
 * type FindAll = QueryRepositoryFunction<Record<string, never>, Product[]>
 */
export type QueryRepositoryFunction<P, R> = [P] extends [Record<string, never>]
  ? (params: { dbClient: DbClient | TransactionDbClient }) => Promise<R>
  : (params: P & { dbClient: DbClient | TransactionDbClient }) => Promise<R>

/**
 * Command系リポジトリ関数の型定義。
 * DB更新系のRepository関数はこの型を継承して定義する。
 * @template P paramsの型
 * @template R 戻り値の型
 * @example
 * type CreateProduct = CommandRepositoryFunction<Omit<Product, "id">, Product | null>
 * type DeleteAll = CommandRepositoryFunction<Record<string, never>, void>
 */
export type CommandRepositoryFunction<P, R> = [P] extends [
  Record<string, never>,
]
  ? (params: { dbClient: TransactionDbClient }) => Promise<R>
  : (params: P & { dbClient: TransactionDbClient }) => Promise<R>
