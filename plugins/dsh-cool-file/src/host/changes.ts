/**
 * The tree's four commands — rename, create, delete, reveal — as the Host
 * performs them.
 *
 * The Files tab reads; these are the four ways it writes. Everything they share
 * is one fence: the path must name a workspace entry inside the session's own
 * workspace, and the write must be one the session's sandbox policy allows, so
 * a read-only session cannot use the tree to do what its own agent tools
 * refuse. Which effect performs the change depends on what is being changed:
 *
 * - **Files are created and removed** through the composed `fs` service, which
 *   is where the workspace fence already lives: `writeText` with `createIfAbsent`
 *   creates an empty file, and `deleteFile` removes one. Both are atomic there,
 *   so a failure leaves the file as it was.
 * - **Renames, directory creations and directory removals** have no counterpart
 *   in that service: its `moveFile` publishes the source's *text* at the
 *   destination, which refuses a binary file and refuses a directory outright,
 *   and it never creates or removes a directory at all. Those four go through
 *   `node:fs/promises`, and only once the entry has been proven to be a path on
 *   *this* machine and inside the session's workspace. A workspace living in a
 *   sandbox or over SSH answers `unsupported` rather than having a host
 *   operation applied to a path that merely looks local, and an entry whose
 *   identity lies outside the workspace — a symlink out of the tree — answers
 *   `invalid` rather than being followed.
 *
 * The policy check runs for every mutation, including the directory ones, so
 * the tree cannot be a way around the session's own mode.
 */

import { mkdir, rename, rm } from 'node:fs/promises'
import {
  childPathOf,
  hostPathOf,
  hasCode,
  messageOf,
  modeOf,
  parentPathOf,
  policyFor,
  readName,
  readPath,
  resolveRoot,
} from './scope.js'
import type { DesktopFacts, MutationPayload, RevealPayload } from '../shared/contract.js'

/**
 * The answer when the composed filesystem is not mounted.
 *
 * @returns the failure both halves word the same way.
 */
function noFilesystem(): MutationPayload {
  return { ok: false, error: 'The filesystem service is not mounted' }
}

/**
 * How one failure is worded for the page.
 *
 * A cause the page has words of its own travels as `reason`; everything else —
 * a permission denial, an I/O fault, a sandbox refusal — travels as `error` and
 * is drawn verbatim, because the Host's sentence is more specific than anything
 * this page could substitute.
 *
 * @param error - whatever the service threw.
 * @returns the failure payload.
 */
function failureOf(error: unknown): MutationPayload {
  if (hasCode(error, 'FS_ALREADY_EXISTS') || hasCode(error, 'EEXIST') || hasCode(error, 'FS_NOT_OBSERVED')) {
    return { ok: false, reason: 'exists', error: 'Something with that name already exists' }
  }
  if (hasCode(error, 'FS_STALE_VERSION') || hasCode(error, 'FS_NOT_FOUND') || hasCode(error, 'ENOENT')) {
    return { ok: false, reason: 'missing', error: 'That path no longer exists' }
  }
  if (hasCode(error, 'FS_SANDBOX_DENIED')) {
    return { ok: false, reason: 'read-only', error: 'This session cannot write to its workspace' }
  }
  if (hasCode(error, 'FS_NOT_REGULAR_FILE') || hasCode(error, 'EISDIR')) {
    return { ok: false, reason: 'unsupported', error: 'That change is not supported for this kind of entry' }
  }
  // The move reads its source as text to publish it, so a binary file reaches
  // here as a refusal to decode rather than as a failed rename. The page words
  // it: what it must not do is show the service's sentence about editing a PNG.
  if (hasCode(error, 'FS_NOT_TEXT')) {
    return { ok: false, reason: 'unsupported', error: 'That change is not supported for this kind of entry' }
  }
  return { ok: false, error: messageOf(error) }
}

/**
 * Whether one sandbox policy permits a write at all.
 *
 * @param policy - the resolved policy, when the composition has one.
 * @returns false only for a policy that is present and says `read-only`; a
 *   composition with no policy layer has nothing to refuse with.
 */
function permitsWrite(policy: unknown): boolean {
  return modeOf(policy) !== 'read-only'
}

/** The session's workspace root, or the failure the caller answers with. */
type RootAnswer =
  | { readonly ok: true; readonly root: string }
  | { readonly ok: false; readonly failure: MutationPayload }

/**
 * The root one command runs against, or the failure it answers with.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the root, or the failure the caller returns unchanged.
 */
async function requireRoot(ctx: any, sessionId: unknown): Promise<RootAnswer> {
  const root = await resolveRoot(ctx, sessionId)
  if (root === undefined) {
    return { ok: false, failure: { ok: false, error: 'This session has no working directory to browse' } }
  }
  return { ok: true, root }
}

/**
 * What the serving desktop can do with a workspace path.
 *
 * The page draws Reveal from this answer, so the question is asked of the same
 * service that would perform it — a Host with no native opener answers that
 * reveals are unavailable instead of offering a command that must fail after
 * the click.
 *
 * @param ctx - the Host plugin context.
 * @returns the desktop facts; every field is false when nothing can answer.
 */
export function desktopFacts(ctx: any): DesktopFacts {
  const controller = ctx.get('sessionController')
  if (controller !== undefined && typeof controller.workspaceDesktop === 'function') {
    try {
      const desktop = controller.workspaceDesktop()
      const manager = desktop?.fileManager
      if (desktop?.available === true && (manager === 'finder' || manager === 'explorer' || manager === 'directory')) {
        return { reveal: true, fileManager: manager }
      }
    } catch {
      /* an unreadable desktop description offers no native command */
    }
  }
  return { reveal: false }
}

/**
 * Whether the session's policy lets the page mutate its workspace.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns true when a write would not be refused by the policy alone.
 */
export function writableWorkspace(ctx: any, sessionId: unknown): boolean {
  return permitsWrite(policyFor(ctx, sessionId))
}

/**
 * Where one workspace path really is, when a Host operation may touch it.
 *
 * Two questions are asked and they fail differently, which is why the answer is
 * not simply a path. The first is containment: the entry has to resolve inside
 * the session's workspace, and on its *identity* rather than its spelling — a
 * symlink inside the tree may point outside it, and an operation performed
 * through that link would act on a file the session does not own. The second is
 * reach: the path has to be one this Host can map back to itself, which a
 * workspace living in a sandbox or over SSH cannot answer.
 *
 * @param fs - the composed filesystem service.
 * @param root - the absolute workspace root.
 * @param path - the entry as a workspace path.
 * @returns where it is, or which of the two questions refused.
 */
async function localPathOf(
  fs: any,
  root: string,
  path: string,
): Promise<{ path: string } | { refusal: MutationPayload }> {
  try {
    const workspace = await fs.resolve('.', { cwd: root })
    const target = await fs.resolve(path === '' ? '.' : path, { cwd: root })
    if (!fs.contains(workspace, target)) {
      return { refusal: { ok: false, reason: 'invalid', error: 'That entry points outside this workspace' } }
    }
    const host = await hostPathOf(fs, target)
    if (host === undefined) {
      return { refusal: { ok: false, reason: 'unsupported', error: 'This workspace does not live on the Host filesystem' } }
    }
    return { path: host }
  } catch (error) {
    return { refusal: failureOf(error) }
  }
}

/**
 * Whether a workspace path exists, and what it is.
 *
 * @param fs - the composed filesystem service.
 * @param root - the absolute workspace root.
 * @param path - the entry as a workspace path.
 * @returns its kind, or undefined when nothing is there.
 */
async function kindOf(fs: any, root: string, path: string): Promise<'file' | 'directory' | 'other' | undefined> {
  try {
    const info = await fs.stat(await fs.resolve(path, { cwd: root }))
    return info?.type
  } catch (error) {
    if (hasCode(error, 'FS_NOT_FOUND') || hasCode(error, 'ENOENT')) return undefined
    throw error
  }
}

/**
 * Rename one file or directory in place.
 *
 * A file is renamed by the filesystem service's own move, which keeps the
 * content, the line endings and the mode. A directory is renamed on the Host
 * filesystem once the target has been proven local, because the service has no
 * directory move and inventing one across a sandbox boundary would be worse
 * than refusing.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the entry to rename, as a workspace path.
 * @param rawName - the new name, as one path segment.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export async function renameEntry(
  ctx: any,
  sessionId: unknown,
  rawPath: unknown,
  rawName: unknown,
): Promise<MutationPayload> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, reason: 'invalid', error: 'The path must name a workspace entry' }
  const name = readName(rawName)
  if (name === undefined) return { ok: false, reason: 'invalid', error: 'That is not a valid name' }

  const answer = await requireRoot(ctx, sessionId)
  if (!answer.ok) return answer.failure

  const fs = ctx.get('fs')
  if (fs === undefined) return noFilesystem()
  // The fence is checked before anything is resolved: whether a write is allowed
  // is a fact about the session, and a refusal should not wait on the disk.
  if (!permitsWrite(policyFor(ctx, sessionId))) {
    return { ok: false, reason: 'read-only', error: 'This session cannot write to its workspace' }
  }

  const next = childPathOf(parentPathOf(path), name)
  try {
    const kind = await kindOf(fs, answer.root, path)
    if (kind === undefined) return { ok: false, reason: 'missing', error: 'That path no longer exists' }
    if (next === path) return { ok: true, path, name }
    if ((await kindOf(fs, answer.root, next)) !== undefined) {
      return { ok: false, reason: 'exists', error: 'Something with that name already exists' }
    }

    // A rename is one host operation for every kind of entry, and it is chosen
    // whenever the entry is genuinely on this machine. The filesystem service's
    // `moveFile` cannot stand in for it: it publishes the source's *text* at the
    // destination, so it refuses a binary file (`FS_NOT_TEXT`) and a directory
    // (`FS_NOT_REGULAR_FILE`) — neither of which is what the reader asked about.
    const source = await localPathOf(fs, answer.root, path)
    if ('refusal' in source) return source.refusal
    const destination = await localPathOf(fs, answer.root, next)
    if ('refusal' in destination) return destination.refusal
    await rename(source.path, destination.path)
    return { ok: true, path: next, name }
  } catch (error) {
    return failureOf(error)
  }
}

/**
 * Create one new file or directory under an existing directory.
 *
 * A file is created empty — the reader's next click opens it, and the editor is
 * what puts text in it. A directory is made on the Host filesystem once the
 * parent has been proven local, for the same reason a directory rename is.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawParent - the directory to create in, as a workspace path (empty for the root).
 * @param rawName - the new entry's name, as one path segment.
 * @param kind - which kind of entry to create.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export async function createEntry(
  ctx: any,
  sessionId: unknown,
  rawParent: unknown,
  rawName: unknown,
  kind: 'file' | 'directory',
): Promise<MutationPayload> {
  const parent = readPath(rawParent)
  if (parent === undefined) return { ok: false, reason: 'invalid', error: 'The path must be a workspace-relative path' }
  const name = readName(rawName)
  if (name === undefined) return { ok: false, reason: 'invalid', error: 'That is not a valid name' }

  const answer = await requireRoot(ctx, sessionId)
  if (!answer.ok) return answer.failure

  const fs = ctx.get('fs')
  if (fs === undefined) return noFilesystem()
  const policy = policyFor(ctx, sessionId)
  if (!permitsWrite(policy)) {
    return { ok: false, reason: 'read-only', error: 'This session cannot write to its workspace' }
  }

  const path = childPathOf(parent, name)
  try {
    const folderKind = await kindOf(fs, answer.root, parent === '' ? '.' : parent)
    if (folderKind === undefined) return { ok: false, reason: 'missing', error: 'That folder no longer exists' }
    if (folderKind !== 'directory') return { ok: false, reason: 'invalid', error: 'That is not a folder' }
    if ((await kindOf(fs, answer.root, path)) !== undefined) {
      return { ok: false, reason: 'exists', error: 'Something with that name already exists' }
    }

    if (kind === 'directory') {
      const target = await localPathOf(fs, answer.root, path)
      if ('refusal' in target) return target.refusal
      await mkdir(target.path)
      return { ok: true, path, name }
    }

    // An empty file created without reading anything first is exactly what
    // `createIfAbsent` is for; the service writes it atomically.
    await fs.writeText(await fs.resolve(path, { cwd: answer.root }), '', { kind: 'createIfAbsent' }, undefined, policy)
    return { ok: true, path, name }
  } catch (error) {
    return failureOf(error)
  }
}

/**
 * Delete one file or directory.
 *
 * A regular file goes through the filesystem service, which is bounded and
 * version-aware. A directory is removed recursively on the Host filesystem: the
 * page has already asked the reader to confirm, and "delete this folder" in a
 * tree means the folder and what it holds — leaving the children behind would
 * leave a workspace the reader cannot see half of.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the entry to delete, as a workspace path.
 * @returns the removed path, or an `ok: false` answer.
 */
export async function deleteEntry(
  ctx: any,
  sessionId: unknown,
  rawPath: unknown,
): Promise<MutationPayload> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, reason: 'invalid', error: 'The path must name a workspace entry' }

  const answer = await requireRoot(ctx, sessionId)
  if (!answer.ok) return answer.failure

  const fs = ctx.get('fs')
  if (fs === undefined) return noFilesystem()
  const policy = policyFor(ctx, sessionId)
  if (!permitsWrite(policy)) {
    return { ok: false, reason: 'read-only', error: 'This session cannot write to its workspace' }
  }

  try {
    const kind = await kindOf(fs, answer.root, path)
    if (kind === undefined) return { ok: false, reason: 'missing', error: 'That path no longer exists' }

    if (kind === 'directory') {
      const target = await localPathOf(fs, answer.root, path)
      if ('refusal' in target) return target.refusal
      await rm(target.path, { recursive: true, force: true })
      return { ok: true, path }
    }

    await fs.deleteFile(await fs.resolve(path, { cwd: answer.root }), undefined, undefined, policy)
    return { ok: true, path }
  } catch (error) {
    return failureOf(error)
  }
}

/**
 * Show one workspace path in the Host desktop's file manager.
 *
 * The path is verified before it is handed over: it must resolve inside the
 * session's workspace, and it must also be a path this Host can reach — the
 * same canonical round trip the session controller makes before it opens
 * anything. The reveal then belongs to that service rather than to this plugin,
 * so the Finder/Explorer command itself stays one implementation in the product.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the entry to reveal, as a workspace path.
 * @returns the reveal outcome, or an `ok: false` answer.
 */
export async function revealEntry(
  ctx: any,
  sessionId: unknown,
  rawPath: unknown,
): Promise<RevealPayload> {
  const path = readPath(rawPath)
  if (path === undefined || path === '') return { ok: false, error: 'The path must name a workspace entry' }

  const answer = await requireRoot(ctx, sessionId)
  if (!answer.ok) return { ok: false, error: answer.failure.error ?? 'This session has no working directory to browse' }

  const fs = ctx.get('fs')
  if (fs === undefined) return { ok: false, error: 'The filesystem service is not mounted' }

  const controller = ctx.get('sessionController')
  if (controller === undefined || typeof controller.openWorkspacePath !== 'function') {
    return { ok: false, reason: 'unavailable', error: 'This Host has no desktop to show the file on' }
  }

  try {
    const target = await fs.resolve(path, { cwd: answer.root })
    const info = await fs.stat(target)
    if (info === undefined) return { ok: false, error: 'That path no longer exists' }
    const hostPath = await hostPathOf(fs, target)
    if (hostPath === undefined) {
      return { ok: false, reason: 'unavailable', error: 'This workspace is not on the Host filesystem' }
    }
    const outcome = await controller.openWorkspacePath({ path: hostPath, action: 'reveal' }, new AbortController().signal)
    if (outcome?.opened !== true) return { ok: false, error: 'The file manager did not open' }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}
