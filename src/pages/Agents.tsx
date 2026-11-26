import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getAgents, getNodes, getSummary } from '../api'
import ApprovalCard from '../components/ApprovalCard'
import { Bar, Card, SectionTitle, StatusBadge, shortNode } from '../components/ui'
import { fmtMinutes, useLive } from '../useLive'

export default function Agents() {
  const agents = useLive(getAgents, ['agents'])
  const nodes = useLive(getNodes, ['nodes', 'agents'])
  const summary = useLive(getSummary, ['agents'])
  const waiting = agents?.filter((a) => a.status === 'waiting') ?? []

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Agents</h1>
          <p className="sub mono-s">home-k8s · Tailscale connected</p>
        </div>
        <span className="live"><i className="dot pulse" />LIVE</span>
      </header>

      <div className="stats">
        <Card className="stat"><b style={{ color: '#60A5FA' }}>{summary?.running ?? '–'}</b><span>Running</span></Card>
        <Card className="stat"><b style={{ color: '#FBBF24' }}>{summary?.waiting ?? '–'}</b><span>Awaiting approval</span></Card>
        <Card className="stat"><b>{summary?.doneToday ?? '–'}</b><span>Done today</span></Card>
      </div>

      {waiting.map((a) => <ApprovalCard key={a.id} agent={a} />)}

      <SectionTitle>Nodes</SectionTitle>
      <div className="stack">
        {nodes?.filter((n) => n.role === 'worker').map((n) => (
          <Card key={n.name}>
            <div className="row between">
              <span className="mono">{n.name}</span>
              <span className="muted-s">{n.agentCount} {n.agentCount === 1 ? 'agent' : 'agents'}</span>
            </div>
            <div className="meter"><span>CPU</span><Bar value={n.cpu} /><em>{n.cpu}%</em></div>
            <div className="meter"><span>MEM</span><Bar value={n.mem} color="#A5B4FC" /><em>{n.mem}%</em></div>
          </Card>
        ))}
      </div>

      <SectionTitle>Active agents</SectionTitle>
      <div className="stack">
        {agents?.map((a) => (
          <Link key={a.id} to={`/agents/${a.id}`} className="card agent-card">
            <div className="grow">
              <div className="row between">
                <b>{a.name}</b>
                <StatusBadge status={a.status} />
              </div>
              <div className="task">{a.task}</div>
              <div className="meta mono-s">{shortNode(a.node)} · {fmtMinutes(a.elapsedSec)} · {a.lastAction}</div>
            </div>
            <ChevronRight size={18} color="#9AA3AF" />
          </Link>
        ))}
      </div>
    </div>
  )
}
