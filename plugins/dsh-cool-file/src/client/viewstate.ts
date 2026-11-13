/**
 * The Files page's memory of how one workspace was being browsed.
 *
 * The shell renders exactly one conversation View at a time, so switching to
 * another tab unmounts this page, and switching back mounts a new instance of
 * it. Without a memory that mount is a cold start: a bare root, every folder
 * closed and an empty preview, however carefully the reader had arranged the
 * tree before they looked away. The shape of the browsing — which folders are
 * open, which file is on screen — is therefore kept where the next mount can
 * find it.
 *
 * Three layers, the same trade `dsh-cool-git`'s cache makes:
 *
 *   1. a module-level map, which outlives the unmount and is what makes a tab
 *      switch paint the tree the reader left at once;
 *   2. one `localStorage` entry per workspace root, which outlives a page
 *      reload and is read before the first paint;
 *   3. one `localStorage` alias per session, which is how a mount that has not
 *      asked the Host anything yet learns which workspace root to look for.
 *
 * Nothing read from disk is remembered. An entry holds paths and nothing else:
 * every restored branch and every restored file is read again from the Host, so
 * a tree that comes back is the workspace as it is now, drawn in the shape it
 * was left in. Unsaved editor drafts are deliberately not stored either — an
 * edit the reader has not saved belongs to the page that holds it.
 *
 * Keys are the workspace's absolute root, not the session's: every session in
 * one workspace browses the same directory tree, so one entry serves them all.
 * The alias is what a mount uses to find that entry before the Host has named
 * the root.
 *
 * Nothing here throws. `localStorage` may be refused (quota, a sandboxed frame,
 * a browser that will not store) and a stored entry may be damaged, hand-edited
 * or written by an earlier revision of this plugin, so every read is treated as
 * data rather than trusted and every write is allowed to fail: persistence is a
 * convenience, never a precondition.
 */

/**
 * The prefix every entry this plugin writes carries.
 *
 * Versioned because the shape is: a later revision that stores something else
 * under the same names must not read this revision's values as its own. The
 * version lives in the key rather than inside the value, so an old entry is
 * simply never found, and the index below drops it on the next write.
 */
const PREFIX = 'dsh-cool-file.view.v1'

/** The `localStorage` entry listing the workspaces whose shape is saved. */
const INDEX_KEY = `${PREFIX}.workspaces`

/**
 * How many workspaces' shapes are kept persisted; the oldest goes first.
 *
 * The bound is on disk, not in memory: the map keeps every shape this page has
 * used, because dropping one would turn a tab switch back into a cold start for
 * no benefit — one entry is a few hundred short paths at most.
 */
const MAX_SAVED_WORKSPACES = 8

/**
 * How many open folders one entry keeps.
 *
 * A reader can open an arbitrary number of branches, and `localStorage` is one
 * shared quota. The list is written in the order the folders were opened, so the
 * head is the branches nearest the root — the ones a truncated entry can still
 * rebuild a tree from.
 */
const MAX_OPEN_FOLDERS = 512

/** What one workspace remembers about how it was being browsed. */
export interface FilesViewState {
  /** The folders drawn open, by workspace path, in the order they were opened. */
  readonly expanded: readonly string[]
  /** The file on screen, or null when the preview pane held no file. */
  readonly selected: string | null
}

/** One workspace's browsing shape, with the root it was saved under. */
export interface RestoredViewState extends FilesViewState {
  /** The absolute workspace root the shape belongs to. */
  readonly root: string
}

/** The shapes alive in this page, keyed by workspace root. */
const views = new Map<string, FilesViewState>()

/** Session identity to workspace root, as earlier mounts learned it. */
const aliases = new Map<string, string>()

/**
 * The identity one session's shape is aliased under.
 *
 * A session id is the key the page knows before it knows anything else, but the
 * page cannot run without one — the Host falls back to the executor's own
 * directory — so the empty string stands for "the session the shell did not
 * name": one shape for that root, which is the same shape every such mount
 * would read.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the alias key.
 */
function identityOf(sessionId: string | undefined): string {
  return sessionId ?? ''
}

/**
 * One workspace's `localStorage` entry name.
 *
 * @param root - the workspace's absolute root.
 * @returns the entry name.
 */
function viewKey(root: string): string {
  return `${PREFIX}.root.${encodeURIComponent(root)}`
}

/**
 * One session's alias entry name.
 *
 * @param session - the session identity, as {@link identityOf} spelled it.
 * @returns the entry name.
 */
function aliasKey(session: string): string {
  return `${PREFIX}.session.${encodeURIComponent(session)}`
}

/**
 * Read one value as a workspace path.
 *
 * The grammar is the Host route's: relative, `/`-joined, no parent segment and no
 * NUL. `''` is the root and is returned as such; a value that is not a path at
 * all answers `undefined`, which is how a damaged entry is told apart from the
 * root.
 *
 * @param value - the stored value.
 * @returns the normalized path, or undefined when it is not one.
 */
function asPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.includes('\0')) return undefined
  const path = value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')
  if (path.startsWith('/')) return undefined
  for (const segment of path.split('/')) {
    if (segment === '..') return undefined
  }
  return path
}

/**
 * Whether one value is a plain object worth reading fields from.
 *
 * @param value - the value to check.
 * @returns true for a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read one stored value as a browsing shape, or null when it is not one.
 *
 * A value written by another revision of this plugin, or damaged on disk, is the
 * same answer as no entry at all — the mount then starts from a bare root. A
 * single unusable path inside a list is dropped rather than failing the whole
 * entry: the rest of the shape is still a tree the reader can be returned to.
 *
 * An open folder is only kept when every folder above it is open too. The page
 * walks a restored shape down from the root, one directory at a time, so a path
 * whose parent is not in the list would never be reached — and keeping it would
 * leave the saved entry carrying branches that cannot be drawn.
 *
 * @param value - the parsed entry.
 * @returns the shape, or null when the value is not one.
 */
function asState(value: unknown): FilesViewState | null {
  if (!isRecord(value)) return null
  const expanded = value.expanded
  if (!Array.isArray(expanded)) return null

  const listed = new Set<string>()
  for (const item of expanded) {
    const path = asPath(item)
    // The root is always drawn, so a branch list that names it is noise.
    if (path === undefined || path === '' || listed.has(path)) continue
    listed.add(path)
  }

  const folders = [...listed].filter((path) => {
    for (let parent = parentOf(path); parent !== ''; parent = parentOf(parent)) {
      if (!listed.has(parent)) return false
    }
    return true
  })

  const raw = value.selected
  const selected = raw === null || raw === undefined ? null : asPath(raw)
  if (selected === undefined) return null
  return { expanded: folders, selected: selected === '' ? null : selected }
}

/**
 * The path of the directory holding one path.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the parent's path, or the empty string (the root) for a top-level name.
 */
function parentOf(path: string): string {
  const at = path.lastIndexOf('/')
  return at === -1 ? '' : path.slice(0, at)
}

/**
 * The workspace order the index holds, most recently written first.
 *
 * @returns the roots the index lists; anything unreadable reads as empty.
 */
function readIndex(): string[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(INDEX_KEY)
  } catch {
    return []
  }
  if (raw === null) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter((entry): entry is string => typeof entry === 'string' && entry !== '')
}

/**
 * Put one workspace at the head of the index, and drop the entries past the
 * bound.
 *
 * Eviction is by write order rather than by read: a page that only ever reads is
 * the page that benefits from the entry, and re-writing the index on every read
 * would trade a read for a write on the common path. The bound is what keeps a
 * long-lived page from accumulating every workspace it ever browsed.
 *
 * @param root - the workspace just written.
 */
function touchIndex(root: string): void {
  const order = readIndex().filter((entry) => entry !== root)
  order.unshift(root)
  for (const dropped of order.slice(MAX_SAVED_WORKSPACES)) {
    try {
      localStorage.removeItem(viewKey(dropped))
    } catch {
      /* an entry left behind is one the next index write will forget */
    }
  }
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(order.slice(0, MAX_SAVED_WORKSPACES)))
  } catch {
    /* the entries are still readable by alias; the bound is only a bound */
  }
}

/**
 * Read and check one stored shape.
 *
 * @param root - the workspace to read.
 * @returns the shape, or null when there is none or it cannot be trusted.
 */
function readStored(root: string): FilesViewState | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(viewKey(root))
  } catch {
    return null
  }
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  return asState(parsed)
}

/**
 * The workspace root a session was last seen browsing, if any.
 *
 * @param session - the session identity, as {@link identityOf} spelled it.
 * @returns the root, or undefined when no mount has recorded one.
 */
function readAlias(session: string): string | undefined {
  const known = aliases.get(session)
  if (known !== undefined) return known
  let stored: string | null
  try {
    stored = localStorage.getItem(aliasKey(session))
  } catch {
    return undefined
  }
  if (stored === null || stored === '') return undefined
  aliases.set(session, stored)
  return stored
}

/**
 * Record the workspace a session browsed.
 *
 * Written through to `localStorage` so the alias survives a page reload, which
 * is the reload where the mount has no answer of its own and must find the saved
 * shape before it asks the Host.
 *
 * @param session - the session identity, as {@link identityOf} spelled it.
 * @param root - the workspace root the session browsed.
 */
function writeAlias(session: string, root: string): void {
  if (aliases.get(session) === root) return
  aliases.set(session, root)
  try {
    localStorage.setItem(aliasKey(session), root)
  } catch {
    /* the in-memory alias still serves this page's mounts */
  }
}

/**
 * Persist one shape, and move its workspace to the head of the index.
 *
 * A write that fails is not reported: the memory copy is what the next tab
 * switch reads, and only a page reload would notice the difference.
 *
 * @param root - the workspace the shape belongs to.
 * @param state - the shape to save.
 */
function persist(root: string, state: FilesViewState): void {
  try {
    localStorage.setItem(viewKey(root), JSON.stringify(state))
  } catch {
    return
  }
  touchIndex(root)
}

/**
 * The browsing shape a session's workspace was left in, if there is one.
 *
 * The alias answers before the Host does: a session that has opened this tab
 * before names its workspace root from `localStorage`, so a reloading page finds
 * the saved shape during its first render rather than after a network round
 * trip. A session no mount has seen answers null, and that mount starts exactly
 * as it did before this memory existed.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the saved shape with its root, or null when there is none.
 */
export function readViewState(sessionId: string | undefined): RestoredViewState | null {
  return readForRoot(readAlias(identityOf(sessionId)))
}

/**
 * The browsing shape one workspace root was left in, whatever session asks.
 *
 * A session that has never opened this tab has no alias yet, so
 * {@link readViewState} cannot answer for it before the Host names the
 * directory. Once the first listing does name it, this is the workspace's own
 * shape — shared by every session in that workspace, exactly as the shape is
 * keyed — and the page may adopt it if the reader has not started arranging
 * anything themselves.
 *
 * @param root - the workspace's absolute root.
 * @returns the saved shape, or null when this workspace has none.
 */
export function readWorkspaceViewState(root: string): FilesViewState | null {
  const restored = readForRoot(root === '' ? undefined : root)
  return restored === null ? null : { expanded: restored.expanded, selected: restored.selected }
}

/**
 * Resolve one root to its saved shape, through the memory and then the disk.
 *
 * @param root - the root to read, or undefined when nothing names one.
 * @returns the shape with its root, or null when there is none to draw.
 */
function readForRoot(root: string | undefined): RestoredViewState | null {
  if (root === undefined) return null
  let state = views.get(root)
  if (state === undefined) {
    const stored = readStored(root)
    if (stored === null) return null
    views.set(root, stored)
    state = stored
  }
  return { root, expanded: state.expanded, selected: state.selected }
}

/**
 * Remember the shape one workspace is being left in.
 *
 * Called for every change of the two facts the shape is made of, so what is
 * stored is always the tree as it was last drawn. The root is required: a page
 * that has not yet been told which directory it is browsing has nothing to
 * attribute a shape to, and writing one under a guessed key would hand another
 * workspace this one's tree.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @param root - the workspace's absolute root, as the Host named it.
 * @param state - the folders that are open and the file on screen.
 */
export function writeViewState(
  sessionId: string | undefined,
  root: string,
  state: FilesViewState,
): void {
  if (root === '') return
  const saved: FilesViewState = {
    expanded: state.expanded.slice(0, MAX_OPEN_FOLDERS),
    selected: state.selected,
  }
  views.set(root, saved)
  writeAlias(identityOf(sessionId), root)
  persist(root, saved)
}
