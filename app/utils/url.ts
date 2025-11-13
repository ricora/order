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

/**
 * シリアライズされたData URIスキーム文字列を生成する。
 * @param data - base64エンコードされた画像データ
 * @param mimeType - 画像のMIMEタイプ
 * @returns Data URIスキーム文字列
 */
export const serializeDataUriScheme = ({
  data,
  mimeType,
}: {
  data: string
  mimeType: string
}): string => {
  return `data:${mimeType};base64,${data}`
}

/**
 * Data URIスキーム文字列を解析し、base64データとMIMEタイプを抽出する。
 * @param uri - Data URIスキーム文字列
 * @returns データとMIMEタイプのオブジェクト、または無効な場合は`null`
 */
export const parseDataUriScheme = (
  uri: string,
): { data: string; mimeType: string } | undefined => {
  const match = uri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match || typeof match[1] !== "string" || typeof match[2] !== "string")
    return undefined
  return { mimeType: match[1], data: match[2] }
}
