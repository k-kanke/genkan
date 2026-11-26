import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Card, SectionTitle } from '../components/ui'
import { STATE_LABEL, createTask, isActive, listTasks, type Task } from '../api/tasks'

const REFRESH_MS = 5_000
// 許可するリポジトリは Control Plane 側(AAP_TASK_REPO_PATTERN)で決まる。ここは入力の補助だけ。
const SUGGESTED_REPOS = ['k-kanke/genkan', 'k-kanke/ai-app-platform', 'k-kanke/kubernetes-platform']

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>()
  const [error, setError] = useState<string>()
  const [repo, setRepo] = useState(SUGGESTED_REPOS[0])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => listTasks().then((t) => { setTasks(t); setError(undefined) }).catch((e: Error) => setError(e.message))
  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [])

  const submit = async () => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    try {
      await createTask(repo.trim(), prompt.trim())
      setPrompt('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Tasks</h1>
          <p className="sub">Ask for a change to a repository, review the diff, and approve it</p>
        </div>
      </header>

      <Card className="stack">
        <label className="field">
          <span className="muted-s">Repository</span>
          <input list="repos" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/name" autoCapitalize="off" autoCorrect="off" />
          <datalist id="repos">{SUGGESTED_REPOS.map((r) => <option key={r} value={r} />)}</datalist>
        </label>
        <label className="field">
          <span className="muted-s">Request</span>
          <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Tuck the container details on the Infra screen into a toggle" />
        </label>
        <button className="primary" disabled={busy || !prompt.trim()} onClick={submit}>
          <Send size={16} />{busy ? 'Sending…' : 'Submit request'}
        </button>
      </Card>
      {error && <p className="error-text">Could not connect: {error}</p>}

      <SectionTitle>History</SectionTitle>
      {tasks?.length === 0 && <p className="muted-s">No tasks yet</p>}
      <div className="stack">
        {tasks?.map((t) => {
          const s = STATE_LABEL[t.state]
          return (
            <Link key={t.id} to={`/tasks/${t.id}`} className="card task-item">
              <div className="row between">
                <span className="mono-s">{t.repo}</span>
                <span className="status" style={{ color: s.color }}>
                  <i className={`dot ${isActive(t.state) ? 'pulse' : ''}`} style={{ background: s.color }} />{s.label}
                </span>
              </div>
              <div className="task-prompt">{t.prompt}</div>
              <div className="muted-s">{new Date(t.createdAt).toLocaleString('en-GB')}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
