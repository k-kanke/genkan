import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, ExternalLink, X } from 'lucide-react'
import { Card, SectionTitle } from '../components/ui'
import {
  STATE_LABEL, approveTask, getPatch, getTask, isActive, publishNote, rejectTask, watchTask,
  type Task, type TaskEvent,
} from '../api/tasks'

const POLL_MS = 3_000
const MAX_DIFF_LINES = 400

function lineClass(l: string) {
  if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('diff ')) return 'd-head'
  if (l.startsWith('@@')) return 'd-hunk'
  if (l.startsWith('+')) return 'd-add'
  if (l.startsWith('-')) return 'd-del'
  return ''
}

export default function TaskDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [task, setTask] = useState<Task>()
  const [error, setError] = useState<string>()
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [patch, setPatch] = useState<string>()
  const [expand, setExpand] = useState(false)
  const [confirm, setConfirm] = useState<'approve' | 'reject'>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () => getTask(id).then((t) => { if (alive) { setTask(t); setError(undefined) } }).catch((e: Error) => alive && setError(e.message))
    load()
    const t = setInterval(load, POLL_MS)
    const stop = watchTask(id, (e) => setEvents((prev) => (prev.some((p) => p.id === e.id) ? prev : [...prev, e])))
    return () => { alive = false; clearInterval(t); stop() }
  }, [id])

  const hasPatch = !!task?.patchSha256 && task.state !== 'EXPIRED'
  useEffect(() => {
    if (hasPatch) getPatch(id).then(setPatch).catch(() => setPatch(undefined))
  }, [id, hasPatch, task?.patchSha256])

  const lines = useMemo(() => (patch ?? '').split('\n'), [patch])

  const act = async (kind: 'approve' | 'reject') => {
    if (!task) return
    setBusy(true)
    try {
      setTask(kind === 'approve' ? await approveTask(id, task.patchSha256 ?? '') : await rejectTask(id))
      setError(undefined)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setConfirm(undefined)
    }
  }

  if (!task) return <div className="page"><p className="muted-s">{error ? `Could not load: ${error}` : 'Loading…'}</p></div>
  const s = STATE_LABEL[task.state]
  const waiting = task.state === 'AWAITING_APPROVAL'
  const blocked = task.summary?.blocked

  return (
    <>
      <div className={`page ${waiting ? 'has-actions' : ''}`}>
        <header className="header">
          <button className="icon-btn" aria-label="Back" onClick={() => nav('/tasks')}><ChevronLeft size={22} /></button>
          <div className="grow">
            <h1 className="mono">{task.repo}</h1>
            <span className="status" style={{ color: s.color }}>
              <i className={`dot ${isActive(task.state) ? 'pulse' : ''}`} style={{ background: s.color }} />{s.label}
            </span>
          </div>
        </header>

        <Card><p className="desc" style={{ marginBottom: 0 }}>{task.prompt}</p></Card>
        {task.userMessage && <p className="error-text">{task.userMessage}</p>}
        {publishNote(task) && <p className="muted-s" style={{ margin: '8px 2px 0' }}>{publishNote(task)}</p>}
        {error && <p className="error-text">{error}</p>}

        {task.prUrl && (
          <a className="primary link-btn" href={task.prUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />Open PR #{task.prNumber} (merge it there)
          </a>
        )}

        {task.summary && (
          <>
            <SectionTitle right={`+${task.summary.added} / -${task.summary.deleted}`}>Changed files</SectionTitle>
            <Card className="list">
              {task.summary.files.map((f) => (
                <div key={f.path} className="list-row">
                  <div className="grow">
                    <div className="mono-s path">{f.path}</div>
                    {f.risk && <div className="risk">⚠ {f.risk}</div>}
                  </div>
                  <span className="mono-s muted">{f.binary ? 'binary' : `+${f.added} -${f.deleted}`}</span>
                </div>
              ))}
            </Card>
            {blocked && <p className="error-text">This cannot be approved: it contains changes that cannot be published.</p>}
          </>
        )}

        {patch && (
          <>
            <SectionTitle>Diff</SectionTitle>
            <pre className="diff">
              {(expand ? lines : lines.slice(0, MAX_DIFF_LINES)).map((l, i) => (
                <span key={i} className={lineClass(l)}>{l + '\n'}</span>
              ))}
            </pre>
            {!expand && lines.length > MAX_DIFF_LINES && (
              <button className="chip" onClick={() => setExpand(true)}>Show the remaining {lines.length - MAX_DIFF_LINES} lines</button>
            )}
          </>
        )}

        {events.length > 0 && (
          <>
            <SectionTitle>Progress</SectionTitle>
            <Card className="list">
              {events.slice(-12).map((e) => (
                <div key={e.id} className="list-row" style={{ minHeight: 40 }}>
                  <span className="mono-s muted">{new Date(e.createdAt).toLocaleTimeString('en-GB')}</span>
                  <span className="grow">{e.message}</span>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>

      {waiting && (
        <div className="action-bar">
          {confirm ? (
            <>
              <span className="confirm-text grow">{confirm === 'approve' ? 'Approve this diff?' : 'Reject this task?'}</span>
              <button className="chip" disabled={busy} onClick={() => setConfirm(undefined)}>Back</button>
              <button className="chip solid" disabled={busy} onClick={() => act(confirm)}>{confirm === 'approve' ? 'Approve' : 'Reject'}</button>
            </>
          ) : (
            <>
              <button className="chip grow" onClick={() => setConfirm('reject')}><X size={16} /> Reject</button>
              <button className="chip solid grow" disabled={blocked} onClick={() => setConfirm('approve')}><Check size={16} /> Approve</button>
            </>
          )}
        </div>
      )}
    </>
  )
}
