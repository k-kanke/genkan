export type AgentStatus = 'running' | 'waiting' | 'done' | 'stopped' | 'failed'

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  task: string
  description: string
  node: string
  pod: string
  elapsedSec: number
  toolCalls: number
  lastAction: string
  /** 承認待ちのときだけ入る、承認を求めているコマンド */
  pendingCommand?: string
}

export type NodeRole = 'control-plane' | 'worker'

export interface ClusterNode {
  name: string
  role: NodeRole
  ip: string
  note?: string
  /** 使用率 0-100（workerのみ意味を持つ） */
  cpu: number
  mem: number
}

export interface LogEntry {
  id: string
  time: string
  tool: string
  arg: string
}

export interface Summary {
  running: number
  waiting: number
  doneToday: number
}

export interface LaunchCard {
  agentName: string
  node: string
  task: string
}

export interface Choice {
  label: string
  /** 指定があればその画面へ遷移、なければ発言として送信 */
  to?: string
}

export type ChatMessage =
  | { id: string; kind: 'user'; text: string }
  | {
      id: string
      kind: 'orchestrator'
      text: string
      launches?: LaunchCard[]
      choices?: Choice[]
      streaming?: boolean
    }
  | { id: string; kind: 'system'; text: string }

export interface ToolLink {
  name: string
  description: string
  url: string
}
