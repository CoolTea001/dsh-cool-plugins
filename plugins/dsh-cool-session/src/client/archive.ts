/**
 * Archive and unarchive through DSH's own Workspace controller.
 *
 * The browser already holds a live Workspace snapshot and a generated remote
 * namespace for it, so archival does not need a route of this plugin's own: the
 * controller's call keeps the archive set authoritative on the Host and pushes
 * the new set to every connected surface. The single failure worth wording
 * separately is the Host's refusal of a Session with running work: the panel
 * offers to stop that work and retry, exactly as the native sidebar does.
 */

import type { Failure } from '../shared/contract.js'

/** One family of work that keeps a Session from being archived. */
export interface ArchiveActivity {
  /** Provider family: `turn`, `subagent`, `job`, `schedule`, or one this build does not know. */
  readonly kind: string
  /** Number of active items the family reported. */
  readonly count: number
}

/**
 * One archive attempt's outcome.
 *
 * `active` is the Host's "stop this first" answer; every other refusal is
 * either a code the page words from its dictionary (`failure`), a missing
 * service (`unavailable`), or raw diagnostic text (`message`).
 */
export interface ArchiveResult {
  readonly ok: boolean
  readonly active?: readonly ArchiveActivity[]
  readonly failure?: Failure
  readonly unavailable?: boolean
  readonly message?: string
}

/** The remote failure shape the Workspace controller wraps its refusals in. */
interface WorkspaceArchiveError {
  readonly name?: string
  readonly rpcError?: {
    readonly code?: string
    readonly message?: string
    readonly details?: { readonly activity?: readonly unknown[] }
  }
}

/** Read the activity families out of a `workspace/session-active` refusal. */
function activityOf(details: { readonly activity?: readonly unknown[] } | undefined): ArchiveActivity[] {
  const entries = details?.activity
  if (!Array.isArray(entries)) return []
  const activity: ArchiveActivity[] = []
  for (const entry of entries) {
    if (entry === null || typeof entry !== 'object') continue
    const record = entry as { kind?: unknown; items?: unknown }
    if (typeof record.kind !== 'string' || record.kind === '') continue
    const count = Array.isArray(record.items) && record.items.length > 0 ? record.items.length : 1
    activity.push({ kind: record.kind, count })
  }
  return activity
}

/**
 * Archive or restore one Session.
 *
 * @param workspaces - the client Workspace service, when the composition mounts one.
 * @param sessionId - the Session to move between the two sets.
 * @param archived - which set it should end in.
 * @param stopActivity - ask the Host to stop running work instead of refusing.
 * @returns the outcome the panel renders.
 */
export async function setSessionArchived(
  workspaces: any,
  sessionId: string,
  archived: boolean,
  stopActivity: boolean,
): Promise<ArchiveResult> {
  if (workspaces === undefined || workspaces === null
    || typeof workspaces.archiveSession !== 'function' || typeof workspaces.unarchiveSession !== 'function') {
    return { ok: false, unavailable: true }
  }
  try {
    if (archived) await workspaces.unarchiveSession(sessionId)
    else await workspaces.archiveSession(sessionId, stopActivity ? { stopActivity: true } : undefined)
    return { ok: true }
  } catch (error) {
    const failure = error as WorkspaceArchiveError
    const code = failure?.rpcError?.code
    if (code === 'workspace/session-active') {
      const activity = activityOf(failure.rpcError?.details)
      // A refusal without a readable family list cannot drive the "stop and
      // archive" confirmation, so it is reported as the plain refusal it is.
      if (activity.length > 0) return { ok: false, active: activity }
      return { ok: false, failure: { code: 'session-running' } }
    }
    if (code === 'session/not-found') return { ok: false, failure: { code: 'unknown-session' } }
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
}
