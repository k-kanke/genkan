import type { ToolLink } from '../types'

/** インフラ画面に並ぶツール。増減はこの配列を編集するだけ。url '#' は未設定。 */
export const tools: ToolLink[] = [
  { name: 'Proxmox DM', description: '2台のProxmoxを1画面で', url: 'https://192.168.0.15:8443' },
  { name: 'Grafana', description: 'メトリクス・ダッシュボード', url: 'http://192.168.0.13:3000' },
  { name: 'Prometheus', description: 'クエリ・アラート', url: 'http://192.168.0.20:30090' },
  { name: 'Hubble UI', description: 'Cilium の通信フロー', url: '#' },
  { name: 'ArgoCD', description: 'GitOps・デプロイ管理', url: 'http://argocd.home' },
  { name: 'AFFiNE', description: 'ノート・ドキュメント', url: 'https://affine.tail22a1be.ts.net/workspace/7e8a53ca-7143-4cbf-85bb-4b3eaeae77eb/all' },
]
