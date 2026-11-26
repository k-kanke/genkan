import { ShieldAlert } from 'lucide-react'
import { approveAgent, rejectAgent } from '../api'
import type { Agent } from '../types'

export default function ApprovalCard({ agent }: { agent: Agent }) {
  return (
    <div className="approval">
      <div className="approval-head">
        <ShieldAlert size={18} />
        <b>{agent.name} is asking for approval</b>
      </div>
      <code className="code-block">{agent.pendingCommand}</code>
      <div className="row gap">
        <button className="btn btn-approve" onClick={() => approveAgent(agent.id)}>Approve</button>
        <button className="btn btn-reject" onClick={() => rejectAgent(agent.id)}>Reject</button>
      </div>
    </div>
  )
}
