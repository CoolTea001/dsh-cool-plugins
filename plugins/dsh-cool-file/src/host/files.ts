/**
 * Workspace reads — and the editor's one guarded write — for the Files tab.
 *
 * Two questions the page asks, and one answer it gives: what a directory holds,
 * what a text file says (paged for the preview, whole for the editor), and the
 * text the editor wants written back. Reads are answered through the composed
 * `workspaceFiles` service, so the session's own workspace root is the only
 * directory a page can reach and every listing stays inside it. The write is the
 * exception: that service is read-only, so saving goes through `ctx.fs`, fenced
 * by the session's own sandbox policy and guarded by the freshness token the
 * editor was handed. A session that is not live yet still owns a durable header,
 * and that header's `cwd` is what lets a reopened page answer for its workspace
 * on the first request.
 *
 * A session the Host cannot name at all falls back to the executor's default
 * directory, which is at least a directory that exists; the page then shows
 * whatever that directory holds rather than an empty tab.
 */

import type { FileEntry, ListPayload, ReadPayload, SavePayload, TextPayload } from '../shared/contract.js'

/** How many lines one preview asks for; the service's own cap still applies. */
const READ_LINES = 5000

/**
 * Largest file the editor will open or overwrite, in bytes.
 *
 * The preview pages its answer, so it can show the head of any file; the editor
 * cannot — it hands back a whole document, and a whole document is what must be
 * written. A cap keeps a mistaken click on a 500 MB log from pinning the Host
 * and the browser at once. Refusing is the honest answer: the page says the file
 * is too large and leaves it in preview.
 */
const EDIT_BYTES = 2 * 1024 * 1024

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

/**
 * The complete raw text of one workspace file, for the editor.
 *
 * The preview's paged read is the wrong input for an editor — it is a window,
 * and it drops the terminator after the last line — so this is a second read of
 * the file as it is stored. The freshness token travels with it: a save quotes
 * that token, and the backend refuses the write if the file moved on in between.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @returns the text, or an `ok: false` answer.
 */
export async function readWholeFile(ctx: any, sessionId: unknown, rawPath: unknown): Promise<TextPayload> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, error: 'The path must name a workspace file' }

  const root = await resolveRoot(ctx, sessionId)
  if (root === undefined) return { ok: false, error: 'This session has no working directory to browse' }

  const fs = ctx.get('fs')
  if (fs === undefined) return { ok: false, error: 'The filesystem service is not mounted' }

  try {
    const target = await fs.resolve(path, { cwd: root })
    const info = await fs.stat(target)
    if (info === undefined) {
      return { ok: false, reason: 'missing', error: 'This file no longer exists' }
    }
    if (info.type !== 'file') return { ok: false, error: 'This path is not a regular file' }
    if (typeof info.size === 'number' && info.size > EDIT_BYTES) {
      return {
        ok: false,
        reason: 'too-large',
        error: `This file is larger than ${EDIT_BYTES} bytes and can only be previewed`,
      }
    }
    const data: Uint8Array = await fs.readBytes(target, undefined, EDIT_BYTES)
    if (data.includes(0)) return { ok: false, reason: 'not-text', error: 'This file is not a text file' }
    let text: string
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(data)
    } catch {
      return { ok: false, reason: 'not-text', error: 'This file is not UTF-8 text' }
    }
    return { ok: true, path, text, bytes: data.length, version: String(info.version) }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/**
 * The sandbox policy one save runs under.
 *
 * The session's own mode and `cwd` are the fence, exactly as they are for the
 * agent's write tool — the editor must not be a way around a read-only session.
 * A request that names no live session has no policy to inherit; the deployment
 * default then applies, bounded by its own fallback root, and a workspace the
 * default does not cover is refused rather than quietly widened.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the policy for this call, or undefined when no service owns one.
 */
function policyFor(ctx: any, sessionId: unknown): unknown {
  const policy = ctx.get('sandboxPolicy')
  if (policy === undefined || typeof policy.resolve !== 'function') return undefined
  try {
    const sessions = ctx.get('sessions')
    const session = typeof sessionId === 'string' && sessionId !== '' ? sessions?.get(sessionId) : undefined
    return policy.resolve(session === undefined ? {} : { session })
  } catch {
    return undefined
  }
}

/** Whether a caught error carries one of the filesystem service's stable codes. */
function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

/**
 * How many lines a stored text holds, by the read service's own convention: a
 * final newline terminates the last line instead of starting an empty one.
 */
function lineCount(text: string): number {
  if (text === '') return 0
  const trimmed = text.endsWith('\n') ? text.slice(0, -1) : text
  let lines = 1
  for (let at = trimmed.indexOf('\n'); at !== -1; at = trimmed.indexOf('\n', at + 1)) lines += 1
  return lines
}

/**
 * Replace one workspace text file with what the editor holds.
 *
 * Three fences stand between the page and the disk. The path must stay inside
 * the workspace (the same grammar the reads use); the content must be UTF-8 text
 * within the edit cap; and the write is version-guarded by the token the editor
 * read, so a file the agent — or another editor — changed since it was opened is
 * refused with `reason: 'stale'` instead of silently losing that change.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @param rawText - the complete new content.
 * @param rawVersion - the freshness token the editor's read returned.
 * @returns the save outcome, or an `ok: false` answer.
 */
export async function saveFile(
  ctx: any,
  sessionId: unknown,
  rawPath: unknown,
  rawText: unknown,
  rawVersion: unknown,
): Promise<SavePayload> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, error: 'The path must name a workspace file' }
  if (typeof rawText !== 'string') return { ok: false, error: 'The content must be text' }

  const bytes = Buffer.byteLength(rawText, 'utf8')
  if (bytes > EDIT_BYTES) return { ok: false, error: `The content is larger than ${EDIT_BYTES} bytes` }

  const root = await resolveRoot(ctx, sessionId)
  if (root === undefined) return { ok: false, error: 'This session has no working directory to browse' }

  const fs = ctx.get('fs')
  if (fs === undefined) return { ok: false, error: 'The filesystem service is not mounted' }

  try {
    const target = await fs.resolve(path, { cwd: root })
    const info = await fs.stat(target)
    if (info === undefined) return { ok: false, reason: 'missing', error: 'This file no longer exists' }
    if (info.type !== 'file') return { ok: false, error: 'This path is not a regular file' }

    // A save that quoted a token is guarded by it; one that did not is guarded by
    // the version just observed, so even a client that forgot still races safely.
    const version = typeof rawVersion === 'string' && rawVersion !== '' ? rawVersion : String(info.version)
    const outcome = await fs.writeText(
      target,
      rawText,
      { kind: 'replaceIfVersion', version },
      undefined,
      policyFor(ctx, sessionId),
    )
    return { ok: true, path, lines: lineCount(rawText), bytes, version: String(outcome.version) }
  } catch (error) {
    if (hasCode(error, 'FS_STALE_VERSION')) {
      return { ok: false, reason: 'stale', error: 'The file changed on disk since it was opened' }
    }
    return { ok: false, error: messageOf(error) }
  }
}
