import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Send, Square } from 'lucide-react'
import { getAgent, getAgentLogs, stopAgent } from '../api'
import { Card, SectionTitle, StatusBadge } from '../components/ui'
import { fmtClock, useLive } from '../useLive'

const TOOL_COLOR: Record<string, string> = {
  Read: '#A5B4FC', Grep: '#A5B4FC', Bash: '#FDBA74', Edit: '#60A5FA',
}

export default function AgentDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const agent = useLive(() => getAgent(id), ['agents'])
  const logs = useLive(() => getAgentLogs(id), [`logs:${id}`])
  const [confirming, setConfirming] = useState(false)

  if (!agent) return <div className="page"><p className="muted-s">読み込み中…</p></div>
  const active = agent.status === 'running' || agent.status === 'waiting'

  return (
    <>
      <div className="page has-actions">
        <header className="header">
          <button className="icon-btn" aria-label="戻る" onClick={() => nav(-1)}><ChevronLeft size={22} /></button>
          <div className="grow">
            <h1>{agent.name}</h1>
            <StatusBadge status={agent.status} />
          </div>
        </header>

        <Card>
          <p className="desc">{agent.description}</p>
          <dl className="grid2">
            <div><dt>ノード</dt><dd className="mono-s">{agent.node}</dd></div>
            <div><dt>Pod</dt><dd className="mono-s">{agent.pod}</dd></div>
            <div><dt>経過時間</dt><dd className="mono-s">{fmtClock(agent.elapsedSec)}</dd></div>
            <div><dt>ツール呼び出し</dt><dd className="mono-s">{agent.toolCalls} 回</dd></div>
          </dl>
        </Card>

        <SectionTitle right="hooks から受信">ライブログ</SectionTitle>
        <Card className="log">
          {logs?.map((l) => (
            <div key={l.id} className="log-row mono-s">
              <span className="t">{l.time}</span>
              <span className="tool" style={{ color: TOOL_COLOR[l.tool] ?? '#E8EAED' }}>{l.tool}</span>
              <span className="arg">{l.arg}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="action-bar">
        {confirming ? (
          <>
            <span className="grow confirm-text">{agent.name} を停止しますか？</span>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>やめる</button>
            <button className="btn btn-stop" onClick={() => { stopAgent(id); setConfirming(false) }}>停止する</button>
          </>
        ) : (
          <>
            <Link to="/chat" className="btn btn-primary grow"><Send size={16} />指示を送る</Link>
            <button className="btn btn-stop" disabled={!active} onClick={() => setConfirming(true)}><Square size={14} />停止</button>
          </>
        )}
      </div>
    </>
  )
}
