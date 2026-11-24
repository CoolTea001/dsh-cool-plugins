/**
 * The fences every route stands behind, in one place.
 *
 * Four facts are asked of every request the page makes — which workspace it
 * belongs to, which workspace path it names, which process path that resolves
 * to, and which sandbox policy the write may run under — and each of them has
 * exactly one right answer rather than one per route. Keeping them here means a
 * read route and a mutation route cannot drift apart about what "inside the
 * workspace" means, and a new route inherits the whole fence by asking the same
 * three questions.
 *
 * Nothing in this module touches the plugin's own state: it reads the session
 * header, the composed filesystem and the sandbox policy, and answers with
 * plain values.
 */

import { join } from 'node:path'

/** A stand-in session identity for a request that named none. */
export const LOCAL_SESSION = 'local'

/**
 * The session's own workspace root.
 *
 * Live header first, then the durable header of a session the Host has not
 * resumed yet, then the executor's default directory. Every read is
 * best-effort: an unreadable store is not a route's answer to give.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the absolute workspace root, or undefined when none can be named.
 */
export async function resolveRoot(ctx: any, sessionId: unknown): Promise<string | undefined> {
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
export function scopeOf(sessionId: unknown, root: string): { sessionId: string; workspaceRoot: string } {
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
export function readPath(value: unknown): string | undefined {
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
 * Read a name the page wants a new file or directory to have.
 *
 * A name is one path segment, never a path: a slash, a backslash, a NUL, an
 * empty string, `.` and `..` are all refused here, and the answer is the name
 * to create rather than a silent rewrite of it. Surrounding whitespace is
 * trimmed because a name that only looks empty would otherwise create a file
 * nobody can see in the tree.
 *
 * @param value - the raw body value.
 * @returns the name, or undefined when it is not one segment.
 */
export function readName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const name = value.trim()
  if (name === '' || name === '.' || name === '..') return undefined
  if (name.includes('\0') || name.includes('/') || name.includes('\\')) return undefined
  return name
}

/**
 * One failure, as the page's error state words it.
 *
 * @param error - whatever the service threw.
 * @returns the text the page draws.
 */
export function messageOf(error: unknown): string {
  if (error instanceof Error && error.message !== '') return error.message
  return String(error)
}

/**
 * The sandbox policy one write runs under.
 *
 * The session's own mode and `cwd` are the fence, exactly as they are for the
 * agent's write tool — the file tree must not be a way around a read-only
 * session. A request that names no live session has no policy to inherit; the
 * deployment default then applies, bounded by its own fallback root, and a
 * workspace the default does not cover is refused rather than quietly widened.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the policy for this call, or undefined when no service owns one.
 */
export function policyFor(ctx: any, sessionId: unknown): unknown {
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

/**
 * The sandbox mode a policy carries, when it carries one.
 *
 * @param policy - whatever {@link policyFor} answered.
 * @returns the mode, or undefined when the policy is not an object with one.
 */
export function modeOf(policy: unknown): string | undefined {
  if (typeof policy !== 'object' || policy === null || !('mode' in policy)) return undefined
  const mode = (policy as { mode?: unknown }).mode
  return typeof mode === 'string' ? mode : undefined
}

/** Whether a caught error carries one of the filesystem service's stable codes. */
export function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

/**
 * The canonical process path of one target, when it is also a path on this host.
 *
 * Three facts have to agree before a path may be handed to a native operation:
 * the provider can spell it as a process path, the host can map that path back
 * into the provider's world, and the round trip lands on the same identity.
 * That is the same test the session controller applies before it opens a path
 * natively, and it is what keeps a remote or sandboxed workspace from having a
 * host filesystem operation applied to a path that merely looks like one.
 *
 * @param fs - the composed filesystem service.
 * @param target - the resolved target.
 * @returns the absolute process path, or undefined when the host cannot reach it.
 */
export async function hostPathOf(fs: any, target: any): Promise<string | undefined> {
  try {
    const path = typeof fs.processPath === 'function' ? fs.processPath(target) : undefined
    if (typeof path !== 'string' || path === '') return undefined
    const mapped = typeof fs.processPathFromHostPath === 'function' ? fs.processPathFromHostPath(path) : undefined
    if (typeof mapped !== 'string' || mapped === '') return undefined
    const again = await fs.resolve(mapped)
    return fs.processPath(again) === path ? path : undefined
  } catch {
    return undefined
  }
}

/**
 * The workspace path of one child, given its parent and its own name.
 *
 * @param parent - the parent's workspace path; empty for the root.
 * @param name - the child's own name.
 * @returns the child's workspace path.
 */
export function childPathOf(parent: string, name: string): string {
  return parent === '' ? name : `${parent}/${name}`
}

/**
 * The workspace path of the directory holding one path.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the parent's path, or the empty string (the root).
 */
export function parentPathOf(path: string): string {
  const at = path.lastIndexOf('/')
  return at === -1 ? '' : path.slice(0, at)
}

/**
 * Join one workspace path and one child name the way the Host spells a path.
 *
 * The tree's own vocabulary is `/`-joined, but the composed filesystem resolves
 * against the platform's spelling; `join` is what keeps the two apart — and
 * what makes a resolved target the same identity the listing reported.
 *
 * @param root - the absolute workspace root.
 * @param path - the workspace-relative path.
 * @returns the absolute path.
 */
export function absoluteOf(root: string, path: string): string {
  return path === '' ? root : join(root, path)
}
