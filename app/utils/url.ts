/**
 * クエリ文字列に対して特定のキーの値をセット（上書き）した新しいクエリ文字列を返す。
 * @param search `URL`オブジェクトの`search`プロパティの値（例: `?page=2&view=table"`）
 * @param key 変更したいクエリパラメータ名
 * @param value セットしたい値
 * @returns 新しいクエリ文字列（例: `?page=2&view=card`）
 * @example
 * setQueryParam("?page=2&view=table", "view", "card") // => "?page=2&view=card"
 */
export function setQueryParam(
  search: string,
  key: string,
  value: string,
): string {
  const params = new URLSearchParams(search)
  params.set(key, value)
  const query = params.toString()
  return query ? `?${query}` : ""
}
