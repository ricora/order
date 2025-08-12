/**
 * リポジトリ関数の型定義に、実装関数（repositoryImpl）をparamsオブジェクトとして追加するユーティリティ型。
 * ドメイン層でリポジトリ関数のDI（依存性注入）を行う際に利用する。
 * 引数がない関数の場合は空オブジェクト型（Record<string, never>）となる。
 * @template T リポジトリ関数の型
 * @example
 * type FindById = (params: { id: number }) => Promise<Product | null>
 * const findById: WithRepository<FindById> = async ({ id, repositoryImpl }) => repositoryImpl({ id })
 */
// biome-ignore lint/suspicious/noExplicitAny: For flexible generic types.
export type WithRepository<T extends (...args: any) => any> =
  Parameters<T> extends [infer P]
    ? (params: P & { repositoryImpl?: T }) => ReturnType<T>
    : (params: { repositoryImpl?: T }) => ReturnType<T>
