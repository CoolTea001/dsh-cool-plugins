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

import { IMAGE_MAX_BYTES, imageMediaTypeOf } from '../shared/kinds.js'
import { ignoredNames } from './gitignore.js'
import { isHiddenName, platformHiddenNames } from './hidden.js'
import { absoluteOf, hasCode, messageOf, policyFor, readPath, resolveRoot, scopeOf } from './scope.js'
import { desktopFacts, writableWorkspace } from './changes.js'
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

/** Copy may read a whole text file without making it editable in the browser. */
const COPY_BYTES = 16 * 1024 * 1024

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
    const entries: any[] = Array.isArray(listing.entries) ? listing.entries : []
    // The platform's own hidden mark is not part of a listing, so it is asked
    // for once per level rather than once per child. The directory the answer
    // actually came from is the one to probe: a symlinked level resolves to its
    // target, and the names to judge are that target's children.
    const absolute = typeof listing.path === 'string' ? absoluteOf(root, listing.path) : root
    const names = entries.map((entry: any): string => String(entry.name))
    // The two questions are independent — a hidden entry is not an ignored one —
    // and both answer for the whole level, so they are asked together rather than
    // one child at a time. Each one runs its own helper process, so pairing them
    // is the difference between one round trip and two.
    const [marked, excluded] = await Promise.all([
      platformHiddenNames(ctx, absolute),
      ignoredNames(ctx, absolute, names),
    ])
    return {
      ok: true,
      path: typeof listing.path === 'string' ? listing.path : path,
      root,
      ...(workspace === undefined ? {} : { workspace }),
      entries: entries.map((entry: any, index: number): FileEntry => {
        const name = names[index] ?? String(entry.name)
        return {
          name,
          type: entry.type === 'directory' || entry.type === 'file' ? entry.type : 'other',
          ...(typeof entry.size === 'number' ? { size: entry.size } : {}),
          hidden: isHiddenName(name) || marked.has(name),
          ...(excluded.has(name) ? { ignored: true } : {}),
        }
      }),
      truncated: listing.truncated === true,
      // The two facts the row commands are drawn from. Both are answers about
      // the Host, not about the directory just listed, so they are asked once
      // per listing rather than once per row: `writable` is the session policy
      // the mutations run under, and `desktop` is whether a native reveal
      // exists at all.
      writable: writableWorkspace(ctx, sessionId),
      desktop: desktopFacts(ctx),
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
 * @param purpose - editing retains the browser editor's cap; copying can read a
 *   larger UTF-8 file because it never paints that file as an editable document.
 * @returns the text, or an `ok: false` answer.
 */
export async function readWholeFile(
  ctx: any,
  sessionId: unknown,
  rawPath: unknown,
  purpose: 'edit' | 'copy' = 'edit',
): Promise<TextPayload> {
  const path = readPath(rawPath)
  const limit = purpose === 'copy' ? COPY_BYTES : EDIT_BYTES
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
    if (typeof info.size === 'number' && info.size > limit) {
      return {
        ok: false,
        reason: 'too-large',
        error: purpose === 'copy'
          ? `This file is larger than ${limit} bytes and cannot be copied`
          : `This file is larger than ${limit} bytes and can only be previewed`,
      }
    }
    const data: Uint8Array = await fs.readBytes(target, undefined, limit)
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
 * The raw bytes of one workspace image, for the preview's `<img>`.
 *
 * The text routes answer JSON; this one answers a body, because what the page
 * wants is the picture itself. Three fences keep it as narrow as the reads: the
 * path must stay inside the workspace, the name must be an extension the shared
 * kind table calls an image — which is the same table the page used to decide to
 * ask — and the file must sit under the image cap, checked before it is read so
 * an oversized file is refused rather than buffered and dropped.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @returns the media type and bytes, or a failure the route answers with.
 */
export async function readImage(
  ctx: any,
  sessionId: unknown,
  rawPath: unknown,
): Promise<
  { ok: true; mediaType: string; data: Uint8Array } | { ok: false; error: string; reason?: 'too-large' }
> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, error: 'The path must name a workspace file' }

  const mediaType = imageMediaTypeOf(path)
  if (mediaType === undefined) return { ok: false, error: 'This file is not an image' }

  const root = await resolveRoot(ctx, sessionId)
  if (root === undefined) return { ok: false, error: 'This session has no working directory to browse' }

  const fs = ctx.get('fs')
  if (fs === undefined) return { ok: false, error: 'The filesystem service is not mounted' }

  try {
    const target = await fs.resolve(path, { cwd: root })
    const info = await fs.stat(target)
    if (info === undefined) return { ok: false, error: 'This file no longer exists' }
    if (info.type !== 'file') return { ok: false, error: 'This path is not a regular file' }
    if (typeof info.size === 'number' && info.size > IMAGE_MAX_BYTES) {
      return { ok: false, reason: 'too-large', error: `This image is larger than ${IMAGE_MAX_BYTES} bytes` }
    }
    return { ok: true, mediaType, data: await fs.readBytes(target, undefined, IMAGE_MAX_BYTES) }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
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
