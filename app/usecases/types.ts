import type { Result } from "../domain/types"
import type { DbClient } from "../libs/db/client"

/**
 * ユースケース関数の型定義。
 * ユースケース関数はこの型を使用して定義する。
 * @template P paramsの型
 * @template R 成功時の戻り値の型
 * @template E 失敗時のエラーメッセージの型
 * @example
 * type RegisterProduct = UsecaseFunction<{ name: string; price: number }, { id: number }, 'validation error' | 'conflict'>
 */
export type UsecaseFunction<P, R, E extends string> = (
  params: P & { dbClient: DbClient },
) => Promise<Result<R, E>>
