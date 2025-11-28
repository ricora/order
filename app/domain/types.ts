import type { DbClient, TransactionDbClient } from "../libs/db/client"

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
 * 単数の要素を取得するQuery系リポジトリ関数の型定義。
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
 * 複数の要素を取得するQuery系リポジトリ関数の型定義。
 * DB参照系のRepository関数はこの型を継承して定義する。
 * Paginationのためのパラメータが自動的に追加される。
 * @template P paramsの型
 * @template T 戻り値の型
 * @example
 * type FindAllProducts = PaginatedQueryRepositoryFunction<Record<string, never>, Product>
 */
export type PaginatedQueryRepositoryFunction<P, T> = [P] extends [
  Record<string, never>,
]
  ? (params: {
      pagination: PaginationParams
      dbClient: DbClient | TransactionDbClient
    }) => Promise<T[]>
  : (
      params: P & {
        pagination: PaginationParams
        dbClient: DbClient | TransactionDbClient
      },
    ) => Promise<T[]>

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

/**
 * ページネーション用パラメータ型。
 * Query系リポジトリ関数で一括取得時に使用する。
 * @example
 * type FindAllProducts = PaginatedQueryRepositoryFunction<{ pagination: PaginationParams }, Product[]>
 */
type PaginationParams = {
  /**
   * 取得を開始するオフセット（0-indexed）。
   */
  offset: number
  /**
   * 取得する件数の上限。
   */
  limit: number
}
