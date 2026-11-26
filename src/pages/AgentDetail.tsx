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

  if (!agent) return <div className="page"><p className="muted-s">Loading…</p></div>
  const active = agent.status === 'running' || agent.status === 'waiting'

  return (
    <>
      <div className="page has-actions">
        <header className="header">
          <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)}><ChevronLeft size={22} /></button>
          <div className="grow">
            <h1>{agent.name}</h1>
            <StatusBadge status={agent.status} />
          </div>
        </header>

        <Card>
          <p className="desc">{agent.description}</p>
          <dl className="grid2">
            <div><dt>Node</dt><dd className="mono-s">{agent.node}</dd></div>
            <div><dt>Pod</dt><dd className="mono-s">{agent.pod}</dd></div>
            <div><dt>Elapsed</dt><dd className="mono-s">{fmtClock(agent.elapsedSec)}</dd></div>
            <div><dt>Tool calls</dt><dd className="mono-s">{agent.toolCalls}</dd></div>
          </dl>
        </Card>

        <SectionTitle right="received from hooks">Live log</SectionTitle>
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
            <span className="grow confirm-text">Stop {agent.name}?</span>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn btn-stop" onClick={() => { stopAgent(id); setConfirming(false) }}>Stop</button>
          </>
        ) : (
          <>
            <Link to="/chat" className="btn btn-primary grow"><Send size={16} />Send instruction</Link>
            <button className="btn btn-stop" disabled={!active} onClick={() => setConfirming(true)}><Square size={14} />Stop</button>
          </>
        )}
      </div>
    </>
  )
}
