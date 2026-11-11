/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context and no remote namespace of its own, so
 * every question it asks the Host crosses a same-origin route registered on the
 * `webServer` carrier. Each route answers JSON and never rejects: a transport or
 * service failure becomes an `{ ok: false }` result the page draws in its own
 * error state.
 *
 * The Host stays authoritative about *which* workspace is browsed. A request may
 * name the session it belongs to, but never a directory: the root is read from
 * that session's own header, so a page cannot point the plugin at a tree the
 * session does not own. Three routes read; the fourth is the editor's save, and
 * it accepts nothing but the text of one file already inside that workspace.
 */

import { listDirectory, readFile, readWholeFile, saveFile } from './files.js'
import type { ListPayload, ReadPayload, SavePayload, TextPayload } from '../shared/contract.js'

/** Route table, kept in one place so the two halves cannot drift. */
export const ROUTES = {
  list: '/dsh-cool-file/api/list',
  read: '/dsh-cool-file/api/read',
  text: '/dsh-cool-file/api/text',
  write: '/dsh-cool-file/api/write',
} as const

/** Longest body the read routes accept; each is a path and a session id. */
const MAX_BODY_BYTES = 16 * 1024

/**
 * Longest body the save route accepts: the content cap, with room for the JSON
 * escaping of control characters (a newline doubles, a control byte becomes six)
 * plus the path and the freshness token.
 */
const MAX_WRITE_BODY_BYTES = 16 * 1024 * 1024

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

/**
 * Read a JSON object body, bounded before it is parsed.
 *
 * @param req - the incoming request.
 * @param limit - largest body accepted, in bytes.
 * @returns the parsed body; `{}` for an empty one.
 * @throws when the body is too large or is not a JSON object.
 */
async function readBody(req: any, limit: number): Promise<Record<string, unknown>> {
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
 * These routes expose a session's workspace to whoever can reach the server, so
 * a page on another origin has no business asking. A same-origin `fetch` omits
 * `Origin` on some requests, so an absent header is allowed.
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
 * Run one answer and send it as JSON.
 *
 * @param req - the incoming request.
 * @param res - the response to write.
 * @param run - the answer, given the parsed body.
 * @param limit - largest body accepted, in bytes.
 */
async function handle(
  req: any,
  res: any,
  run: (body: Record<string, unknown>) => Promise<ListPayload | ReadPayload | TextPayload | SavePayload>,
  limit: number = MAX_BODY_BYTES,
): Promise<void> {
  if (!methodAllowed(req, res, ['POST'])) return
  let body: Record<string, unknown>
  try {
    body = await readBody(req, limit)
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : 'bad request' })
    return
  }
  sendJson(res, 200, await run(body))
}

/**
 * Register the four routes on the browser HTTP carrier.
 *
 * @param ctx - the Host plugin context.
 * @returns the disposer that removes the routes with the plugin.
 */
export function registerRoutes(ctx: any): () => void {
  const server = ctx.get('webServer')
  if (server === undefined) return () => {}

  const guard = (handler: (req: any, res: any) => void | Promise<void>) => (req: any, res: any) => {
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'cross-origin request refused' })
      return
    }
    return handler(req, res)
  }

  const route = (path: string, handler: (req: any, res: any) => void | Promise<void>): (() => void) =>
    server.register({ kind: 'exact', path, handler: guard(handler) })

  // Registered eagerly, so a route is answering from the moment the plugin is
  // applied; the returned disposer is what the plugin's own effect owns.
  const disposers = [
    route(ROUTES.list, (req, res) => handle(req, res, (body) => listDirectory(ctx, body.sessionId, body.path))),
    route(ROUTES.read, (req, res) => handle(req, res, (body) => readFile(ctx, body.sessionId, body.path))),
    route(ROUTES.text, (req, res) => handle(req, res, (body) => readWholeFile(ctx, body.sessionId, body.path))),
    route(ROUTES.write, (req, res) =>
      handle(
        req,
        res,
        (body) => saveFile(ctx, body.sessionId, body.path, body.text, body.version),
        MAX_WRITE_BODY_BYTES,
      ),
    ),
  ]

  return () => {
    for (const dispose of disposers) dispose()
  }
}
