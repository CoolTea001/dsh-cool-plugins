/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the dialog reports in place, so the page has exactly
 * one failure shape to render no matter how the answer went wrong.
 */

import type { DeletePayload } from '../shared/contract.js'

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
 * The Host stops running work first, then removes the artifacts. This is the
 * only call in this wrapper, and it destroys data.
 *
 * @param sessionId - the root Session to delete.
 * @returns the deletion summary, or a coded refusal.
 */
export function deleteSession(sessionId: string): Promise<DeletePayload> {
  return postJson('/delete', { sessionId })
}
