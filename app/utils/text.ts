/**
 * サロゲートペアを考慮してユーザーが認識する文字の数を数える
 *
 * @param input - 長さを数える文字列
 * @returns 文字数
 * @example
 * countStringLength("𠮷野家") // => 3
 *
 */
export const countStringLength = (input: string): number => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" })
  const segments = segmenter.segment(input)
  return [...segments].length
}

/**
 * サロゲートペアや結合文字を考慮して、指定した文字数で安全に切り出す
 *
 * @param input - 切り出す文字列
 * @param maxLength - 最大文字数
 * @returns 指定文字数で切り詰めた文字列
 * @example
 * stripString("👩‍👩‍👧‍👦家", 2) // => "👩‍👩‍👧‍👦家"
 */
export const stripString = (input: string, maxLength: number): string => {
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" })
  const segments = segmenter.segment(input)
  return Array.from(segments, (s) => s.segment)
    .slice(0, maxLength)
    .join("")
}
