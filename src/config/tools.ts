import type { ToolLink } from '../types'

/** インフラ画面に並ぶツール。増減はこの配列を編集するだけ。url '#' は未設定。 */
export const tools: ToolLink[] = [
  { name: 'Authentik', description: 'Identity provider · fingerprint', url: 'https://auth.home.kanke-aap-gen.com/if/user/' },
  { name: 'Grafana', description: 'Metrics and dashboards · SSO', url: 'http://192.168.0.13:3000' },
  { name: 'Proxmox DM', description: 'Both Proxmox hosts in one view · SSO', url: 'https://192.168.0.15:8443' },
  { name: 'AFFiNE', description: 'Notes and documents · AFFiNE account', url: 'https://affine.tail22a1be.ts.net/workspace/7e8a53ca-7143-4cbf-85bb-4b3eaeae77eb/all' },
  { name: 'Prometheus', description: 'Queries and alerts · no login', url: 'http://192.168.0.20:30090' },
  { name: 'Proxmox (NEC)', description: 'Emergency use · root@pam', url: 'https://192.168.0.184:8006' },
  { name: 'Proxmox (mini PC)', description: 'Emergency use · root@pam', url: 'https://192.168.0.145:8006' },
  { name: 'ArgoCD', description: 'GitOps and deployments', url: 'http://argocd.home' },
  { name: 'Hubble UI', description: 'Cilium traffic flows', url: '#' },
]
