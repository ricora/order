import { execSync } from "node:child_process"

/**
 * Gitの履歴のHEADの短縮ハッシュを取得する。
 *
 * @return 短縮ハッシュ文字列。取得に失敗した場合は`undefined`を返す。
 */
export const getGitCommitHash = (): string | undefined => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()
  } catch {
    return undefined
  }
}
