/**
 * チャットの文から、「どのリポジトリへの依頼か」を読み取る(ルールベース。LLM は使わない)。
 *
 * - `owner/name` と書かれていれば、それを使う。
 * - なければ、既知のリポジトリ名(KNOWN_REPOS)が単語として出てくるかを見る。
 * 見つからなければ null(通常の会話として扱う)。依頼を実際に出す前には、画面で必ず確認を取る。
 */

export const OWNER = 'k-kanke'

/** 名前だけで呼べるリポジトリ(Control Plane 側の許可パターンとは別。ここは入力の補助)。 */
export const KNOWN_REPOS = ['genkan', 'ai-app-platform', 'kubernetes-platform']

const FULL = /(?<![\w./-])([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9._-]{1,100})(?![\w/-])/

export interface Intent {
  repo: string // "owner/name"
  /** リポジトリ名の指定を除いた、依頼の本文 */
  prompt: string
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 依頼の本文から、リポジトリ名の呼びかけを取り除く。
 * 英語: "In genkan, add …" / "genkan: add …" / "… of ai-app-platform"。日本語: 「genkan で」「genkan の」「genkan を」など。
 */
function stripMention(text: string, mention: string): string {
  const m = escapeRe(mention)
  const forms = [
    // English: a preposition before the name ("in genkan", "for k-kanke/genkan"), with an optional "repo" and a comma or colon
    new RegExp(`\\b(?:in|on|for|at|to|of|from)\\s+${m}(?![\\w./-])\\s*(?:repo(?:sitory)?\\b)?\\s*[,:]?\\s*`, 'i'),
    // English: the name first, followed by a comma or colon ("genkan: add …")
    new RegExp(`${m}\\s*[,:：]\\s*`, 'i'),
    // Japanese particles after the name (or just the name)
    new RegExp(`${m}\\s*(?:リポジトリ|repo|repository)?\\s*(?:で|の|を|に|は|について)?[、,:：]?\\s*`, 'i'),
  ]
  for (const re of forms) {
    if (re.test(text)) {
      const out = text.replace(re, ' ').replace(/\s+/g, ' ').trim()
      return out || text.trim()
    }
  }
  return text.trim()
}

export function parseIntent(text: string): Intent | null {
  const t = text.trim()
  if (!t || /https?:\/\//i.test(t)) return null // URL を含む文は、依頼ではなく通常の会話として扱う
  const full = FULL.exec(t)
  if (full) {
    return { repo: `${full[1]}/${full[2]}`, prompt: stripMention(t, full[0]) }
  }
  for (const name of KNOWN_REPOS) {
    const re = new RegExp(`(?<![A-Za-z0-9._-])${escapeRe(name)}(?![A-Za-z0-9._-])`, 'i')
    const m = re.exec(t)
    if (m) return { repo: `${OWNER}/${name}`, prompt: stripMention(t, m[0]) }
  }
  return null
}
