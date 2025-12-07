import type { DbClient, TransactionDbClient } from "../libs/db/client"

/**
 * 単数の要素を取得するQuery系リポジトリ関数の型定義。
 * DB参照系のRepository関数はこの型を継承して定義する。
 * @template P paramsの型
 * @template R 戻り値の型
 * @example
 * type FindById = QueryRepositoryFunction<{ id: number }, Product | null, 'not found' | 'unauthorized'>
 * type FindAll = QueryRepositoryFunction<unknown, Product[]>
 */
export type QueryRepositoryFunction<P, R, E extends string> = (
  params: P & { dbClient: DbClient | TransactionDbClient },
) => Promise<Result<R, E>>

/**
 * 複数の要素を取得するQuery系リポジトリ関数の型定義。
 * DB参照系のRepository関数はこの型を継承して定義する。
 * Paginationのためのパラメータが自動的に追加される。
 * @template P paramsの型
 * @template T 戻り値の型
 * @example
 * type FindAllProducts = PaginatedQueryRepositoryFunction<unknown, Product, 'not found' | 'unauthorized'>
 */
export type PaginatedQueryRepositoryFunction<P, T, E extends string> = (
  params: P & {
    pagination: PaginationParams
    dbClient: DbClient | TransactionDbClient
  },
) => Promise<Result<T[], E>>

/**
 * Command系リポジトリ関数の型定義。
 * DB更新系のRepository関数はこの型を継承して定義する。
 * @template P paramsの型
 * @template R 戻り値の型
 * @example
 * type CreateProduct = CommandRepositoryFunction<Omit<Product, "id">, Product | null, 'validation error' | 'unauthorized'>
 * type DeleteAll = CommandRepositoryFunction<unknown, void>
 */
export type CommandRepositoryFunction<P, R, E extends string> = (
  params: P & { dbClient: TransactionDbClient },
) => Promise<Result<R, E>>

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

type Success<T> = {
  ok: true
  value: T
}

type Failure<E extends string> = {
  ok: false
  message: E
}

type UnexpectedError = Failure<"エラーが発生しました。">

/**
 * 汎用的な成功・失敗の結果を表す型。
 * 成功時には`Success<T>`型、失敗時には`Failure<E>`型を返す。
 * @template T 成功時の値の型
 * @template E 失敗時のエラーメッセージの型
 * @example
 * type FetchResult = Result<User, "not found" | "unauthorized">
 */
export type Result<T, E extends string> =
  | Success<T>
  | Failure<E>
  | UnexpectedError
