/**
 * On-disk Session deletion, including the subagent Sessions beneath one root.
 *
 * DSH exposes no deletion command of its own, so this Host module treats the
 * Session artifact as the unit of removal. It first stops whatever the Session
 * still runs, retires the live Session entry, and only then removes the
 * header-verified directory. Paths never come from the request: every directory
 * is derived from the persistence backend's own `locate()` answer and checked
 * to be exactly one Session directory below the configured root.
 *
 * The operation is intentionally fail-closed. A descendant scan that cannot be
 * completed, a directory that leaves the root, a symlink, an artifact whose
 * header names another Session, or a Session that cannot be retired all abort
 * the delete before the first `rm`. A failure after some descendants were
 * already removed is reported as `delete-partial`, with the remaining ids.
 */

import { lstat, realpath, rm } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { DeletePayload, Failure, FailureCode } from '../shared/contract.js'

/** Bound on one Agent teardown before the Session is considered still live. */
const STOP_TIMEOUT_MS = 3_000

/** Window allowed for the persistence writer to finish after a Session detach. */
const RETIRE_WAIT_MS = 200

/** One coded deletion refusal thrown inside this module. */
class DeleteError extends Error {
  readonly failure: Failure

  constructor(code: FailureCode, params?: Readonly<Record<string, string | number>>, message?: string) {
    super(message ?? code)
    this.name = 'DeleteError'
    this.failure = params === undefined ? { code } : { code, params }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms))
}

/**
 * Turn an arbitrary service failure into the payload's `failure` / `error` pair.
 *
 * A coded refusal is worded by the page. Raw text stays raw because it belongs
 * to DSH, not to this plugin's dictionaries. The one exception is a generic
 * delete failure, where the service's own message is the useful diagnostic.
 *
 * @param error - what the service threw.
 * @param fallback - the code to use when the error carries no known identity.
 * @returns the failure fragment to spread into an `ok: false` answer.
 */
function failureOf(error: unknown, fallback: FailureCode): Pick<DeletePayload, 'failure' | 'error'> {
  if (error instanceof DeleteError) {
    return error.failure.code === 'delete-failed'
      ? { error: error.message }
      : { failure: error.failure }
  }
  const name = (error as { name?: unknown } | undefined)?.name
  if (name === 'WorkspaceActiveSessionError') {
    const activity = (error as { activity?: readonly { kind?: unknown }[] }).activity ?? []
    const kinds = activity.map(entry => typeof entry?.kind === 'string' ? entry.kind : '').filter(kind => kind !== '')
    return { failure: { code: 'delete-active', ...(kinds.length === 0 ? {} : { params: { activity: kinds.join(', ') } }) } }
  }
  if (name === 'WorkspaceUnknownSessionError') return { failure: { code: 'unknown-session' } }
  const code = (error as { code?: unknown } | undefined)?.code
  if (code === 'session/not-found') return { failure: { code: 'unknown-session' } }
  const message = error instanceof Error ? error.message : String(error)
  return message === '' ? { failure: { code: fallback } } : { error: message }
}

/** One Session header and the Session id it names. */
interface HeaderEntry {
  readonly id: string
  readonly header: any
}

/**
 * Read every header this Host can name, live or persisted.
 *
 * @param ctx - the Host plugin context.
 * @returns the persistence backend and the id-to-header lookup.
 */
async function readHeaders(ctx: any): Promise<{ persistence: any; headers: Map<string, HeaderEntry> }> {
  const persistence = ctx.get('sessionPersistence')
  if (persistence === undefined || typeof persistence.list !== 'function' || typeof persistence.locate !== 'function') {
    throw new DeleteError('delete-unsupported', undefined, 'the mounted persistence backend cannot locate Session artifacts')
  }

  const headers = new Map<string, HeaderEntry>()
  let snapshots: unknown
  try {
    snapshots = await persistence.list()
  } catch (error) {
    throw new DeleteError('delete-failed', undefined, `could not list Session artifacts: ${error instanceof Error ? error.message : String(error)}`)
  }
  for (const item of Array.isArray(snapshots) ? snapshots : []) {
    const header = (item as any)?.header ?? item
    if (typeof header?.id === 'string') headers.set(header.id, { id: header.id, header })
  }

  const live = ctx.get('sessions')?.list?.()
  for (const session of Array.isArray(live) ? live : []) {
    const header = session?.header
    if (typeof header?.id === 'string') headers.set(header.id, { id: header.id, header })
  }
  return { persistence, headers }
}

/** Flatten one Session-query descendant tree into its Session ids. */
function flattenDescendants(nodes: unknown): string[] {
  const ids: string[] = []
  const visit = (list: unknown): void => {
    for (const node of Array.isArray(list) ? list : []) {
      const header = (node as any)?.session?.header ?? (node as any)?.header
      if (typeof header?.id === 'string') ids.push(header.id)
      visit((node as any)?.descendants)
    }
  }
  visit(nodes)
  return ids
}

/**
 * Collect every subagent descendant of one root.
 *
 * `sessionQuery.traceSession` is the authoritative relationship trace when the
 * composition mounts it; the header parent pointers cover the same tree when it
 * does not. Both are unioned so a live child absent from one source is still
 * included.
 *
 * @param ctx - the Host plugin context.
 * @param rootId - the Session whose tree is wanted.
 * @param headers - the header lookup.
 * @returns descendant ids, excluding the root.
 */
async function collectDescendants(ctx: any, rootId: string, headers: ReadonlyMap<string, HeaderEntry>): Promise<string[]> {
  const ids = new Set<string>()
  const query = ctx.get('sessionQuery')
  if (query !== undefined && typeof query.traceSession === 'function') {
    let lineage: any
    try {
      lineage = await query.traceSession(rootId)
    } catch (error) {
      throw new DeleteError('delete-failed', undefined, `could not trace Session descendants: ${error instanceof Error ? error.message : String(error)}`)
    }
    for (const id of flattenDescendants(lineage?.descendants)) {
      if (id === rootId) continue
      // A fork is an ordinary Session, not a child; only a subagent whose
      // parent chain reaches this root belongs in the deletion tree.
      if (headers.get(id)?.header?.origin === 'subagent' && descendsFrom(id, rootId, headers)) ids.add(id)
    }
  }

  const byParent = new Map<string, string[]>()
  for (const { id, header } of headers.values()) {
    if (header?.origin !== 'subagent' || typeof header?.parentSession !== 'string') continue
    const children = byParent.get(header.parentSession) ?? []
    children.push(id)
    byParent.set(header.parentSession, children)
  }
  const queue = [rootId]
  const seen = new Set([rootId])
  while (queue.length > 0) {
    const parent = queue.shift() as string
    for (const child of byParent.get(parent) ?? []) {
      if (seen.has(child)) continue
      seen.add(child)
      ids.add(child)
      queue.push(child)
    }
  }
  ids.delete(rootId)
  return [...ids]
}

/** Whether one header's parent chain reaches the given root. */
function descendsFrom(id: string, rootId: string, headers: ReadonlyMap<string, HeaderEntry>): boolean {
  let current = headers.get(id)?.header
  const seen = new Set<string>()
  while (typeof current?.parentSession === 'string' && !seen.has(current.parentSession)) {
    if (current.parentSession === rootId) return true
    seen.add(current.parentSession)
    current = headers.get(current.parentSession)?.header
  }
  return false
}

/** Distance from a Session to the root, used to delete leaves before parents. */
function depthOf(id: string, headers: ReadonlyMap<string, HeaderEntry>): number {
  let depth = 0
  let current = headers.get(id)?.header
  const seen = new Set<string>()
  while (typeof current?.parentSession === 'string' && !seen.has(current.parentSession)) {
    seen.add(current.parentSession)
    depth += 1
    current = headers.get(current.parentSession)?.header
  }
  return depth
}

/** DSH's on-disk session directory encoding, mirroring the JSONL backend. */
function encodeSegment(raw: string): string {
  if (raw === '.') return '~002E'
  if (raw === '..') return '~002E~002E'
  let out = ''
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index)
    const character = String.fromCharCode(code)
    out += character !== '~' && /^[A-Za-z0-9._-]$/u.test(character)
      ? character
      : `~${code.toString(16).toUpperCase().padStart(4, '0')}`
  }
  return out
}

/**
 * Resolve and verify one Session's artifact directory.
 *
 * The directory is exactly `<root>/<project>/<session-directory>`; the session
 * directory must name this Session, every component must be a real directory
 * (never a symlink or junction), and its real path must stay below the real
 * root. A missing artifact returns `undefined` so a blank Session can still be
 * retired without inventing a path.
 *
 * @param persistence - the mounted persistence backend.
 * @param header - the Session header whose artifact is wanted.
 * @returns the verified directory, or undefined when no artifact was written.
 */
async function sessionDirectory(persistence: any, header: any): Promise<string | undefined> {
  let located: any
  try {
    located = persistence.locate(header)
  } catch (error) {
    throw new DeleteError('delete-unsupported', undefined, `could not locate the Session artifact: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (typeof located?.path !== 'string' || located.path === '') return undefined

  const target = resolve(dirname(located.path))
  const root = typeof persistence.root === 'string' ? resolve(persistence.root) : resolve(target, '..', '..')
  let base: string
  try {
    base = await realpath(root)
  } catch {
    base = root
  }

  // Structural membership is checked in the configured path spelling (the
  // root itself may legitimately be a symlink, e.g. /tmp on macOS), while the
  // canonical root is only used to prove that each resolved component stays
  // inside it.
  const rel = relative(root, target)
  const parts = rel.split(sep).filter(part => part !== '')
  const encoded = encodeSegment(header.id)
  if (isAbsolute(rel) || parts.length !== 2 || parts.some(part => part === '.' || part === '..')
    || (parts[1] !== header.id && parts[1] !== encoded)) {
    throw new DeleteError('delete-unsupported', undefined, 'the Session artifact lies outside the allowed directory')
  }

  let current = root
  try {
    for (const part of parts) {
      current = join(current, part)
      const info = await lstat(current)
      if (info.isSymbolicLink() || !info.isDirectory()) {
        throw new DeleteError('delete-unsupported', undefined, 'the Session artifact directory is not a real directory')
      }
      const canonical = await realpath(current)
      const child = relative(base, canonical)
      if (isAbsolute(child) || child === '' || child.split(sep).includes('..')) {
        throw new DeleteError('delete-unsupported', undefined, 'the Session artifact resolves outside the allowed directory')
      }
    }
  } catch (error) {
    if ((error as { code?: unknown })?.code === 'ENOENT') return undefined
    throw error
  }
  return target
}

/** Read the activity families the workspace registry publishes for one Session. */
async function sessionActivity(ctx: any, id: string): Promise<any[]> {
  if (typeof ctx.waterfall !== 'function') return []
  try {
    const answer = await ctx.waterfall('workspace/session-activity', { sessionId: id }, () => Promise.resolve([]))
    return Array.isArray(answer) ? answer : []
  } catch (error) {
    throw new DeleteError('delete-failed', undefined, `could not inspect the Session's activity: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** A human-readable activity list for a refusal sentence. */
function activityText(activities: readonly any[]): string {
  const kinds = activities
    .map(entry => typeof entry?.kind === 'string' ? entry.kind : '')
    .filter(kind => kind !== '')
  return kinds.length === 0 ? 'running work' : kinds.join(', ')
}

/**
 * Stop whatever one Session still runs, or refuse when it cannot be stopped.
 *
 * The user-facing policy is stop-then-delete: a running turn, subagent, job, or
 * reminder is cancelled first. The Session is re-inspected afterwards; if the
 * work survived the stop request, the deletion aborts before any file changes.
 *
 * @param ctx - the Host plugin context.
 * @param id - the Session to quiesce.
 */
async function stopSession(ctx: any, id: string): Promise<void> {
  const sessions = ctx.get('sessions')
  const agents = ctx.get('agents')
  const session = sessions?.get?.(id)
  const agent = agents?.get?.(id)
  const activities = await sessionActivity(ctx, id)
  const activeTurn = session?.activeTurn !== undefined
  const running = agent?.status === 'running' || agent?.busy === true
  if (!activeTurn && !running && activities.length === 0) return

  const registry = ctx.get('workspaceRegistry')
  const canStop = typeof agent?.cancel === 'function'
    || typeof agent?.scope?.dispose === 'function'
    || typeof registry?.stopSessionActivity === 'function'
    || typeof ctx.parallel === 'function'
  if (!canStop) {
    throw new DeleteError('delete-active', { activity: activityText(activities) }, 'the Session is active and this Host exposes no stop interface')
  }

  try {
    if (typeof agent?.cancel === 'function') agent.cancel({ kind: 'disposed' })
    if (typeof agent?.scope?.dispose === 'function') await Promise.race([agent.scope.dispose(), sleep(STOP_TIMEOUT_MS)])
    else if (typeof agent?.whenIdle === 'function') await Promise.race([agent.whenIdle(), sleep(STOP_TIMEOUT_MS)])
  } catch {
    /* the post-stop check below decides whether the Session is still active */
  }

  try {
    if (typeof registry?.stopSessionActivity === 'function') await registry.stopSessionActivity(id)
    else if (typeof ctx.parallel === 'function') await ctx.parallel('workspace/session-stop', { sessionId: id })
  } catch (error) {
    throw new DeleteError('delete-active', { activity: activityText(activities) }, `could not stop the Session's work: ${error instanceof Error ? error.message : String(error)}`)
  }

  await sleep(250)
  const afterAgent = agents?.get?.(id)
  const afterSession = sessions?.get?.(id)
  if (afterAgent?.status === 'running' || afterAgent?.busy === true || afterSession?.activeTurn !== undefined) {
    throw new DeleteError('delete-active', { activity: activityText(activities) }, 'the Session is still active after the stop request')
  }
  const remainingActivity = await sessionActivity(ctx, id)
  if (remainingActivity.length > 0) {
    throw new DeleteError('delete-active', { activity: activityText(remainingActivity) }, 'the Session still has reported activity after the stop request')
  }
}

/**
 * Retire one live Session and its Agent, then make sure neither survives.
 *
 * A cold Session still gets a `session/disposed` notification so every connected
 * client drops its row; a live one is flushed and detached through its store
 * entry, which is the path that also closes the persistence writer.
 *
 * @param ctx - the Host plugin context.
 * @param id - the Session to retire.
 */
async function retireSession(ctx: any, id: string): Promise<void> {
  const sessions = ctx.get('sessions')
  const agents = ctx.get('agents')
  const agent = agents?.get?.(id)
  if (agent !== undefined) {
    try {
      if (typeof agent.cancel === 'function') agent.cancel({ kind: 'disposed' })
      if (typeof agent.scope?.dispose === 'function') await Promise.race([agent.scope.dispose(), sleep(STOP_TIMEOUT_MS)])
    } catch {
      /* the surviving-agent check below is authoritative */
    }
    try {
      agents.store?.delete?.(id)
    } catch {
      /* best-effort: the Session detach below still tears down the owner */
    }
  }

  const session = sessions?.get?.(id)
  let detached = false
  if (session !== undefined) {
    try {
      if (typeof sessions.flush === 'function') await sessions.flush(session)
    } catch {
      /* the artifact is being deleted; a flush failure must not hide a live owner */
    }
    const entry = sessions.store?.get?.(id)
    if (entry !== undefined && typeof entry.detach === 'function') {
      try {
        entry.detach()
        detached = true
        await sleep(RETIRE_WAIT_MS)
      } catch {
        detached = false
      }
    }
  }
  if (!detached) {
    try {
      ctx.emit?.('session/disposed', { id })
    } catch {
      /* best-effort notification; the live checks below decide the outcome */
    }
  }

  if (sessions?.get?.(id) !== undefined || agents?.get?.(id) !== undefined) {
    throw new DeleteError('session-live', undefined, 'the Session is still live after its teardown')
  }
}

/** Remove one Session from Workspace accounting, the archive set, and the pin set. */
async function cleanupRegistry(ctx: any, id: string, warnings: string[]): Promise<void> {
  const registry = ctx.get('workspaceRegistry')
  if (registry === undefined) return
  try {
    for (const entity of registry.list?.() ?? []) {
      const recordIds = entity?.record?.sessionIds
      const ids = Array.isArray(recordIds) ? recordIds : entity?.sessionIds
      if (Array.isArray(ids) && ids.includes(id) && typeof entity.detachSession === 'function') {
        try {
          await entity.detachSession(id)
        } catch (error) {
          warnings.push(`Workspace membership cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  } catch (error) {
    warnings.push(`Workspace cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    if (typeof registry.unarchiveSession === 'function') await registry.unarchiveSession(id)
  } catch (error) {
    warnings.push(`Archive cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    if (typeof registry.unpinSession === 'function') await registry.unpinSession(id)
  } catch (error) {
    warnings.push(`Pin cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Delete one Session and every subagent Session beneath it.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the root Session to delete.
 * @returns the deletion summary, or one coded refusal.
 */
export async function deleteSession(ctx: any, sessionId: string): Promise<DeletePayload> {
  try {
    if (sessionId === '') throw new DeleteError('missing-session')

    const { persistence, headers } = await readHeaders(ctx)
    const target = headers.get(sessionId)
    if (target === undefined) throw new DeleteError('unknown-session')
    if (target.header?.origin === 'subagent') throw new DeleteError('subagent-delete')

    const descendants = await collectDescendants(ctx, sessionId, headers)
    for (const id of descendants) {
      if (!headers.has(id)) {
        throw new DeleteError('delete-failed', undefined, `cannot resolve the descendant Session '${id}'`)
      }
    }
    const orderedDescendants = [...descendants].sort((left, right) => depthOf(right, headers) - depthOf(left, headers))
    const stopOrder = [...orderedDescendants, sessionId]

    // Validate every artifact path before stopping any work: a path that
    // escapes the root must not leave the Session interrupted but undeleted.
    const directories = new Map<string, string | undefined>()
    for (const id of stopOrder) {
      const header = headers.get(id)?.header
      directories.set(id, header === undefined ? undefined : await sessionDirectory(persistence, header))
    }

    // Stop everything before the first artifact is touched.
    for (const id of stopOrder) await stopSession(ctx, id)

    const deleteOrder = [...orderedDescendants, sessionId]
    const deleted: string[] = []
    const warnings: string[] = []
    let filesRemoved = false

    for (let index = 0; index < deleteOrder.length; index += 1) {
      const id = deleteOrder[index] as string
      try {
        await retireSession(ctx, id)
        const header = headers.get(id)?.header
        // A blank Session may materialize during its flush/detach; re-resolve
        // only when the preflight found no directory.
        const directory = directories.get(id)
          ?? (header === undefined ? undefined : await sessionDirectory(persistence, header))
        if (directory !== undefined) {
          try {
            await rm(directory, { recursive: true, force: true })
            filesRemoved = true
          } catch (error) {
            throw new DeleteError('delete-failed', undefined, `could not remove the Session artifact: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
        await cleanupRegistry(ctx, id, warnings)
        deleted.push(id)
      } catch (error) {
        const refusal = failureOf(error, 'delete-failed')
        const remaining = deleteOrder.slice(index)
        if (deleted.length === 0) {
          return {
            ok: false,
            ...refusal,
            sessionId,
            deletedSessions: deleted,
            deletedSubagents: [],
            remainingSessions: remaining,
            filesRemoved,
            ...(warnings.length === 0 ? {} : { warnings }),
          }
        }
        const detail = refusal.error
          ?? (error instanceof Error && error.message !== '' ? error.message : undefined)
          ?? (refusal.failure === undefined ? undefined : `failure: ${refusal.failure.code}`)
        return {
          ok: false,
          failure: { code: 'delete-partial', params: { deleted: deleted.length, remaining: remaining.length } },
          ...(detail === undefined ? {} : { error: detail }),
          sessionId,
          deletedSessions: deleted,
          deletedSubagents: deleted.filter(deletedId => deletedId !== sessionId),
          remainingSessions: remaining,
          filesRemoved,
          ...(warnings.length === 0 ? {} : { warnings }),
        }
      }
    }

    try {
      ctx.logger?.info?.(`dsh-cool-session: deleted ${deleted.length} Session artifact(s): ${deleted.join(', ')}`)
    } catch {
      /* logging must not change the deletion result */
    }

    return {
      ok: true,
      sessionId,
      deletedSessions: deleted,
      deletedSubagents: deleted.filter(deletedId => deletedId !== sessionId),
      filesRemoved,
      ...(warnings.length === 0 ? {} : { warnings }),
    }
  } catch (error) {
    return { ok: false, ...failureOf(error, 'delete-failed'), sessionId }
  }
}
