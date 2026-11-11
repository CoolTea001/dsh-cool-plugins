/**
 * One-time tag backfill for articles written before tags existed.
 *
 * New generations ask the model for tags in the same JSON answer that carries
 * the article, so they need nothing here. Files that predate that field still
 * deserve tags drawn from their content rather than from their section
 * headings, so the plugin asks the model once per file at startup and writes the
 * answer into the front matter — the file stays the single source of truth, and
 * a later start finds the tags already there and does nothing.
 *
 * Tagging is best effort: no session, no retry loop, and a failure simply
 * leaves the file for the next start. Nothing the page shows waits on it.
 */

import { cleanTags, listArticles, readArticle, readStoredTags, setArticleTags } from './articles.js'
import { callLlmText } from './generate.js'
import type { ArticleDetail } from '../shared/contract.js'

/** How long one tagging call may run. */
const TAG_TIMEOUT_MS = 60_000

/** How much body text one tagging call reads. */
const BODY_LIMIT = 2000

/** Pause between two attempts on the same article. */
const RETRY_DELAY_MS = 2000

/** How long after startup the first backfill may run. */
const START_DELAY_MS = 3000

/** The system message: extraction only, never prose. */
const TAG_SYSTEM = [
  '你是文章标签提取器。',
  '根据给定的标题、分类和正文，给出 3-5 个短标签，每个 2-6 个字。',
  '标签要概括正文里的具体主题、方法或对象，例如「判断力」「手动训练」「核查成本」。',
  '不要写宽泛的词（如「思考」「方法」「效率」），不要与分类重复，不要带标点。',
  '只输出一个 JSON 字符串数组，例如 ["判断力","手动训练","核查成本"]，不要输出其他内容。',
].join('\n')

/** Read the model's tag list, accepting a bare array or a comma-separated line. */
function parseTags(raw: string): string[] {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const parsed: unknown = JSON.parse(raw.slice(start, end + 1))
      if (Array.isArray(parsed)) return cleanTags(parsed)
    } catch {
      // Fall through to the plain text spelling.
    }
  }
  const line = raw.split(/\r?\n/u).map(part => part.trim()).find(part => part !== '') ?? ''
  return cleanTags(line.split(/[，,、\s]+/u))
}

/** Wait one beat between attempts. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

/** Ask the model for one article's tags. */
async function askTags(ctx: any, article: ArticleDetail): Promise<string[]> {
  const answer = await callLlmText(ctx, {
    system: TAG_SYSTEM,
    user: [
      `标题：${article.title}`,
      `分类：${article.category}`,
      '',
      '正文：',
      article.content.slice(0, BODY_LIMIT),
    ].join('\n'),
    maxTokens: 200,
    temperature: 0.2,
    timeoutMs: TAG_TIMEOUT_MS,
  })
  return parseTags(answer)
}

/**
 * Tag every stored article that has none yet.
 *
 * Files are visited one at a time so a cold start never fires a burst of model
 * calls; each failure is swallowed and simply retried by the next start.
 */
export async function backfillTags(ctx: any): Promise<void> {
  let articles
  try {
    articles = await listArticles()
  } catch {
    return
  }
  for (const article of articles) {
    if (await readStoredTags(article.id) !== undefined) continue
    const detail = await readArticle(article.id)
    if (detail === undefined) continue
    // Two attempts: a transient provider refusal should not leave the file
    // untagged until the next restart.
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const tags = await askTags(ctx, detail)
        if (tags.length > 0) await setArticleTags(article.id, tags)
        break
      } catch {
        if (attempt === 2) break
        await sleep(2000)
      }
    }
  }
}

/**
 * Schedule the backfill a few seconds after startup.
 * @returns the disposer that cancels a backfill that has not begun yet.
 */
export function startTagBackfill(ctx: any): () => void {
  const timer = setTimeout(() => { void backfillTags(ctx) }, START_DELAY_MS)
  return () => { clearTimeout(timer) }
}
