import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, Rocket, Workflow } from 'lucide-react'
import { getChat, getSummary, sendMessage } from '../api'
import { useLive } from '../useLive'
import { shortNode } from '../components/ui'

export default function Chat() {
  const nav = useNavigate()
  const msgs = useLive(getChat, ['chat'])
  const summary = useLive(getSummary, ['agents'])
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs])

  const send = (t: string) => {
    const v = t.trim()
    if (!v) return
    setText('')
    sendMessage(v)
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
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="指示を入力…" enterKeyHint="send" />
        <button className="send" aria-label="送信" disabled={!text.trim()}><ArrowUp size={20} /></button>
      </form>
    </div>
  )
}
