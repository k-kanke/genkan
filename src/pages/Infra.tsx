import { ExternalLink, Plus } from 'lucide-react'
import { getNodes } from '../api'
import { tools } from '../config/tools'
import { Card, SectionTitle } from '../components/ui'
import { useLive } from '../useLive'

export default function Infra() {
  const nodes = useLive(getNodes, ['nodes'])
  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>インフラ</h1>
          <p className="sub">自宅サーバーのツールに Tailscale 経由でアクセス</p>
        </div>
      </header>

      <SectionTitle>クラスタ</SectionTitle>
      <Card className="list">
        {nodes?.map((n) => (
          <div key={n.name} className="list-row">
            <div className="grow">
              <div className="mono">{n.name}</div>
              <div className="muted-s mono-s">{n.role}{n.note ? ` · ${n.note}` : ''} · {n.ip}</div>
            </div>
            <span className="status" style={{ color: '#4ADE80' }}><i className="dot" style={{ background: '#4ADE80' }} />Ready</span>
          </div>
        ))}
      </Card>

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
