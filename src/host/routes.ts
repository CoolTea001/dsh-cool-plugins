/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context and no remote namespace of its own, so
 * the destructive command crosses same-origin routes registered on the
 * `webServer` carrier: one Session per request from the native menu, and one
 * selection per request from the management panel. The routes answer JSON and
 * never reject: a transport, service, or filesystem failure becomes an
 * `{ ok: false }` result the page reports in place.
 *
 * The Host stays authoritative about *what* is deleted. A request names a
 * Session id but never a directory or an Agent: the artifact path is derived and
 * verified by `deletion.ts`, never by the caller. That keeps the page a
 * management surface over DSH's own state rather than a second source of truth.
 */

import { coded } from './refusal.js'
import { deleteSession } from './deletion.js'

/** Route table, kept in one place so the two halves cannot drift. */
export const ROUTES = {
  delete: '/dsh-cool-session/api/delete',
  deleteMany: '/dsh-cool-session/api/delete-many',
} as const

/** Longest Session id a route will accept; DSH ids are far shorter. */
const MAX_SESSION_ID_LENGTH = 200

/** Most Sessions one batch request may name, so a page cannot pin the Host. */
const MAX_BATCH_SIZE = 200

function sendJson(res: any, status: number, body: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

/**
 * Answer 405 unless the request uses one of the allowed methods.
 *
 * @returns true when the handler may proceed.
 */
function methodAllowed(req: any, res: any, allowed: readonly string[]): boolean {
  if (allowed.includes(req.method)) return true
  sendJson(res, 405, { ok: false, error: 'method not allowed' })
  return false
}

async function readBody(req: any): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk as Uint8Array))
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
 * This route can destroy a Session, so a page on another origin has no business
 * asking. A same-origin `fetch` omits `Origin` on some requests, so an absent
 * header is allowed.
 */
function sameOrigin(req: any): boolean {
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

/**
 * Read one request's Session id.
 *
 * The id names a Session, not a path or a command, so the shape checked here is
 * only what can be passed back to DSH at all.
 *
 * @param body - the parsed request body.
 * @returns the id, or undefined when the body names none.
 */
function readSessionId(body: Record<string, unknown>): string | undefined {
  const sessionId = body.sessionId
  if (typeof sessionId !== 'string' || sessionId === '' || sessionId.length > MAX_SESSION_ID_LENGTH) {
    return undefined
  }
  return sessionId
}

/**
 * Read one batch request's Session ids.
 *
 * Duplicates are collapsed because a page may pass a selection it built from a
 * list that changed underneath it; deleting the same Session twice would turn
 * the second attempt into an `unknown-session` refusal for work that already
 * succeeded.
 *
 * @param body - the parsed request body.
 * @returns the unique ids, or undefined when the array is malformed.
 */
function readSessionIds(body: Record<string, unknown>): string[] | undefined {
  const raw = body.sessionIds
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_BATCH_SIZE) return undefined
  const ids: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string' || value === '' || value.length > MAX_SESSION_ID_LENGTH) return undefined
    if (!ids.includes(value)) ids.push(value)
  }
  return ids
}

/**
 * Run one JSON route body.
 *
 * Every route repeats the same three steps — method, body, handler — so they are
 * taken once here and the route only supplies its own work. A malformed body is
 * a 400; everything later is a 200 carrying `ok: false`, because a service's own
 * refusal is an answer the page should show, not an HTTP error.
 *
 * @param ctx - the Host plugin context.
 * @param req - the incoming request.
 * @param res - the response to write.
 * @param run - the route's own work, given the parsed body.
 */
async function handle(
  ctx: any,
  req: any,
  res: any,
  run: (body: Record<string, unknown>) => Promise<unknown>,
): Promise<void> {
  if (!methodAllowed(req, res, ['POST'])) return

  let body: Record<string, unknown>
  try {
    body = await readBody(req)
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
    return
  }

  try {
    sendJson(res, 200, await run(body))
  } catch (error) {
    sendJson(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Serve the deletion routes for one plugin instance.
 *
 * @param ctx - the Host plugin context.
 * @returns a disposer that unregisters exactly this route.
 */
export function registerRoutes(ctx: any): () => void {
  const guard = (handler: (req: any, res: any) => void | Promise<void>) => (req: any, res: any) => {
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'cross-origin request refused' })
      return
    }
    return handler(req, res)
  }

  const route = (path: string, handler: (req: any, res: any) => void | Promise<void>): (() => void) =>
    ctx.webServer.register({ kind: 'exact', path, handler: guard(handler) })

  // Registered eagerly, so the route is answering from the moment the plugin is
  // applied; the returned disposer is what the plugin's own effect owns.
  const disposers = [
    // Deletion is the one destructive route: it stops the Session's work, retires
    // the live entry, and removes the header-verified artifact directory. The
    // handler owns that entire sequence so the page can only name the Session.
    route(ROUTES.delete, (req, res) => handle(ctx, req, res, (body) => {
      const sessionId = readSessionId(body)
      if (sessionId === undefined) return Promise.resolve({ ok: false, ...coded('missing-session') })
      return deleteSession(ctx, sessionId)
    })),
    // The management surface deletes a whole selection. Each id still runs the
    // same single-Session sequence, sequentially: concurrent deletions would
    // race the persistence writer and the workspace registry's write chain.
    route(ROUTES.deleteMany, (req, res) => handle(ctx, req, res, async (body) => {
      const sessionIds = readSessionIds(body)
      if (sessionIds === undefined) {
        return { ok: false, error: `sessionIds must be a non-empty array of at most ${MAX_BATCH_SIZE} Session ids` }
      }
      const results = []
      for (const sessionId of sessionIds) results.push(await deleteSession(ctx, sessionId))
      return { ok: results.every(result => result.ok), results }
    })),
  ]

  return () => {
    for (const dispose of disposers) dispose()
  }
}
