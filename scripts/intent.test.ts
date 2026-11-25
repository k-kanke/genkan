// チャットの依頼の読み取り(src/chat/intent.ts)のテスト。`npm test` で実行する。
import { parseIntent } from '../src/chat/intent'

const cases: [string, string | null, string?][] = [
  ['genkan app のインフラ画面のコンテナ詳細はトグルにしまってください。', 'k-kanke/genkan', 'app のインフラ画面のコンテナ詳細はトグルにしまってください。'],
  ['k-kanke/genkan のインフラ画面のコンテナ詳細をトグルにしまって', 'k-kanke/genkan', 'インフラ画面のコンテナ詳細をトグルにしまって'],
  ['genkanでタスク画面に検索を足して', 'k-kanke/genkan', 'タスク画面に検索を足して'],
  ['someone-else/tool のREADMEを直して', 'someone-else/tool'],
  ['ai-app-platform の docs を整理して', 'k-kanke/ai-app-platform', 'docs を整理して'],
  ['kubernetes-platform にリポジトリを足して', 'k-kanke/kubernetes-platform'],
  ['今日のエージェントの状況は?', null],
  ['https://github.com/k-kanke/genkan を見て', null],
  ['genkanai の話', null],
  ['', null],
  ['a/b/c のこと', null],
]

let bad = 0
for (const [text, repo, prompt] of cases) {
  const got = parseIntent(text)
  const ok = (got?.repo ?? null) === repo && (prompt === undefined || got?.prompt === prompt)
  if (!ok) {
    bad++
    console.log('FAIL', JSON.stringify(text), '->', JSON.stringify(got), 'want', repo, prompt)
  }
}
console.log(bad ? `${bad} failed` : `all ${cases.length} intent cases pass`)
process.exit(bad ? 1 : 0)
