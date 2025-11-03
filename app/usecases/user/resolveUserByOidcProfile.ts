import type { User, UserRole } from "../../domain/user/entities/user"
import { createUser, updateUser } from "../../domain/user/repositories/userCommandRepository"
import { findUserByOidcSub } from "../../domain/user/repositories/userQueryRepository"

// DbClientの型を柔軟に受け入れる
export interface ResolveUserByOidcProfileInput {
  oidcSub: string
  email: string
  name?: string
  dbClient: Parameters<typeof findUserByOidcSub>[0]['dbClient']
}

export interface ResolveUserByOidcProfileOutput {
  user: User
  isNewUser: boolean
}

/**
 * OIDC認証情報からユーザーを取得または作成
 */
export const resolveUserByOidcProfile = async ({
  oidcSub,
  email,
  name,
  dbClient,
}: ResolveUserByOidcProfileInput): Promise<ResolveUserByOidcProfileOutput> => {
  let result: ResolveUserByOidcProfileOutput | null = null
  
  await dbClient.transaction(async (tx) => {
    // 既存ユーザーを検索（トランザクション内で実行）
    const existingUser = await findUserByOidcSub({ oidcSub, dbClient: tx })
    
    if (existingUser) {
      // ユーザー情報の更新が必要か確認
      if (existingUser.email !== email || existingUser.name !== (name ?? null)) {
        const updatedUser = await updateUser({
          user: {
            id: existingUser.id,
            oidcSub: existingUser.oidcSub,
            email,
            name: name ?? null,
            role: existingUser.role,
            updatedAt: new Date(),
          },
          dbClient: tx,
        })
        result = {
          user: updatedUser,
          isNewUser: false,
        }
      } else {
        result = {
          user: existingUser,
          isNewUser: false,
        }
      }
    } else {
            const role = determineInitialRole()
            const newUser = await createUser({
        user: {
          oidcSub,
          email,
          name: name ?? null,
          role,
        },
        dbClient: tx,
      })
      
      result = {
        user: newUser,
        isNewUser: true,
      }
    }
  })
  
  if (!result) {
    throw new Error("ユーザーの取得または作成に失敗しました")
  }
  
  return result
}

/**
 * 初期ロールを決定
 * @returns 初期ロール（常にviewer）
 */
export const determineInitialRole = (): UserRole => {
  // 全員デフォルトでviewerとして登録
  // 管理者権限が必要な場合は、DBを直接更新するか、
  // 管理画面を作成して変更する
  return 'viewer'
}
