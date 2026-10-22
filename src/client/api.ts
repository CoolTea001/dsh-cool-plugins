/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the dialog reports in place, so the page has exactly
 * one failure shape to render no matter how the answer went wrong.
 */

import type { DeleteManyPayload, DeletePayload } from '../shared/contract.js'

const BASE = '/dsh-cool-session/api'

/**
 * POST one JSON body and read a JSON answer.
 *
 * @param path - route path below {@link BASE}.
 * @param body - the request body.
 * @returns the parsed payload, or an `{ ok: false }` result when the transport failed.
 */
async function postJson(path: string, body: unknown): Promise<any> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    })
    const payload: unknown = await response.json().catch(() => null)
    if (payload === null || typeof payload !== 'object') {
      return { ok: false, error: `HTTP ${response.status}` }
    }
    return payload
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Ask the Host to delete one Session and every subagent Session beneath it.
 *
 * The Host stops running work first, then removes the artifacts.
 *
 * @param sessionId - the root Session to delete.
 * @returns the deletion summary, or a coded refusal.
 */
export function deleteSession(sessionId: string): Promise<DeletePayload> {
  return postJson('/delete', { sessionId })
}

/**
 * Whether an answer means the Host half predates the batch route.
 *
 * The browser bundle reloads with the page while the Host half lives until the
 * process restarts, so a freshly updated plugin can be newer than the routes it
 * is talking to. A missing route is not a deletion failure: the single route is
 * still there and can finish the same selection.
 *
 * @param payload - the answer to inspect.
 * @returns true when `deleteSessions` should fall back to single requests.
 */
function batchRouteMissing(payload: { readonly error?: string }): boolean {
  return payload.error === 'HTTP 404' || payload.error === 'HTTP 405'
}

/**
 * Sessions per batch request.
 *
 * Smaller than the Host's own ceiling so a very large selection is a sequence
 * of bounded requests; each batch still stops and removes its own Sessions in
 * order, so the persistence writer never sees two deletions at once.
 */
const DELETE_BATCH_SIZE = 100

/**
 * Ask the Host to delete several Sessions.
 *
 * The Host runs the same stop-then-remove sequence as {@link deleteSession} for
 * each id, sequentially, and answers one result per id. When this Host half does
 * not serve the batch route yet, the same work is done through the single route
 * so the panel keeps working across a live plugin upgrade and a later restart.
 *
 * @param sessionIds - the root Sessions to delete, in request order.
 * @returns the per-session summaries, or a request-level refusal.
 */
export async function deleteSessions(sessionIds: readonly string[]): Promise<DeleteManyPayload> {
  const results: DeletePayload[] = []
  for (let start = 0; start < sessionIds.length; start += DELETE_BATCH_SIZE) {
    const chunk = sessionIds.slice(start, start + DELETE_BATCH_SIZE)
    const payload = await postJson('/delete-many', { sessionIds: chunk })
    if (batchRouteMissing(payload)) {
      for (const sessionId of chunk) results.push(await deleteSession(sessionId))
      continue
    }
    if (!Array.isArray(payload.results)) {
      return {
        ok: false,
        error: typeof payload.error === 'string' && payload.error !== ''
          ? payload.error
          : 'the delete request failed',
        results,
      }
    }
    results.push(...payload.results as DeletePayload[])
  }
  return { ok: results.every(result => result.ok), results }
}
