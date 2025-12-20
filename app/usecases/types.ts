import type { Result } from "../domain/types"
import type { DbClient } from "../libs/db/client"

/**
 * ユースケース関数の型定義。
 * ユースケース関数はこの型を継承して定義する。
 * @template P paramsの型
 * @template R 戻り値の型
 * @example
 * type RegisterProduct = UsecaseFunction<{ name: string; price: number }, { id: number }, 'validation error' | 'conflict'>
 */
export type UsecaseFunction<P, R, E extends string> = (
  params: P & { dbClient: DbClient },
) => Promise<Result<R, E>>
