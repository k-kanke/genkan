# genkan（指令室）

自宅ホームラボをスマホから見渡して操作するための入口アプリ（PWA）。現状は **UIのみ・データはすべてモック**。

- **エージェント**: k8s上で並列に動くAIエージェントの一覧・詳細（ライブログ）・承認/停止
- **指令**: オーケストレーターとのチャット
- **インフラ**: クラスタ状態と、Proxmox / Grafana などへのポータル
- **開発**: 未実装（タブは `src/config/tabs.ts` に1行足せば増やせる）

## 起動

```sh
npm install
npm run dev        # http://localhost:5173 （スマホ幅 390px で表示）
npm run build      # dist/ に本番ビルド（PWA の service worker も生成）
npm run preview
```

PWA は HTTPS（または localhost）で配信したときにホーム画面へ追加できる。Tailscale 経由なら `tailscale serve` などでHTTPS化する。

## Docker

```sh
docker build -t genkan .
docker run --rm -p 8080:80 genkan
```

ビルドして nginx で静的配信する（SPA 用の fallback 設定は `nginx.conf`）。

## 設計: `src/api/` を差し替えれば本物のAPIにつながる

```
画面 (pages/components) ──▶ src/api/index.ts ──▶ src/mock/store.ts   ← 今はここ
                                    └────────▶ 将来: fetch / EventSource
```

- 画面は `mock/` を直接触らず、`src/api/index.ts` の関数（Promiseを返す）だけを使う。
- リアルタイム更新は `subscribe(topic, cb)`。モックでは `setInterval` で再現しており、将来は `EventSource`（SSE）に置き換える。
  - topic: `agents` / `nodes` / `chat` / `logs:<agentId>`
- 本物のAPIにする手順: `src/api/index.ts` の各関数を `fetch('/api/...')` に、`subscribe` を SSE に書き換える。**シグネチャは変えない**ので画面側は無修正。
- 型は `src/types.ts`、インフラ画面のツール一覧は `src/config/tools.ts`、タブ定義は `src/config/tabs.ts`。

## スタイル

素のCSS（`src/styles.css`）。フォントは Noto Sans JP / JetBrains Mono（`@fontsource` で同梱、オフライン可）。
