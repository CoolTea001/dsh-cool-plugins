/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the page draws in its own error state, so the page has
 * exactly one failure shape no matter how the answer went wrong.
 */

import type {
  ListPayload,
  MutationPayload,
  ReadPayload,
  RevealPayload,
  SavePayload,
  TextPayload,
} from '../shared/contract.js'

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

/**
 * Ask the Host for one workspace file's complete raw text, for the editor.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the file as a workspace path.
 * @param purpose - copying does not impose the editor's smaller document cap.
 * @returns the text payload, with the freshness token a save must quote.
 */
export function fetchText(sessionId: string | undefined, path: string, purpose: 'edit' | 'copy' = 'edit'): Promise<TextPayload> {
  return postJson('/text', { sessionId, path, purpose })
}

/**
 * Ask the Host to replace one workspace file with the editor's content.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the file as a workspace path.
 * @param text - the complete new content.
 * @param version - the freshness token the read returned, so a stale save is refused.
 * @returns the save payload.
 */
export function saveFile(
  sessionId: string | undefined,
  path: string,
  text: string,
  version: string | undefined,
): Promise<SavePayload> {
  return postJson('/write', { sessionId, path, text, version })
}

/**
 * Rename one entry in place.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the entry as a workspace path.
 * @param name - the new name, as one path segment.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export function renameEntry(
  sessionId: string | undefined,
  path: string,
  name: string,
): Promise<MutationPayload> {
  return postJson('/rename', { sessionId, path, name })
}

/**
 * Create one new file or directory under an existing directory.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the parent directory as a workspace path; empty for the root.
 * @param name - the new entry's name, as one path segment.
 * @param kind - which kind of entry to create.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export function createEntry(
  sessionId: string | undefined,
  path: string,
  name: string,
  kind: 'file' | 'directory',
): Promise<MutationPayload> {
  return postJson('/create', { sessionId, path, name, kind })
}

/**
 * Delete one file or directory.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the entry as a workspace path.
 * @returns the removed path, or an `ok: false` answer.
 */
export function deleteEntry(sessionId: string | undefined, path: string): Promise<MutationPayload> {
  return postJson('/delete', { sessionId, path })
}

/**
 * Show one entry in the Host desktop's file manager.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the entry as a workspace path.
 * @returns the reveal outcome, or an `ok: false` answer.
 */
export function revealEntry(sessionId: string | undefined, path: string): Promise<RevealPayload> {
  return postJson('/reveal', { sessionId, path })
}
