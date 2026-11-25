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
      { id: newId(), kind: 'orch', text: `${intent.repo} への依頼として受け取りました。次の内容で作業を始めてよいですか?\n\n「${intent.prompt}」` },
      { id: newId(), kind: 'confirm', repo: intent.repo, prompt: intent.prompt, state: 'pending' },
    )
  }

  const start = async (id: string, repo: string, prompt: string) => {
    real.patch(id, { state: 'sent' })
    try {
      const t = await createTask(repo, prompt)
      real.add({ id: newId(), kind: 'orch', text: '作業を始めます。差分ができたら、ここで承認を求めます。' }, { id: newId(), kind: 'task', taskId: t.id })
    } catch (e) {
      real.add({ id: newId(), kind: 'orch', text: `依頼を出せませんでした: ${(e as Error).message}` })
    }
  }
  const total = summary ? summary.running + summary.waiting : 0

  return (
    <div className="chat">
      <header className="header">
        <span className="orch-icon"><Workflow size={20} /></span>
        <div>
          <h1>オーケストレーター</h1>
          <p className="sub">配下 {total}体 · 実行中 {summary?.running ?? 0} · 承認待ち {summary?.waiting ?? 0}</p>
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
              {m.launches && <div className="muted-s">配置先はスケジューラが空き容量で決定</div>}
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
                  <button className="chip solid" onClick={() => start(i.id, i.repo, i.prompt)}>依頼する</button>
                  <button className="chip" onClick={() => real.patch(i.id, { state: 'cancelled' })}>やめる</button>
                </div>
              ) : <div className="muted-s">{i.state === 'sent' ? '依頼しました' : '取りやめました'}</div>}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="指示を入力…" enterKeyHint="send" />
        <button className="send" aria-label="送信" disabled={!text.trim()}><ArrowUp size={20} /></button>
      </form>
    </div>
  )
}
