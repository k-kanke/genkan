import type { ReactNode } from 'react'
import type { AgentStatus } from '../types'

export const STATUS: Record<AgentStatus, { label: string; color: string }> = {
  running: { label: 'Running', color: '#60A5FA' },
  waiting: { label: 'Awaiting approval', color: '#FBBF24' },
  done: { label: 'Done', color: '#9AA3AF' },
  stopped: { label: 'Stopped', color: '#FCA5A5' },
  failed: { label: 'Failed', color: '#F87171' },
}

export function StatusBadge({ status }: { status: AgentStatus }) {
  const s = STATUS[status]
  return (
    <span className="status" style={{ color: s.color }}>
      <i className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {right && <span className="muted-s">{right}</span>}
    </div>
  )
}

export function Bar({ value, color = '#60A5FA' }: { value: number; color?: string }) {
  return (
    <div className="bar">
      <div style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

export const shortNode = (n: string) => n.replace(/^ubuntu-/, '')
