import { ShieldAlert } from 'lucide-react'
import { approveAgent, rejectAgent } from '../api'
import type { Agent } from '../types'

export default function ApprovalCard({ agent }: { agent: Agent }) {
  return (
    <div className="approval">
      <div className="approval-head">
        <ShieldAlert size={18} />
        <b>{agent.name} が承認を求めています</b>
      </div>
      <code className="code-block">{agent.pendingCommand}</code>
      <div className="row gap">
        <button className="btn btn-approve" onClick={() => approveAgent(agent.id)}>承認</button>
        <button className="btn btn-reject" onClick={() => rejectAgent(agent.id)}>却下</button>
      </div>
    </div>
  )
}
