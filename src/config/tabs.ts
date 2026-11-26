import { Bot, GitPullRequest, MessageSquare, Server, type LucideIcon } from 'lucide-react'

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
  { to: '/chat', label: 'Command', icon: MessageSquare, match: (p) => p.startsWith('/chat') },
  { to: '/', label: 'Agents', icon: Bot, match: (p) => p === '/' || p.startsWith('/agents') },
  { to: '/tasks', label: 'Tasks', icon: GitPullRequest, match: (p) => p.startsWith('/tasks') },
  { to: '/infra', label: 'Infra', icon: Server, match: (p) => p.startsWith('/infra') },
]
