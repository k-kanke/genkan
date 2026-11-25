import { useCallback, useEffect, useState } from 'react'

/**
 * チャットに出る「本物のタスク」の会話。モック(src/mock)とは別に、ブラウザに保存して、開き直しても残す。
 * タスクそのものの状態は Control Plane にある。ここに持つのは、会話の並びと、確認の返事だけ。
 */
export type ChatItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'orch'; text: string }
  | { id: string; kind: 'confirm'; repo: string; prompt: string; state: 'pending' | 'sent' | 'cancelled' }
  | { id: string; kind: 'task'; taskId: string }

const KEY = 'genkan.chat.items.v1'
const MAX_ITEMS = 60

function load(): ChatItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export const newId = () => Math.random().toString(36).slice(2, 10)

export function useTaskChat() {
  const [items, setItems] = useState<ChatItem[]>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)))
    } catch { /* 保存できなくても、画面は動く */ }
  }, [items])

  const add = useCallback((...more: ChatItem[]) => setItems((prev) => [...prev, ...more]), [])
  const patch = useCallback((id: string, change: Partial<ChatItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...change } as ChatItem) : i))), [])
  return { items, add, patch }
}
