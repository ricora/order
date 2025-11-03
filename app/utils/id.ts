import { customAlphabet } from "nanoid"

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const nanoid = customAlphabet(alphabet, 21)

/**
 * ユニークなIDを生成する
 * @returns 21文字のURL-safeなID
 */
export const generateId = (): string => {
  return nanoid()
}
