import { useEffect, useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { getCluster } from '../api'
import { tools } from '../config/tools'
import { Bar, Card, SectionTitle } from '../components/ui'
import type { ClusterPod, ClusterView } from '../types'

const REFRESH_MS = 10_000
const OK = '#4ADE80', WARN = '#FBBF24', BAD = '#F87171', DONE = '#9AA3AF'

/** 完了済みの Job Pod は薄く、問題のある Pod は赤く見せる */
function podColor(p: ClusterPod) {
  if (p.phase === 'Succeeded') return DONE
  if (p.phase === 'Running' && !p.reason) return OK
  if (p.phase === 'Pending') return WARN
  return BAD
}

function PodRow({ p }: { p: ClusterPod }) {
  const c = podColor(p)
  return (
    <div className="pod-row">
      <i className="dot" style={{ background: c }} />
      <span className="mono-s pod-name">{p.name}</span>
      <span className="muted-s">{p.reason ?? p.phase}{p.restarts > 0 ? ` · ↻${p.restarts}` : ''}</span>
    </div>
  )
}

function NodeCard({ n }: { n: ClusterView['nodes'][number] }) {
  const byNs = new Map<string, ClusterPod[]>()
  for (const p of n.pods) byNs.set(p.namespace, [...(byNs.get(p.namespace) ?? []), p])
  const running = n.pods.filter((p) => p.phase === 'Running').length
  const state = !n.ready ? { t: 'NotReady', c: BAD } : n.unschedulable ? { t: 'Cordon', c: WARN } : { t: 'Ready', c: OK }
  return (
    <Card className="node-card">
      <div className="row between">
        <div className="grow">
          <div className="mono">{n.name}</div>
          <div className="muted-s mono-s">{n.role} · {n.ip}</div>
        </div>
        <span className="status" style={{ color: state.c }}><i className="dot" style={{ background: state.c }} />{state.t}</span>
      </div>
      {n.cpu !== undefined && n.mem !== undefined && (
        <div className="node-bars">
          <span className="muted-s">CPU {n.cpu}%</span><Bar value={Math.min(n.cpu, 100)} />
          <span className="muted-s">MEM {n.mem}%</span><Bar value={Math.min(n.mem, 100)} color="#A78BFA" />
        </div>
      )}
      <div className="muted-s" style={{ margin: '10px 0 4px' }}>Pod {running} 稼働 / {n.pods.length} 個</div>
      {[...byNs].sort(([a], [b]) => a.localeCompare(b)).map(([ns, pods]) => (
        <details key={ns} className="ns" open={ns === 'genkan' || undefined}>
          <summary><span className="mono-s">{ns}</span> <span className="muted-s">{pods.length}</span></summary>
          {pods.map((p) => <PodRow key={p.name} p={p} />)}
        </details>
      ))}
    </Card>
  )
}

export default function Infra() {
  const [cluster, setCluster] = useState<ClusterView>()
  useEffect(() => {
    let alive = true
    const load = () => getCluster().then((v) => alive && setCluster(v))
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>インフラ</h1>
          <p className="sub">自宅サーバーのツールに Tailscale 経由でアクセス</p>
        </div>
      </header>

      <SectionTitle right={cluster && (cluster.live ? '10秒ごとに更新' : 'モック表示（クラスタ未接続）')}>クラスタ</SectionTitle>
      <div className="nodes">
        {cluster?.nodes.map((n) => <NodeCard key={n.name} n={n} />)}
      </div>
      {cluster && cluster.unscheduled.length > 0 && (
        <Card className="node-card">
          <div className="muted-s">未割り当て（Pending）</div>
          {cluster.unscheduled.map((p) => <PodRow key={p.name} p={p} />)}
        </Card>
      )}

      <SectionTitle>ツール</SectionTitle>
      <div className="tools">
        {tools.map((t) => (
          <a key={t.name} className="card tool" href={t.url} target="_blank" rel="noopener noreferrer"
             onClick={(e) => { if (t.url === '#') e.preventDefault() }}>
            <div className="row between"><b>{t.name}</b>{t.url !== '#' && <ExternalLink size={14} color="#9AA3AF" />}</div>
            <span className="muted-s">{t.description}</span>
            {t.url === '#' && <span className="tbd mono-s">未設定</span>}
          </a>
        ))}
      </div>

      <button className="add-service" disabled><Plus size={16} />サービスを追加（後で）</button>
    </div>
  )
}
