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

// ---- クラスタビュー（実クラスタから取得） ----
export interface ClusterPod {
  name: string
  namespace: string
  /** Running / Pending / Succeeded / Failed など。起動中の細かい状態は reason に */
  phase: string
  reason?: string
  restarts: number
}

export interface ClusterNodeView {
  name: string
  role: NodeRole
  ip: string
  ready: boolean
  /** cordon されている（新しい Pod が置かれない） */
  unschedulable: boolean
  /** metrics-server が取れたときだけ入る（0-100） */
  cpu?: number
  mem?: number
  pods: ClusterPod[]
}

export interface ClusterView {
  nodes: ClusterNodeView[]
  /** どのノードにも割り当てられていない Pod（Pending など） */
  unscheduled: ClusterPod[]
  /** false のときはモック表示 */
  live: boolean
  updatedAt: number
}
