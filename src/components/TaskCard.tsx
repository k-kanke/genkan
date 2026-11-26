import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, FileDiff, X } from 'lucide-react'
import { STATE_LABEL, approveTask, getTask, isActive, publishNote, rejectTask, watchTask, type Task } from '../api/tasks'

const POLL_MS = 3_000

/** チャットの中のタスク。進捗 → 差分の承認 → PR のリンクまで、状態に合わせて形が変わる。 */
export default function TaskCard({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task>()
  const [error, setError] = useState<string>()
  const [last, setLast] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<'approve' | 'reject'>()
  const root = useRef<HTMLDivElement>(null)
  const shownState = useRef<string | undefined>(undefined)

  useEffect(() => {
    let alive = true
    const load = () => getTask(taskId).then((t) => { if (alive) { setTask(t); setError(undefined) } }).catch((e: Error) => alive && setError(e.message))
    load()
    // 終わったタスクは、もう変わらないので、ポーリングをやめる
    const t = setInterval(() => { if (!task || isActive(task.state) || task.state === 'AWAITING_APPROVAL' || task.state === 'APPROVED' || (task.state === 'PUBLISHED' && task.autoDeploy)) load() }, POLL_MS)
    const stop = watchTask(taskId, (e) => setLast(e.message))
    return () => { alive = false; clearInterval(t); stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, task?.state])

  // 状態が変わるとカードが伸びる(承認のボタンなど)。画面の外に隠れないよう、見える位置まで寄せる。
  useEffect(() => {
    if (!task) return
    if (shownState.current && shownState.current !== task.state) root.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    shownState.current = task.state
  }, [task])

  const act = async (kind: 'approve' | 'reject') => {
    if (!task) return
    setBusy(true)
    try {
      setTask(kind === 'approve' ? await approveTask(task.id, task.patchSha256 ?? '') : await rejectTask(task.id))
      setError(undefined)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setConfirm(undefined)
    }
  }

  if (!task) return <div ref={root} className="task-card muted-s">{error ? `Could not load the task: ${error}` : 'Checking the task…'}</div>
  const s = STATE_LABEL[task.state]
  const sum = task.summary
  return (
    <div ref={root} className="task-card">
      <div className="row between">
        <span className="mono-s">{task.repo}</span>
        <span className="status" style={{ color: s.color }}>
          <i className={`dot ${isActive(task.state) ? 'pulse' : ''}`} style={{ background: s.color }} />{s.label}
        </span>
      </div>

      {(task.state === 'PENDING' || task.state === 'RUNNING') && <div className="muted-s">{last ?? 'Working…'}</div>}
      {task.userMessage && <div className="risk-text">{task.userMessage}</div>}
      {task.state === 'NO_CHANGES' && <div className="muted-s">No changes were made.</div>}
      {task.state === 'EXPIRED' && <div className="muted-s">The diff was deleted because the retention period has passed.</div>}

      {sum && task.state !== 'EXPIRED' && (
        <div className="stack" style={{ gap: 4 }}>
          <div className="muted-s">{sum.files.length} {sum.files.length === 1 ? 'file' : 'files'} · +{sum.added} / -{sum.deleted}</div>
          {sum.files.slice(0, 4).map((f) => <div key={f.path} className="mono-s path">{f.path}{f.risk ? <span className="risk"> ⚠ {f.risk}</span> : null}</div>)}
          {sum.files.length > 4 && <div className="muted-s">and {sum.files.length - 4} more</div>}
          {sum.blocked && <div className="risk-text">This cannot be approved: it contains changes that cannot be published.</div>}
        </div>
      )}

      {task.state === 'AWAITING_APPROVAL' && (
        confirm ? (
          <div className="row gap-s">
            <span className="confirm-text grow">{confirm === 'approve' ? 'Approve this diff?' : 'Reject this task?'}</span>
            <button className="chip" disabled={busy} onClick={() => setConfirm(undefined)}>Back</button>
            <button className="chip solid" disabled={busy} onClick={() => act(confirm)}>{confirm === 'approve' ? 'Approve' : 'Reject'}</button>
          </div>
        ) : (
          <div className="choices">
            <Link className="chip" to={`/tasks/${task.id}`}><FileDiff size={14} /> View diff</Link>
            <button className="chip" onClick={() => setConfirm('reject')}><X size={14} /> Reject</button>
            <button className="chip solid" disabled={sum?.blocked} onClick={() => setConfirm('approve')}><Check size={14} /> Approve</button>
          </div>
        )
      )}

      {task.state === 'APPROVED' && <div className="muted-s">Approved. No pull request is created because GitHub is not connected.</div>}
      {task.state === 'PUBLISHING' && <div className="muted-s">Creating the pull request…</div>}
      {publishNote(task) && <div className="muted-s">{publishNote(task)}</div>}
      {task.prUrl && (
        <a className="primary link-btn" href={task.prUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} />Open PR #{task.prNumber} to merge
        </a>
      )}
      {error && <div className="risk-text">{error}</div>}
      {(task.state === 'FAILED' || task.state === 'REJECTED' || task.state === 'NO_CHANGES') && (
        <Link className="chip" to={`/tasks/${task.id}`}>Details</Link>
      )}
    </div>
  )
}
