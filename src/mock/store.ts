import type { Agent, ChatMessage, ClusterNode, LogEntry } from '../types'

/**
 * 擬似バックエンド。画面からは直接触らず、必ず src/api 経由で使う。
 * 将来SSEで受け取るイベントを、ここでは setInterval で再現している。
 */

export type Topic = 'agents' | 'nodes' | 'chat' | `logs:${string}`
type Listener = () => void

// ---- モック時計（画面上のログが 14:18 付近から始まるように） ----
const clockBase = new Date()
clockBase.setHours(14, 18, 30, 0)
const clockStart = Date.now()
export const mockNow = () => new Date(clockBase.getTime() + (Date.now() - clockStart))
export const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const atMinutesAgo = (m: number) => hhmm(new Date(mockNow().getTime() - m * 60_000))

// ---- データ ----
export const nodes: ClusterNode[] = [
  { name: 'ubuntu-26', role: 'control-plane', ip: '192.168.0.20', cpu: 22, mem: 41 },
  { name: 'ubuntu-worker-01', role: 'worker', ip: '192.168.0.165', cpu: 58, mem: 64 },
  { name: 'ubuntu-worker-02', role: 'worker', ip: '192.168.0.166', cpu: 31, mem: 47 },
  { name: 'ubuntu-worker-03', role: 'worker', ip: '192.168.0.23', note: 'VM on Proxmox', cpu: 17, mem: 38 },
]

export const agents: Agent[] = [
  {
    id: 'a', name: 'Agent A', status: 'running', task: 'Review PR #42 (auth)',
    description: 'Review the authentication changes in PR #42 and summarise concerns as comments.',
    node: 'ubuntu-worker-01', pod: 'agent-a-5d8e1', elapsedSec: 12 * 60 + 5, toolCalls: 31,
    lastAction: 'Read src/auth/jwt.go',
  },
  {
    id: 'b', name: 'Agent B', status: 'running', task: 'Fix failing tests',
    description: 'Find out why tests in the auth package fail and fix them.',
    node: 'ubuntu-worker-01', pod: 'agent-b-7f9c2', elapsedSec: 8 * 60 + 42, toolCalls: 27,
    lastAction: 'Bash go test ./auth/...',
  },
  {
    id: 'c', name: 'Agent C', status: 'running', task: 'Research Longhorn RWX',
    description: 'Look into the requirements and limits of Longhorn RWX volumes and summarise whether to adopt it.',
    node: 'ubuntu-worker-02', pod: 'agent-c-2b6a4', elapsedSec: 3 * 60 + 10, toolCalls: 9,
    lastAction: 'WebFetch longhorn.io',
  },
  {
    id: 'd', name: 'Agent D', status: 'waiting', task: 'Update dependencies',
    description: 'Update dependencies and push to a branch. Waiting for approval to push.',
    node: 'ubuntu-worker-03', pod: 'agent-d-91c3f', elapsedSec: 15 * 60, toolCalls: 18,
    lastAction: 'Waiting for git push', pendingCommand: 'git push origin deps-update',
  },
  {
    id: 'e', name: 'Agent E', status: 'done', task: 'Tidy up the README',
    description: 'Reorganised the README and removed outdated text.',
    node: 'ubuntu-worker-01', pod: 'agent-e-c40d8', elapsedSec: 21 * 60, toolCalls: 14,
    lastAction: 'Stop',
  },
]

const L = (time: string, tool: string, arg: string, i: number): LogEntry => ({
  id: `seed-${i}-${time}-${tool}`, time, tool, arg,
})
const logs: Record<string, LogEntry[]> = {
  b: [
    L('14:18', 'Notify', 'Asked the orchestrator to confirm the spec', 1),
    L('14:17', 'Bash', 'go test ./auth/... → 1 failed', 2),
    L('14:16', 'Edit', 'auth/session_test.go', 3),
    L('14:15', 'Edit', 'auth/session.go', 4),
    L('14:14', 'Read', 'auth/refresh.go', 5),
    L('14:13', 'Grep', '"ErrTokenExpired"', 6),
    L('14:11', 'Bash', 'go test ./auth/... → 3 failed', 7),
    L('14:10', 'Start', 'Placed on worker-01, mounted the worktree', 8),
  ],
  a: [
    L('14:18', 'Read', 'src/auth/jwt.go', 1),
    L('14:16', 'Grep', '"VerifyToken"', 2),
    L('14:14', 'Read', 'src/auth/middleware.go', 3),
    L('14:11', 'Bash', 'gh pr diff 42', 4),
    L('14:06', 'Start', 'Placed on worker-01, fetched PR #42', 5),
  ],
  c: [
    L('14:18', 'WebFetch', 'longhorn.io/docs/…/rwx', 1),
    L('14:17', 'WebSearch', 'Longhorn RWX NFS share-manager', 2),
    L('14:15', 'Start', 'Placed on worker-02', 3),
  ],
  d: [
    L('14:18', 'Notify', 'Asked for approval to git push', 1),
    L('14:12', 'Bash', 'go mod tidy', 2),
    L('14:08', 'Edit', 'go.mod', 3),
    L('14:03', 'Start', 'Placed on worker-03', 4),
  ],
  e: [
    L('14:00', 'Stop', 'Done', 1),
    L('13:58', 'Edit', 'README.md', 2),
    L('13:44', 'Start', 'Placed on worker-01', 3),
  ],
}

const DONE_BEFORE_TODAY = 3

export const getDoneBase = () => DONE_BEFORE_TODAY

export const chat: ChatMessage[] = [
  { id: 'm1', kind: 'user', text: 'Please review PR #42 (auth) and fix the failing tests, in parallel' },
  {
    id: 'm2', kind: 'orchestrator', text: 'Got it. Started 2 agents.',
    launches: [
      { agentName: 'Agent A', node: 'ubuntu-worker-01', task: 'Review PR #42' },
      { agentName: 'Agent B', node: 'ubuntu-worker-01', task: 'Fix the auth tests' },
    ],
  },
  { id: 'm3', kind: 'system', text: '14:18 · Report from Agent B' },
  {
    id: 'm4', kind: 'orchestrator',
    text: 'From B: 2 of the 3 failing tests are fixed. The remaining `TestRefreshExpired` needs a spec decision: should an expired token return 401 or 403?',
    choices: [
      { label: 'Use 401' },
      { label: 'Use 403' },
      { label: 'View B\'s work', to: '/agents/b' },
    ],
  },
]

// ---- 購読 ----
const listeners = new Map<string, Set<Listener>>()
let timers: number[] = []

function emit(topic: Topic) {
  listeners.get(topic)?.forEach((l) => l())
}

export function subscribe(topic: Topic, cb: Listener): () => void {
  let set = listeners.get(topic)
  if (!set) listeners.set(topic, (set = new Set()))
  set.add(cb)
  startTimers()
  return () => {
    set!.delete(cb)
    if ([...listeners.values()].every((s) => s.size === 0)) stopTimers()
  }
}

// ---- 擬似リアルタイム ----
const LOG_POOL: Record<string, [string, string][]> = {
  a: [['Read', 'src/auth/token.go'], ['Grep', '"ParseClaims"'], ['Bash', 'git log -n 5 -- src/auth'], ['Read', 'src/auth/jwt_test.go']],
  b: [['Read', 'auth/refresh_test.go'], ['Bash', 'go test ./auth/... → 1 failed'], ['Grep', '"TestRefreshExpired"'], ['Edit', 'auth/refresh.go']],
  c: [['WebFetch', 'longhorn.io/docs/…/volumes'], ['WebSearch', 'Longhorn RWX requirements'], ['Read', 'notes/longhorn.md'], ['Edit', 'notes/longhorn.md']],
}
const rand = (n: number) => Math.floor(Math.random() * n)
const clamp = (v: number) => Math.max(5, Math.min(95, v))

function pushLog(id: string, tool: string, arg: string) {
  const a = agents.find((x) => x.id === id)
  if (!a) return
  const entry: LogEntry = { id: `${id}-${Date.now()}-${rand(1e6)}`, time: hhmm(mockNow()), tool, arg }
  logs[id] = [entry, ...(logs[id] ?? [])].slice(0, 200)
  a.toolCalls += 1
  a.lastAction = `${tool} ${arg}`
  emit(`logs:${id}`)
  emit('agents')
}

function startTimers() {
  if (timers.length) return
  // 経過時間（1秒ごと）
  timers.push(window.setInterval(() => {
    let changed = false
    for (const a of agents) if (a.status === 'running') { a.elapsedSec += 1; changed = true }
    if (changed) emit('agents')
  }, 1000))
  // ログが流れる（3秒ごと）
  timers.push(window.setInterval(() => {
    const running = agents.filter((a) => a.status === 'running')
    if (!running.length) return
    const a = running[rand(running.length)]
    const pool = LOG_POOL[a.id] ?? LOG_POOL.a
    const [tool, arg] = pool[rand(pool.length)]
    pushLog(a.id, tool, arg)
  }, 3000))
  // ノード使用率の揺らぎ（2.5秒ごと）
  timers.push(window.setInterval(() => {
    for (const n of nodes) {
      n.cpu = clamp(n.cpu + rand(9) - 4)
      n.mem = clamp(n.mem + rand(5) - 2)
    }
    emit('nodes')
  }, 2500))
}

function stopTimers() {
  timers.forEach((t) => clearInterval(t))
  timers = []
}

// ---- 操作 ----
export function approve(id: string) {
  const a = agents.find((x) => x.id === id)
  if (!a || a.status !== 'waiting') return
  const cmd = a.pendingCommand
  a.status = 'running'
  a.pendingCommand = undefined
  pushLog(id, 'Bash', `${cmd ?? ''} (approved)`)
}

export function reject(id: string) {
  const a = agents.find((x) => x.id === id)
  if (!a || a.status !== 'waiting') return
  a.status = 'stopped'
  a.pendingCommand = undefined
  a.lastAction = 'Stopped (rejected)'
  logs[id] = [{ id: `${id}-rej-${Date.now()}`, time: hhmm(mockNow()), tool: 'Stop', arg: 'Stopped because the approval was rejected' }, ...(logs[id] ?? [])]
  emit(`logs:${id}`)
  emit('agents')
}

export function stop(id: string) {
  const a = agents.find((x) => x.id === id)
  if (!a || (a.status !== 'running' && a.status !== 'waiting')) return
  a.status = 'stopped'
  a.pendingCommand = undefined
  a.lastAction = 'Stop (manual)'
  logs[id] = [{ id: `${id}-stop-${Date.now()}`, time: hhmm(mockNow()), tool: 'Stop', arg: 'Stopped manually' }, ...(logs[id] ?? [])]
  emit(`logs:${id}`)
  emit('agents')
}

export const getLogs = (id: string) => logs[id] ?? []

// ---- チャット ----
let seq = 100
const nextId = () => `m${seq++}`

function replyFor(text: string): string {
  if (/401/.test(text)) return 'Got it. I told B to return 401 for expired tokens. I will report back when the fix is done.'
  if (/403/.test(text)) return 'Got it. I told B to return 403 for expired tokens. I will report back when the fix is done.'
  if (/状況|状態|どう|status|how/i.test(text)) {
    const r = agents.filter((a) => a.status === 'running').length
    const w = agents.filter((a) => a.status === 'waiting').length
    return `Right now ${r} agents are running and ${w} are waiting for approval. You can approve them from the Agents tab.`
  }
  return 'Understood. I will sort this out and start agents if needed. (This is a canned mock reply.)'
}

export function sendUserMessage(text: string) {
  chat.push({ id: nextId(), kind: 'user', text })
  // 選択肢は、次の発言が来たら消す
  for (const m of chat) if (m.kind === 'orchestrator' && m.choices) m.choices = undefined
  emit('chat')

  const reply = replyFor(text)
  const id = nextId()
  window.setTimeout(() => {
    chat.push({ id, kind: 'orchestrator', text: '', streaming: true })
    emit('chat')
    let i = 0
    const t = window.setInterval(() => {
      i = Math.min(reply.length, i + 2)
      const m = chat.find((x) => x.id === id)
      if (m && m.kind === 'orchestrator') {
        m.text = reply.slice(0, i)
        if (i >= reply.length) {
          m.streaming = false
          clearInterval(t)
        }
      }
      emit('chat')
    }, 40)
  }, 700)
}
