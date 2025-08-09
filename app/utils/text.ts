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
