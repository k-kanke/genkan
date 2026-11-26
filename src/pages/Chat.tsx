import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, Rocket, Workflow } from 'lucide-react'
import { getChat, getSummary, sendMessage } from '../api'
import { useLive } from '../useLive'
import { shortNode } from '../components/ui'
import TaskCard from '../components/TaskCard'
import { createTask } from '../api/tasks'
import { parseIntent } from '../chat/intent'
import { newId, useTaskChat } from '../chat/useTaskChat'

export default function Chat() {
  const nav = useNavigate()
  const msgs = useLive(getChat, ['chat'])
  const summary = useLive(getSummary, ['agents'])
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const real = useTaskChat()

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs, real.items])

  const send = (t: string) => {
    const v = t.trim()
    if (!v) return
    setText('')
    // リポジトリへの依頼なら、本物のタスクとして扱う(まず確認を取る)。それ以外は、これまでの会話(モック)。
    const intent = parseIntent(v)
    if (!intent) { sendMessage(v); return }
    real.add(
      { id: newId(), kind: 'user', text: v },
      { id: newId(), kind: 'orch', text: `Got it: this is a request for ${intent.repo}. Shall I start working on the following?\n\n“${intent.prompt}”` },
      { id: newId(), kind: 'confirm', repo: intent.repo, prompt: intent.prompt, state: 'pending' },
    )
  }

  const start = async (id: string, repo: string, prompt: string) => {
    real.patch(id, { state: 'sent' })
    try {
      const t = await createTask(repo, prompt)
      real.add({ id: newId(), kind: 'orch', text: "Starting work. I'll ask for your approval here once the diff is ready." }, { id: newId(), kind: 'task', taskId: t.id })
    } catch (e) {
      real.add({ id: newId(), kind: 'orch', text: `Could not submit the request: ${(e as Error).message}` })
    }
  }
  const total = summary ? summary.running + summary.waiting : 0

  return (
    <div className="chat">
      <header className="header">
        <span className="orch-icon"><Workflow size={20} /></span>
        <div>
          <h1>Orchestrator</h1>
          <p className="sub">{total} {total === 1 ? 'agent' : 'agents'} · {summary?.running ?? 0} running · {summary?.waiting ?? 0} awaiting approval</p>
        </div>
      </header>

      <div className="messages">
        {msgs?.map((m) => {
          if (m.kind === 'system') return <div key={m.id} className="sys"><span>{m.text}</span></div>
          if (m.kind === 'user') return <div key={m.id} className="bubble me">{m.text}</div>
          return (
            <div key={m.id} className="orch-wrap">
              <div className="bubble orch">{m.text}{m.streaming && <i className="caret" />}</div>
              {m.launches?.map((l) => (
                <div key={l.agentName} className="launch">
                  <div className="row gap-s"><Rocket size={14} color="#60A5FA" /><b>{l.agentName}</b><span className="mono-s muted">→ {shortNode(l.node)}</span></div>
                  <div className="task">{l.task}</div>
                </div>
              ))}
              {m.launches && <div className="muted-s">Placement is decided by the scheduler from free capacity</div>}
              {m.choices && (
                <div className="choices">
                  {m.choices.map((c) => (
                    <button key={c.label} className="chip" onClick={() => (c.to ? nav(c.to) : send(c.label))}>{c.label}</button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {real.items.map((i) => {
          if (i.kind === 'user') return <div key={i.id} className="bubble me">{i.text}</div>
          if (i.kind === 'orch') return <div key={i.id} className="orch-wrap"><div className="bubble orch" style={{ whiteSpace: 'pre-wrap' }}>{i.text}</div></div>
          if (i.kind === 'task') return <div key={i.id} className="orch-wrap"><TaskCard taskId={i.taskId} /></div>
          return (
            <div key={i.id} className="orch-wrap">
              {i.state === 'pending' ? (
                <div className="choices">
                  <button className="chip solid" onClick={() => start(i.id, i.repo, i.prompt)}>Start</button>
                  <button className="chip" onClick={() => real.patch(i.id, { state: 'cancelled' })}>Cancel</button>
                </div>
              ) : <div className="muted-s">{i.state === 'sent' ? 'Requested' : 'Cancelled'}</div>}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type an instruction…" enterKeyHint="send" />
        <button className="send" aria-label="Send" disabled={!text.trim()}><ArrowUp size={20} /></button>
      </form>
    </div>
  )
}
