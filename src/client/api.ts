/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the page draws in its own error state, so the page has
 * exactly one failure shape no matter how the answer went wrong.
 */

import type { ListPayload, ReadPayload } from '../shared/contract.js'

const BASE = '/dsh-cool-file/api'

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
 * Ask the Host for one workspace directory's direct children.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the directory as a workspace path; empty for the root.
 * @returns the listing payload.
 */
export function fetchListing(sessionId: string | undefined, path: string): Promise<ListPayload> {
  return postJson('/list', { sessionId, path })
}

/**
 * Ask the Host for one page of one workspace text file.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the file as a workspace path.
 * @returns the read payload.
 */
export function fetchFile(sessionId: string | undefined, path: string): Promise<ReadPayload> {
  return postJson('/read', { sessionId, path })
}
