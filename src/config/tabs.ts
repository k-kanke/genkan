import { Bot, MessageSquare, Server, type LucideIcon } from 'lucide-react'

export interface TabDef {
  to: string
  label: string
  icon: LucideIcon
  /** このパスで始まるとき、タブを選択状態にする */
  match: (path: string) => boolean
}

/**
 * 下部ナビのタブ定義はここだけ。
 * 「開発」タブを足すときは、配列に1行足して Route を追加するだけでよい。
 */
export const tabs: TabDef[] = [
  { to: '/chat', label: '指令', icon: MessageSquare, match: (p) => p.startsWith('/chat') },
  { to: '/', label: 'エージェント', icon: Bot, match: (p) => p === '/' || p.startsWith('/agents') },
  { to: '/infra', label: 'インフラ', icon: Server, match: (p) => p.startsWith('/infra') },
]
