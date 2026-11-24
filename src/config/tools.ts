import type { ToolLink } from '../types'

/** インフラ画面に並ぶツール。増減はこの配列を編集するだけ。url '#' は未設定。 */
export const tools: ToolLink[] = [
  { name: 'Proxmox VE', description: 'VM・ホストの管理', url: 'https://192.168.0.184:8006' },
  { name: 'Grafana', description: 'メトリクス・ダッシュボード', url: 'http://192.168.0.13:3000' },
  { name: 'Prometheus', description: 'クエリ・アラート', url: 'http://192.168.0.20:30090' },
  { name: 'Hubble UI', description: 'Cilium の通信フロー', url: '#' },
  { name: 'Longhorn UI', description: 'ボリュームとレプリカ', url: '#' },
  { name: 'code-server', description: 'ブラウザで開発', url: '#' },
]
