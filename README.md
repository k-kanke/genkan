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

PWA は HTTPS（または localhost）でないと Service Worker が動かない。自宅k8sでは下記の Tailscale Ingress で `https://genkan.<TAILNET>` として公開する。

## Docker

```sh
docker build -t genkan .
docker run --rm -p 8080:8080 genkan
```

ビルドして `nginx-unprivileged`（非root・ポート8080）で静的配信する。SPA fallback、`/healthz`、キャッシュ制御（`index.html`・`sw.js`・`manifest.webmanifest` は no-cache、`/assets/*` は immutable）は `nginx.conf`。

## デプロイ（自宅k8s + Tailscale）

`main` に push → GitHub Actions（`.github/workflows/build.yml`）が `ghcr.io/k-kanke/genkan`（`sha-<短いID>` と `latest`、linux/amd64）を push → k8s に反映。マニフェストは `deploy/k8s/`（kustomize）。

### クラスタ側の前提（`kubernetes-platform` で一度だけ）
1. Tailscale 管理画面で **MagicDNS** と **HTTPS証明書** を有効にする
2. 管理画面で Operator 用の **OAuthクライアント**（Devices Core と Auth Keys の書き込み権限、タグ `tag:k8s-operator`）を作る
3. ACL の `tagOwners` に `tag:k8s-operator` と `tag:k8s` を追加する
4. Helm で Operator を入れる（OAuthのシークレットは Git に置かない）:
   ```sh
   helm repo add tailscale https://pkgs.tailscale.com/helmcharts && helm repo update
   helm upgrade --install tailscale-operator tailscale/tailscale-operator \
     -n tailscale --create-namespace \
     --set-string oauth.clientId=<CLIENT_ID> --set-string oauth.clientSecret=<CLIENT_SECRET> --wait
   ```

### デプロイ手順
- 初回: `kubectl apply -k deploy/k8s`
- 更新: main に push → Actions がイメージを push → `kubectl -n genkan rollout restart deploy/genkan`（Argo CD に移したら自動化）
- イメージを非公開にした場合: `deploy/k8s/deployment.yaml` の `imagePullSecrets` のコメントを外し、Secret を作る（PAT は `read:packages` のみ）:
  ```sh
  kubectl -n genkan create secret docker-registry ghcr-pull \
    --docker-server=ghcr.io --docker-username=k-kanke --docker-password=<PAT>
  ```
  ※ `kubectl apply -k` の前に `genkan` namespace が必要なので、先に `kubectl apply -f deploy/k8s/namespace.yaml` する。
- 初回 push 後、GHCR のパッケージは private で作られる。公開リポジトリのまま使うなら、パッケージ設定で Public にするか、上記 `ghcr-pull` を使う。

### スマホでの使い方
Tailscale をオンにして `https://genkan.<TAILNET>`（`<TAILNET>` は例: `tail1234.ts.net`）を開き、「ホーム画面に追加」。

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
<!-- genkan task check -->
