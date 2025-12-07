import type { DbClient, TransactionDbClient } from "../libs/db/client"

/**
 * 単数の要素を取得するQuery系リポジトリ関数の型定義。
 * DB参照系のRepository関数はこの型を継承して定義する。
 * @template P paramsの型
 * @template R 戻り値の型
 * @example
 * type FindById = QueryRepositoryFunction<{ id: number }, Product | null>
 * type FindAll = QueryRepositoryFunction<unknown, Product[]>
 */
export type QueryRepositoryFunction<P, R> = (
  params: P & { dbClient: DbClient | TransactionDbClient },
) => Promise<R>

/**
 * 複数の要素を取得するQuery系リポジトリ関数の型定義。
 * DB参照系のRepository関数はこの型を継承して定義する。
 * Paginationのためのパラメータが自動的に追加される。
 * @template P paramsの型
 * @template T 戻り値の型
 * @example
 * type FindAllProducts = PaginatedQueryRepositoryFunction<unknown, Product>
 */
export type PaginatedQueryRepositoryFunction<P, T> = (
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
 * type DeleteAll = CommandRepositoryFunction<unknown, void>
 */
export type CommandRepositoryFunction<P, R> = (
  params: P & { dbClient: TransactionDbClient },
) => Promise<R>

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
