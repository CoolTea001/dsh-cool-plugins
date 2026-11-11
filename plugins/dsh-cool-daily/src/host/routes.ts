/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context of its own, so every question it asks
 * crosses a same-origin route registered on the `webServer` carrier. Each route
 * answers JSON and never rejects: a transport or service failure becomes an
 * `{ ok: false }` result the page draws in its own error state.
 *
 * The Host stays authoritative about the data: the page names an article id but
 * never a directory, and settings are validated on the way in rather than trusted
 * from the browser.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { API_PATHS, API_PREFIX, type DailyStatePayload } from '../shared/contract.js'
import { deleteArticle, isArticleId, listArticles, readArticle } from './articles.js'
import { generationState, startGeneration } from './generate.js'
import { defaultSelection, readModelEfforts, readModelGroups } from './models.js'
import { forgetRead, markRead } from './reads.js'
import { readSettings, writeSettings } from './settings.js'

/** Longest body a settings write accepts. */
const MAX_BODY_BYTES = 64 * 1024

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

/** Answer 405 unless the request uses one of the allowed methods. */
function methodAllowed(req: IncomingMessage, res: ServerResponse, allowed: readonly string[]): boolean {
  if (allowed.includes(req.method ?? '')) return true
  sendJson(res, 405, { ok: false, error: 'method not allowed' })
  return false
}

/**
 * Read a JSON object body, bounded before it is parsed.
 *
 * @throws when the body is too large or is not a JSON object.
 */
async function readBody(req: IncomingMessage, limit: number): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk as Uint8Array)
    size += buffer.length
    if (size > limit) throw new Error('body is too large')
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return {}
  const parsed: unknown = JSON.parse(text)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('body must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

/**
 * Reject a cross-site request.
 *
 * These routes read and write this user's own article directory, so a page on
 * another origin has no business asking. A same-origin `fetch` omits `Origin` on
 * some requests, so an absent header is allowed.
 */
export function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers?.origin
  if (typeof origin !== 'string' || origin === '' || origin === 'null') return true
  const host = req.headers?.host
  if (typeof host !== 'string' || host === '') return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** Answer the current page state. */
async function handleState(res: ServerResponse): Promise<void> {
  const [settings, articles] = await Promise.all([readSettings(), listArticles()])
  const generation = generationState()
  const payload: DailyStatePayload = {
    ok: true,
    settings,
    articles,
    generating: generation.generating,
    lastError: generation.lastError,
  }
  sendJson(res, 200, payload)
}

/** Answer the model catalog the settings picker offers. */
async function handleModels(ctx: any, res: ServerResponse): Promise<void> {
  const groups = await readModelGroups(ctx)
  sendJson(res, 200, { ok: true, groups, current: defaultSelection(ctx) })
}

/** Answer the reasoning levels one route offers. */
async function handleEfforts(url: URL, ctx: any, res: ServerResponse): Promise<void> {
  const provider = url.searchParams.get('provider') ?? ''
  const model = url.searchParams.get('model') ?? ''
  if (provider === '' || model === '' || provider.length > 200 || model.length > 300) {
    sendJson(res, 400, { ok: false, error: 'invalid model route' })
    return
  }
  sendJson(res, 200, await readModelEfforts(ctx, provider, model))
}

/** Persist one settings write and answer what was stored. */
async function handleSettings(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: Record<string, unknown>
  try {
    body = await readBody(req, MAX_BODY_BYTES)
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
    return
  }
  const settings = await writeSettings(body.settings)
  sendJson(res, 200, { ok: true, settings })
}

/** Start one manual batch; the page follows it through the state route. */
function handleGenerate(res: ServerResponse, ctx: any): void {
  if (!startGeneration(ctx)) {
    sendJson(res, 202, { ok: false, error: '正在生成每日贴，请稍候' })
    return
  }
  sendJson(res, 200, { ok: true, started: true })
}

/**
 * Record that the reader opened one article.
 *
 * The receipt is separate from the article file, so opening an article never
 * rewrites the user's Markdown; a repeated call keeps the first timestamp.
 */
async function handleRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: Record<string, unknown>
  try {
    body = await readBody(req, MAX_BODY_BYTES)
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
    return
  }
  const id = body.id
  if (!isArticleId(id)) {
    sendJson(res, 400, { ok: false, error: 'invalid article id' })
    return
  }
  await markRead(id)
  sendJson(res, 200, { ok: true, read: true })
}

/** Read one article body by id. */
async function handleArticle(url: URL, res: ServerResponse): Promise<void> {
  const id = url.searchParams.get('id')
  if (!isArticleId(id)) {
    sendJson(res, 400, { ok: false, error: 'invalid article id' })
    return
  }
  const article = await readArticle(id)
  if (article === undefined) {
    sendJson(res, 404, { ok: false, error: 'article not found' })
    return
  }
  sendJson(res, 200, { ok: true, article })
}

/** Delete one article by id and drop its read receipt. */
async function handleDelete(url: URL, res: ServerResponse): Promise<void> {
  const id = url.searchParams.get('id')
  if (!isArticleId(id)) {
    sendJson(res, 400, { ok: false, error: 'invalid article id' })
    return
  }
  const removed = await deleteArticle(id)
  if (!removed) {
    sendJson(res, 404, { ok: false, error: 'article not found' })
    return
  }
  await forgetRead(id)
  sendJson(res, 200, { ok: true })
}

/** Dispatch one request below the plugin prefix. */
async function dispatch(req: IncomingMessage, res: ServerResponse, ctx: any): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://dsh.invalid')
  const path = url.pathname
  try {
    if (path === API_PATHS.state) {
      if (!methodAllowed(req, res, ['GET'])) return
      return await handleState(res)
    }
    if (path === API_PATHS.settings) {
      if (!methodAllowed(req, res, ['PUT'])) return
      return await handleSettings(req, res)
    }
    if (path === API_PATHS.generate) {
      if (!methodAllowed(req, res, ['POST'])) return
      return handleGenerate(res, ctx)
    }
    if (path === API_PATHS.article) {
      if (!methodAllowed(req, res, ['GET', 'DELETE'])) return
      if (req.method === 'DELETE') return await handleDelete(url, res)
      return await handleArticle(url, res)
    }
    if (path === API_PATHS.read) {
      if (!methodAllowed(req, res, ['PUT'])) return
      return await handleRead(req, res)
    }
    if (path === API_PATHS.models) {
      if (!methodAllowed(req, res, ['GET'])) return
      return await handleModels(ctx, res)
    }
    if (path === API_PATHS.efforts) {
      if (!methodAllowed(req, res, ['GET'])) return
      return await handleEfforts(url, ctx, res)
    }
    sendJson(res, 404, { ok: false, error: 'not found' })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Register every route under the plugin prefix.
 *
 * The prefix handler is tied to the plugin's fiber by the caller, so stopping or
 * reloading the plugin takes its routes down with it.
 *
 * @param ctx - the Host plugin context exposing `webServer`.
 * @returns the disposer that unregisters the prefix.
 */
export function registerRoutes(ctx: any): () => void {
  return ctx.webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: (req: IncomingMessage, res: ServerResponse) => {
      if (!sameOrigin(req)) {
        sendJson(res, 403, { ok: false, error: 'cross-origin request refused' })
        return
      }
      return dispatch(req, res, ctx)
    },
  })
}
