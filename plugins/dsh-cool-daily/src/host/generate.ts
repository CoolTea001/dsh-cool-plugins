/**
 * Generation: one model call per batch, turned into Markdown files.
 *
 * The Host asks the currently selected default model for a JSON array of
 * articles, validates what came back, and writes each article through the
 * article store. The call goes through `ctx.llm` directly rather than through a
 * Session, so a daily batch costs one request and leaves no conversation
 * behind — and so the scheduler can run with no Session at all.
 *
 * The prompt asks for Markdown; the model's answer is parsed into title,
 * category, and body. A malformed answer is not thrown away: the body is kept as
 * one article so a partial result still reaches the page, and the parse problem
 * becomes a notice rather than an empty day.
 */

import { randomUUID } from 'node:crypto'
import type { DailyModel, DailySettings, ArticleSummary } from '../shared/contract.js'
import { cleanTags, localDate, saveArticle, type GeneratedArticle } from './articles.js'
import { readSettings } from './settings.js'

/** Longest one batch may run before it is cancelled. */
const GENERATION_TIMEOUT_MS = 4 * 60_000

/** Upper bound on the model's answer, in tokens. */
const MAX_TOKENS = 16000

/** The in-memory generation state the page polls. */
interface GenerationRuntime {
  generating: boolean
  lastError: string | null
  lastFinishedAt: string | null
}

const runtime: GenerationRuntime = {
  generating: false,
  lastError: null,
  lastFinishedAt: null,
}

/** Read the current in-memory generation state. */
export function generationState(): Readonly<GenerationRuntime> {
  return { ...runtime }
}

/** One opaque id per generation, used only as the provider's routing header. */
function sessionIdForBatch(): string {
  return `cool-daily-${randomUUID()}`
}

/** The slice of the Host LLM service this plugin uses. */
interface LlmService {
  stream(options: {
    provider: string
    model: string
    system?: string
    messages: Array<{ role: 'user'; content: Array<{ type: 'text'; text: string }> }>
    temperature?: number
    reasoningEffort?: string
    maxTokens?: number
    signal?: AbortSignal
    sessionId?: string
  }): AsyncIterable<StreamChunkLike>
}

/** The chunk fields this plugin reads; the rest of the wire shape is ignored. */
interface StreamChunkLike {
  type: string
  text?: string
  reason?: {
    kind: string
    failure?: { message?: string; code?: string }
  }
}

/** The slice of the default-model service this plugin reads. */
interface DefaultModelService {
  currentSelection(): { provider?: unknown; model?: unknown; reasoningEffort?: unknown }
}

/** The system message for one batch. */
function systemPrompt(count: number): string {
  return [
    '你是「每日贴」的专栏作者，为读者持续产出值得阅读的原创短文。',
    `本轮需要写 ${count} 篇文章，每篇彼此独立：主题不同、角度不同，不要重复同一论点。`,
    '',
    '只输出一个 JSON 数组，不要输出解释、前言或 Markdown 代码围栏。数组恰好包含以下对象：',
    '{ "title": "文章标题", "category": "分类", "tags": ["标签1", "标签2", "标签3"], "content": "Markdown 正文" }',
    '',
    '写作用户指定的语言。要求：',
    '- title：具体、有信息量，不超过 30 字，不写序号。',
    '- category：2-6 个字的短分类，用于列表筛选（例如：科技、学习、效率、生活、观点）。',
    '- tags：3-5 个短标签，每个 2-6 字，从正文内容里提炼具体主题、方法或对象，供列表展示；不要与 category 重复，也不要写宽泛的词（如「思考」「方法」）。',
    '- content：完整的 Markdown 正文，600-900 字；包含一级或二级小标题、自然段落，必要时使用列表或引用；不要出现文章标题本身，不要使用代码围栏包裹全文。',
    '- 观点要有依据，方法要可执行，避免空泛的口号与营销腔。',
  ].join('\n')
}

/** The user message: the topic instruction plus the batch shape. */
function userPrompt(settings: DailySettings, date: string): string {
  return [
    `日期：${date}`,
    `主题与要求：${settings.prompt}`,
    `请按上述要求生成 ${settings.count} 篇文章，并只返回 JSON 数组。`,
  ].join('\n')
}

/**
 * Resolve the model route the rest of DSH uses for its default selection.
 *
 * @throws when no default model is configured, which is also why the model
 *   cannot be resolved per batch at settings-save time.
 */
function resolveModel(
  ctx: any,
  pinned?: DailyModel | null,
): { provider: string; model: string; reasoningEffort?: string } {
  // A route this plugin pinned wins over DSH's default; the pinned route is only
  // ever written by the settings dialog, which lists what the service offers.
  if (pinned !== undefined && pinned !== null && pinned.provider !== '' && pinned.model !== '') {
    return {
      provider: pinned.provider,
      model: pinned.model,
      ...(pinned.reasoningEffort === undefined ? {} : { reasoningEffort: pinned.reasoningEffort }),
    }
  }
  const service = ctx.get('agentDefaultModel') as DefaultModelService | undefined
  const selection = service?.currentSelection()
  const provider = selection?.provider
  const model = selection?.model
  const effort = selection?.reasoningEffort
  if (typeof provider !== 'string' || typeof model !== 'string' || provider === '' || model === '') {
    throw new Error('尚未配置默认模型，无法生成每日贴')
  }
  return {
    provider,
    model,
    ...(typeof effort === 'string' && effort !== '' ? { reasoningEffort: effort } : {}),
  }
}

/** Translate one failed stream chunk into an error message. */
function failureMessage(chunk: StreamChunkLike): string {
  const failure = chunk.reason?.failure
  const code = failure?.code === undefined ? '' : ` (${failure.code})`
  return `${chunk.reason?.kind === 'aborted' ? '生成已取消' : '模型调用失败'}${code}：${failure?.message ?? '未知错误'}`
}

/** One complete model call, shaped by the caller's prompt. */
export interface LlmCallOptions {
  /** The system message. */
  system: string
  /** The single user message. */
  user: string
  /** Answer cap, in tokens. */
  maxTokens: number
  /** Sampling temperature. */
  temperature: number
  /** How long the call may run before it is cancelled. */
  timeoutMs: number
  /** The route to call; omitted or null follows DSH's current default. */
  model?: DailyModel | null
}

/**
 * Run one model call and return its complete text.
 *
 * The stream is drained into one string; a terminal `error` or `aborted` chunk
 * becomes a thrown error, and a stream that ends without any terminal chunk is
 * treated as a failure instead of a silent empty answer. The call is stateless:
 * nothing here belongs to a Session.
 */
export async function callLlmText(ctx: any, options: LlmCallOptions): Promise<string> {
  const llm = ctx.get('llm') as LlmService | undefined
  if (llm === undefined) throw new Error('LLM 服务未就绪，无法生成每日贴')
  const { provider, model, reasoningEffort } = resolveModel(ctx, options.model)

  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, options.timeoutMs)
  let text = ''
  let finished = false
  try {
    for await (const chunk of llm.stream({
      provider,
      model,
      ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
      system: options.system,
      messages: [{ role: 'user', content: [{ type: 'text', text: options.user }] }],
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      signal: controller.signal,
      // Some provider adapters route requests by a session header. Nothing in
      // this call is a Session, but an identifier per call keeps that routing
      // working without inventing a conversation.
      sessionId: sessionIdForBatch(),
    })) {
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
      if (chunk.type !== 'finish') continue
      finished = true
      if (chunk.reason?.kind === 'error' || chunk.reason?.kind === 'aborted') throw new Error(failureMessage(chunk))
      if (chunk.reason?.kind !== 'stop') throw new Error(`模型返回了未完成的结束原因：${chunk.reason?.kind ?? 'unknown'}`)
    }
  } finally {
    clearTimeout(timer)
  }
  if (!finished) throw new Error('模型流在结束前中断，未收到完整结果')
  return text.trim()
}

/** Run one generation batch and return the model's answer. */
function callModel(ctx: any, settings: DailySettings, date: string): Promise<string> {
  return callLlmText(ctx, {
    system: systemPrompt(settings.count),
    user: userPrompt(settings, date),
    maxTokens: MAX_TOKENS,
    temperature: 0.7,
    timeoutMs: GENERATION_TIMEOUT_MS,
    model: settings.model,
  })
}

/** One object in the model's JSON array, before validation. */
interface RawArticle {
  title?: unknown
  category?: unknown
  tags?: unknown
  content?: unknown
}

/** Keep the model's category short enough for a badge, or fall back. */
function categoryOf(value: unknown): string {
  if (typeof value !== 'string') return '每日贴'
  const category = value.trim().replace(/\s+/g, ' ')
  return category === '' ? '每日贴' : category.slice(0, 8)
}

/** Whether one parsed entry has the two fields an article cannot do without. */
function isRawArticle(value: unknown): value is RawArticle {
  return value !== null && typeof value === 'object'
}

/**
 * Parse the model's answer into at most `count` articles.
 *
 * The answer may be bare JSON or a fenced block; both are accepted. When
 * nothing usable comes back, the raw text is kept as one article so the day is
 * not silently empty.
 */
export function parseGenerated(raw: string, count: number, date: string): GeneratedArticle[] {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  const candidate = fenced === null ? raw : fenced[1]
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const parsed: unknown = JSON.parse(candidate.slice(start, end + 1))
      if (Array.isArray(parsed)) {
        const articles: GeneratedArticle[] = []
        for (const entry of parsed) {
          if (!isRawArticle(entry)) continue
          const title = typeof entry.title === 'string' ? entry.title.trim().slice(0, 60) : ''
          const content = typeof entry.content === 'string' ? entry.content.trim() : ''
          if (title === '' || content === '') continue
          const tags = Array.isArray(entry.tags) ? cleanTags(entry.tags) : []
          articles.push({ title, category: categoryOf(entry.category), tags, content })
          if (articles.length >= count) break
        }
        if (articles.length > 0) return articles
      }
    } catch {
      // Fall through to keeping the raw answer.
    }
  }
  if (raw.trim() === '') throw new Error('模型没有返回内容')
  return [{ title: `${date} 每日贴`, category: '每日贴', tags: [], content: raw.trim() }]
}

/**
 * Generate and store one batch.
 *
 * Only one batch runs at a time: the scheduler and the page's manual button
 * share this guard, so a second request is refused instead of doubling the
 * model bill. The returned summary is the stored articles, newest last.
 */
export async function generateNow(
  ctx: any,
): Promise<{ ok: true; articles: ArticleSummary[] } | { ok: false; error: string }> {
  if (runtime.generating) return { ok: false, error: '正在生成每日贴，请稍候' }
  runtime.generating = true
  runtime.lastError = null
  try {
    const settings = await readSettings()
    const date = localDate()
    const raw = await callModel(ctx, settings, date)
    const generated = parseGenerated(raw, settings.count, date)
    const stored: ArticleSummary[] = []
    for (const [index, article] of generated.entries()) {
      stored.push(await saveArticle(article, date, index))
    }
    runtime.lastFinishedAt = new Date().toISOString()
    return { ok: true, articles: stored }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    runtime.lastError = message
    return { ok: false, error: message }
  } finally {
    runtime.generating = false
  }
}

/**
 * Start one batch in the background.
 *
 * Routes and the scheduler both call this: the HTTP answer returns immediately
 * and the page follows progress through the state route, so a slow model call
 * never holds a request open or blocks the browser.
 *
 * @returns false when a batch was already running, so the caller can tell the
 *   user their click was not queued.
 */
export function startGeneration(ctx: any): boolean {
  if (runtime.generating) return false
  void generateNow(ctx)
  return true
}
