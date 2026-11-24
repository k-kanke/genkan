/**
 * 画面が呼ぶ API 層。
 *
 * 画面は mock/ を直接触らず、ここの関数だけを使う。
 * 本物のバックエンドにつなぐときは、この1ファイルの中身を
 *   - 取得系: fetch('/api/...') に
 *   - subscribe: EventSource('/api/events') に
 * 差し替えればよい（シグネチャは変えない）。
 */
import * as mock from '../mock/store'
import type { Topic } from '../mock/store'
import type { Agent, ChatMessage, ClusterNode, LogEntry, Summary } from '../types'

const delay = <T>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms))

// ---- 取得 ----
export const getAgents = (): Promise<Agent[]> => delay(mock.agents)

export const getAgent = async (id: string): Promise<Agent | undefined> =>
  delay(mock.agents.find((a) => a.id === id))

export const getAgentLogs = (id: string): Promise<LogEntry[]> => delay(mock.getLogs(id))

export const getNodes = (): Promise<(ClusterNode & { agentCount: number })[]> =>
  delay(
    mock.nodes.map((n) => ({
      ...n,
      agentCount: mock.agents.filter((a) => a.node === n.name && (a.status === 'running' || a.status === 'waiting')).length,
    })),
  )

export const getSummary = (): Promise<Summary> =>
  delay({
    running: mock.agents.filter((a) => a.status === 'running').length,
    waiting: mock.agents.filter((a) => a.status === 'waiting').length,
    doneToday: mock.agents.filter((a) => a.status === 'done').length + mock.getDoneBase(),
  })

export const getChat = (): Promise<ChatMessage[]> => delay(mock.chat, 60)

// ---- 操作 ----
export const approveAgent = async (id: string) => { mock.approve(id) }
export const rejectAgent = async (id: string) => { mock.reject(id) }
export const stopAgent = async (id: string) => { mock.stop(id) }
export const sendMessage = async (text: string) => { mock.sendUserMessage(text) }

// ---- リアルタイム（将来 SSE） ----
export type { Topic }
export const subscribe = (topic: Topic, cb: () => void) => mock.subscribe(topic, cb)
