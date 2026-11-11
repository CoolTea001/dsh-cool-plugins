/**
 * Workspace reads for the Files tab.
 *
 * Two questions the page asks, and nothing else: what a directory holds, and
 * what a text file says. Both are answered through the composed
 * `workspaceFiles` service, so the session's own workspace root is the only
 * directory a page can reach and every listing stays inside it. A session that
 * is not live yet still owns a durable header, and that header's `cwd` is what
 * lets a reopened page answer for its workspace on the first request.
 *
 * A session the Host cannot name at all falls back to the executor's default
 * directory, which is at least a directory that exists; the page then shows
 * whatever that directory holds rather than an empty tab.
 */

import type { FileEntry, ListPayload, ReadPayload } from '../shared/contract.js'

/** How many lines one preview asks for; the service's own cap still applies. */
const READ_LINES = 5000

/** A stand-in session identity for a request that named none. */
const LOCAL_SESSION = 'local'

/**
 * The session's own workspace root.
 *
 * Live header first, then the durable header of a session the Host has not
 * resumed yet, then the executor's default directory. Every read is
 * best-effort: an unreadable store is not this route's answer to give.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the absolute workspace root, or undefined when none can be named.
 */
async function resolveRoot(ctx: any, sessionId: unknown): Promise<string | undefined> {
  if (typeof sessionId === 'string' && sessionId !== '') {
    const sessions = ctx.get('sessions')
    try {
      const cwd = sessions?.get(sessionId)?.header?.cwd
      if (typeof cwd === 'string' && cwd !== '') return cwd
    } catch {
      /* an unreadable live store falls through to the durable header */
    }

    const controller = ctx.get('sessionController')
    if (controller !== undefined && typeof controller.inspect === 'function') {
      try {
        const inspection = await controller.inspect(sessionId)
        const cwd = inspection?.meta?.cwd
        if (typeof cwd === 'string' && cwd !== '') return cwd
      } catch {
        /* an unreadable durable header falls through to the default directory */
      }
    }
  }

  const shell = ctx.get('shell')
  try {
    const spec = shell?.resolve({ command: 'pwd' })
    if (typeof spec?.workdir === 'string' && spec.workdir !== '') return spec.workdir
  } catch {
    /* a shell that cannot resolve has no directory to offer */
  }
  return undefined
}

/**
 * The header-derived scope the workspace service expects.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @param root - the session's absolute workspace root.
 * @returns the scope for one request.
 */
function scopeOf(sessionId: unknown, root: string): { sessionId: string; workspaceRoot: string } {
  return {
    sessionId: typeof sessionId === 'string' && sessionId !== '' ? sessionId : LOCAL_SESSION,
    workspaceRoot: root,
  }
}

/**
 * Read a path the page named as a workspace-relative `/`-separated path.
 *
 * Absolute paths and parent segments are refused here rather than passed on:
 * the tab's vocabulary is the workspace tree, and a route is not the place to
 * widen it.
 *
 * @param value - the raw body value.
 * @returns the normalized path, or undefined when it is not one.
 */
function readPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (value.includes('\0')) return undefined
  const path = value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')
  if (path.startsWith('/')) return undefined
  for (const segment of path.split('/')) {
    if (segment === '..') return undefined
  }
  return path
}

/**
 * One failure, as the page's error state words it.
 *
 * @param error - whatever the service threw.
 * @returns the text the page draws.
 */
function messageOf(error: unknown): string {
  if (error instanceof Error && error.message !== '') return error.message
  return String(error)
}

/**
 * The workspace's display name for the page's breadcrumb.
 *
 * The registry title is authoritative: a Workspace can be renamed, and the
 * directory basename would then disagree with the name the sidebar shows. A
 * composition without a registry, or a directory it has not registered, falls
 * back to the root's own basename so the page still names the project instead
 * of a generic word.
 *
 * @param ctx - the Host plugin context.
 * @param root - the session's absolute workspace root.
 * @returns the name to draw, or undefined when neither source has one.
 */
async function workspaceName(ctx: any, root: string): Promise<string | undefined> {
  const registry = ctx.get('workspaceRegistry')
  if (registry !== undefined && typeof registry.resolveByPath === 'function') {
    try {
      const resolved = await registry.resolveByPath(root)
      const title = resolved?.title
      if (typeof title === 'string' && title.trim() !== '') return title
    } catch {
      /* an unreadable registry falls back to the directory's own name */
    }
  }
  const base = root.split(/[\\/]/).filter((segment) => segment !== '').pop()
  return base === undefined || base === '' ? undefined : base
}

/**
 * The direct children of one workspace directory.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the directory as a workspace path; empty or absent for the root.
 * @returns the listing, or an `ok: false` answer.
 */
export async function listDirectory(ctx: any, sessionId: unknown, rawPath: unknown): Promise<ListPayload> {
  const path = readPath(rawPath)
  if (path === undefined) return { ok: false, error: 'The path must be a workspace-relative path' }

  const root = await resolveRoot(ctx, sessionId)
  if (root === undefined) return { ok: false, error: 'This session has no working directory to browse' }

  const files = ctx.get('workspaceFiles')
  if (files === undefined) return { ok: false, error: 'The workspace file service is not mounted' }

  const workspace = await workspaceName(ctx, root)

  try {
    const listing = await files.list(scopeOf(sessionId, root), path === '' ? '.' : path, undefined)
    return {
      ok: true,
      path: typeof listing.path === 'string' ? listing.path : path,
      root,
      ...(workspace === undefined ? {} : { workspace }),
      entries: listing.entries.map((entry: any): FileEntry => ({
        name: String(entry.name),
        type: entry.type === 'directory' || entry.type === 'file' ? entry.type : 'other',
        ...(typeof entry.size === 'number' ? { size: entry.size } : {}),
      })),
      truncated: listing.truncated === true,
    }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/**
 * One page of one workspace text file.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @returns the page, or an `ok: false` answer.
 */
export async function readFile(ctx: any, sessionId: unknown, rawPath: unknown): Promise<ReadPayload> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, error: 'The path must name a workspace file' }

  const root = await resolveRoot(ctx, sessionId)
  if (root === undefined) return { ok: false, error: 'This session has no working directory to browse' }

  const files = ctx.get('workspaceFiles')
  if (files === undefined) return { ok: false, error: 'The workspace file service is not mounted' }

  try {
    const page = await files.read(scopeOf(sessionId, root), path, { limit: READ_LINES }, undefined)
    return {
      ok: true,
      path,
      text: page.text,
      lines: page.lines,
      eof: page.eof === true,
      ...(typeof page.bytes === 'number' ? { bytes: page.bytes } : {}),
    }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}
