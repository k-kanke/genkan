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
import type { Agent, ChatMessage, ClusterNode, ClusterNodeView, ClusterPod, ClusterView, LogEntry, Summary } from '../types'

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

// ---- クラスタビュー ----
// nginx が /k8s/ を kubectl proxy（読み取り専用）へ中継している。取れなければモックのノードだけ返す。
const getJSON = async (path: string) => {
  const r = await fetch(`/k8s/${path}`, { cache: 'no-store' })
  if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(String(r.status))
  return r.json()
}

const parseCpu = (q: string) =>
  q.endsWith('n') ? parseInt(q) / 1e9 : q.endsWith('u') ? parseInt(q) / 1e6 : q.endsWith('m') ? parseInt(q) / 1e3 : parseFloat(q)
const MEM_UNIT: Record<string, number> = { Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3 }
const parseMem = (q: string) => {
  const m = /^(\d+)(Ki|Mi|Gi)?$/.exec(q)
  return m ? parseInt(m[1]) * (MEM_UNIT[m[2] ?? ''] ?? 1) : 0
}

const podReason = (p: any): string | undefined => {
  for (const c of p.status?.containerStatuses ?? []) {
    const w = c.state?.waiting?.reason ?? (c.state?.terminated?.exitCode ? c.state.terminated.reason : undefined)
    if (w) return w
  }
  return undefined
}

export const getCluster = async (): Promise<ClusterView> => {
  try {
    const [nodeList, podList, metrics] = await Promise.all([
      getJSON('api/v1/nodes'),
      getJSON('api/v1/pods'),
      getJSON('apis/metrics.k8s.io/v1beta1/nodes').catch(() => ({ items: [] })),
    ])
    const usage = new Map<string, { cpu: number; mem: number }>(
      metrics.items.map((m: any) => [m.metadata.name, { cpu: parseCpu(m.usage.cpu), mem: parseMem(m.usage.memory) }]),
    )
    const toPod = (p: any): ClusterPod => ({
      name: p.metadata.name,
      namespace: p.metadata.namespace,
      phase: p.status?.phase ?? 'Unknown',
      reason: podReason(p),
      restarts: (p.status?.containerStatuses ?? []).reduce((a: number, c: any) => a + (c.restartCount ?? 0), 0),
    })
    const byNode = new Map<string, ClusterPod[]>()
    const unscheduled: ClusterPod[] = []
    for (const p of podList.items) {
      const n = p.spec?.nodeName
      if (!n) { unscheduled.push(toPod(p)); continue }
      byNode.set(n, [...(byNode.get(n) ?? []), toPod(p)])
    }
    const nodes: ClusterNodeView[] = nodeList.items.map((n: any) => {
      const name = n.metadata.name
      const u = usage.get(name)
      const cap = n.status?.capacity
      const ip = n.status?.addresses?.find((a: any) => a.type === 'InternalIP')?.address ?? ''
      return {
        name,
        role: 'node-role.kubernetes.io/control-plane' in (n.metadata.labels ?? {}) ? 'control-plane' : 'worker',
        ip,
        ready: n.status?.conditions?.some((c: any) => c.type === 'Ready' && c.status === 'True') ?? false,
        unschedulable: !!n.spec?.unschedulable,
        cpu: u && cap ? Math.round((u.cpu / parseCpu(cap.cpu)) * 100) : undefined,
        mem: u && cap ? Math.round((u.mem / parseMem(cap.memory)) * 100) : undefined,
        pods: byNode.get(name) ?? [],
      }
    })
    nodes.sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'control-plane' ? -1 : 1))
    return { nodes, unscheduled, live: true, updatedAt: Date.now() }
  } catch {
    return {
      nodes: mock.nodes.map((n): ClusterNodeView => ({ ...n, ready: true, unschedulable: false, pods: [] })),
      unscheduled: [],
      live: false,
      updatedAt: Date.now(),
    }
  }
}

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
