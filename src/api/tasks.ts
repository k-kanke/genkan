/**
 * リポジトリタスク(Control Plane)の API。
 *
 * nginx が /cp/ を Control Plane の /api/ へ中継する(tasks の GET / POST だけ)。
 * 実装の背景は ai-app-platform の docs/multi-agent-execution-plan.md。
 */

export type TaskState =
  | 'PENDING' | 'RUNNING' | 'AWAITING_APPROVAL' | 'APPROVED' | 'PUBLISHING' | 'PUBLISHED'
  | 'MERGED' | 'DEPLOYING' | 'DEPLOYED' | 'CLOSED'
  | 'NO_CHANGES' | 'REJECTED' | 'FAILED' | 'EXPIRED'

export interface PatchFile {
  path: string
  added: number
  deleted: number
  binary?: boolean
  symlink?: boolean
  modeChange?: boolean
  risk?: string
}

export interface PatchSummary {
  files: PatchFile[]
  added: number
  deleted: number
  bytes: number
  risks?: string[]
  blocked?: boolean
}

export interface Task {
  id: string
  repo: string
  prompt: string
  state: TaskState
  step?: string
  userMessage?: string
  patchSha256?: string
  patchBytes?: number
  prUrl?: string
  prNumber?: number
  /** PR がマージされたら、自動で反映される(Control Plane に反映先の設定があるリポジトリ) */
  autoDeploy?: boolean
  createdAt: string
  updatedAt: string
  finishedAt?: string
  summary?: PatchSummary
}

export interface TaskEvent {
  id: number
  phase: string
  message: string
  createdAt: string
}

const base = '/cp/v1/tasks'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${base}${path}`, { cache: 'no-store', ...init })
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${r.status}`)
  }
  return r.json()
}

const post = <T>(path: string, body?: unknown) =>
  call<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })

export const listTasks = () => call<Task[]>('')
export const getTask = (id: string) => call<Task>(`/${id}`)
export const createTask = (repo: string, prompt: string) => post<Task>('', { repo, prompt })
export const approveTask = (id: string, patchSha256: string) => post<Task>(`/${id}/approve`, { patchSha256 })
export const rejectTask = (id: string) => post<Task>(`/${id}/reject`)

export async function getPatch(id: string): Promise<string> {
  const r = await fetch(`${base}/${id}/patch`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.text()
}

/** 進捗のストリーム。つながらなくても画面は状態のポーリングで動くので、失敗は黙って無視する。 */
export function watchTask(id: string, cb: (e: TaskEvent) => void): () => void {
  if (typeof EventSource === 'undefined') return () => {}
  const es = new EventSource(`${base}/${id}/events`)
  es.addEventListener('progress', (m) => {
    try { cb(JSON.parse((m as MessageEvent).data)) } catch { /* 壊れたイベントは捨てる */ }
  })
  return () => es.close()
}

export const STATE_LABEL: Record<TaskState, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: '#9AA3AF' },
  RUNNING: { label: 'Running', color: '#60A5FA' },
  AWAITING_APPROVAL: { label: 'Awaiting approval', color: '#FBBF24' },
  APPROVED: { label: 'Approved', color: '#4ADE80' },
  PUBLISHING: { label: 'Publishing', color: '#60A5FA' },
  PUBLISHED: { label: 'PR created', color: '#4ADE80' },
  MERGED: { label: 'Merged', color: '#A78BFA' },
  DEPLOYING: { label: 'Deploying', color: '#60A5FA' },
  DEPLOYED: { label: 'Deployed', color: '#4ADE80' },
  CLOSED: { label: 'PR closed', color: '#9AA3AF' },
  NO_CHANGES: { label: 'No changes', color: '#9AA3AF' },
  REJECTED: { label: 'Rejected', color: '#FCA5A5' },
  FAILED: { label: 'Failed', color: '#F87171' },
  EXPIRED: { label: 'Expired', color: '#9AA3AF' },
}

export const isActive = (s: TaskState) => s === 'PENDING' || s === 'RUNNING' || s === 'PUBLISHING' || s === 'MERGED' || s === 'DEPLOYING'

/** PR ができたあとの、状態ごとの一行の説明(画面の二か所で使う) */
export function publishNote(t: Task): string | undefined {
  switch (t.state) {
    case 'PUBLISHED': return t.autoDeploy ? 'Merge the PR and it is deployed automatically.' : undefined
    case 'MERGED': return 'Merged. Waiting for the new image to be built…'
    case 'DEPLOYING': return 'Restarting onto the new image…'
    case 'DEPLOYED': return 'Deployed. The new image is running.'
    case 'CLOSED': return 'The PR was closed without being merged.'
  }
}
