/**
 * The Files conversation view.
 *
 * The page is the whole of the tab: a sidebar holding one workspace tree and a
 * preview pane taking every remaining pixel. The tree is expanded in place —
 * opening a folder inserts its children under its own row instead of replacing
 * the list — so the workspace keeps one continuous shape while the reader walks
 * it. Directories are read lazily: the root when the tab mounts, then one
 * directory per folder the reader opens, cached for the life of the page.
 *
 * The page owns no workspace state of its own: every answer is a plain value
 * fetched from the Host over this package's own same-origin routes (see
 * `api.ts`), and the only local state is which folders are open, which children
 * have arrived, whether the entries the system hides are drawn, which file is
 * selected, and which request is in flight.
 *
 * The page is read-only on purpose. It lists entries, expands them, and shows
 * the first page of a text file; it never writes, renames, or deletes. That
 * keeps the Host route a read and the tab safe to leave open.
 *
 * The page is full-bleed, the same way the Terminal and Git tabs are: the root
 * class gives the stylesheet a handle on this subtree, the root declares the
 * shell's composer-overlay hook (which drops the transcript width handles), and
 * the mounted View suppresses the composer seat the shell mounts for every View
 * — see `chrome.ts`.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'
import { fetchFile, fetchListing } from './api.js'
import { suppressComposerSeat } from './chrome.js'
import { CodePreview } from './code.js'
import { IconArrow, IconFile, IconFolder, IconHide, IconRefresh, IconShow } from './icons.js'
import { clampSideWidth, readLayout, ResizeHandle, writeLayout, type FileLayout } from './layout.js'
import type { Translate } from './locales.js'
import { FILES_ROOT_CLASS } from './styles.js'
import type { FileEntry, ListPayload } from '../shared/contract.js'

/** The root is the whole conversation body, sized the way the shell hands it over. */
const PAGE: CSSProperties = {
  height: '100%',
  width: '100%',
}

/** What one open preview holds. */
interface Preview {
  readonly text: string
  readonly lines: number
  readonly eof: boolean
  readonly bytes?: number
}

/**
 * What the page knows about one directory.
 *
 * `entries` is kept across a reload so a directory the reader is looking at does
 * not blink empty while its next answer is in flight; an error keeps the same
 * shape as a successful answer, with no entries behind it.
 */
interface DirectoryState {
  readonly loading: boolean
  /** The Host's message, or `''` when it gave none. Null means "no error". */
  readonly error: string | null
  readonly entries: readonly FileEntry[]
  readonly truncated: boolean
}

/** A directory whose children have not arrived yet. */
const PENDING: DirectoryState = {
  loading: true,
  error: null,
  entries: [],
  truncated: false,
}

/** Where the page remembers whether the entries the system hides are drawn. */
const HIDDEN_KEY = 'dsh-cool-file.hidden.v1'

/**
 * The saved choice about dotted entries; shown until the reader says otherwise.
 *
 * The default is "shown" because that is what the tree did before the toggle
 * existed: a reader who has never touched the eye keeps the workspace they were
 * already browsing, dotted entries and all.
 *
 * @returns whether hidden entries are drawn.
 */
function readShowHidden(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) !== 'false'
  } catch {
    /* storage unavailable: the default lasts for this page */
    return true
  }
}

/**
 * Save the choice about dotted entries.
 *
 * @param show - whether hidden entries are drawn.
 */
function writeShowHidden(show: boolean): void {
  try {
    window.localStorage.setItem(HIDDEN_KEY, String(show))
  } catch {
    /* storage unavailable: the choice lasts for this page */
  }
}

/**
 * A byte count as the list row shows it.
 *
 * @param bytes - the size to format.
 * @returns a short human-readable size.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB'] as const
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 ? value.toFixed(1) : String(Math.round(value))} ${units[unit]}`
}

/**
 * The last segment of a workspace path.
 *
 * @param path - a `/`-joined path.
 * @returns the basename, or the path itself when it has no separator.
 */
function baseName(path: string): string {
  const at = path.lastIndexOf('/')
  return at === -1 ? path : path.slice(at + 1)
}

/**
 * The last segment of an absolute workspace root.
 *
 * Kept separate from {@link baseName} because a root arrives in the Host's own
 * path form, which carries the platform separator: the workspace-relative paths
 * this page walks are always `/`-joined, but `C:\Users\me\project` is not.
 *
 * @param root - the absolute workspace root.
 * @returns the directory's own name.
 */
function workspaceNameOf(root: string): string {
  const segments = root.split(/[\\/]/).filter((segment) => segment !== '')
  return segments[segments.length - 1] ?? ''
}

/** How one directory orders its children: folders first, then names naturally. */
function compareEntries(a: FileEntry, b: FileEntry): number {
  const rank = (entry: FileEntry): number => (entry.type === 'directory' ? 0 : 1)
  if (rank(a) !== rank(b)) return rank(a) - rank(b)
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
}

/** The workspace path of one child, given its parent and its own name. */
function childPath(parent: string, name: string): string {
  return parent === '' ? name : `${parent}/${name}`
}

/**
 * Render the Files tab's body.
 *
 * @param props - the standard conversation-View props; the session id is used,
 *   and `t` is the locale seat the framework hands every entry that declares a
 *   dictionary namespace.
 * @returns the Files page element.
 */
export function FilesView(props: { readonly sessionId?: unknown; readonly t: Translate }): ReactElement {
  const { t } = props
  const sessionId = typeof props?.sessionId === 'string' ? props.sessionId : undefined
  const page = useRef<HTMLDivElement | null>(null)
  /** The sidebar itself, whose measured width is where a drag takes hold. */
  const side = useRef<HTMLElement | null>(null)

  /**
   * The workspace's own display name, which titles the sidebar.
   *
   * Kept beside the tree rather than derived from it on every render: a reload
   * replaces the directories, and the name must not blink out of the header
   * while the next answer is in flight.
   */
  const [workspaceName, setWorkspaceName] = useState('')
  /** Every directory whose children have been asked for, by workspace path. */
  const [directories, setDirectories] = useState<Readonly<Record<string, DirectoryState>>>({})
  /** The directories whose children are drawn, by workspace path. */
  const [expanded, setExpanded] = useState<readonly string[]>([])
  /** Whether entries whose names start with a dot are drawn. */
  const [showHidden, setShowHidden] = useState(readShowHidden)
  /** The selected file path, or null while the empty state is showing. */
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  /** Guards the preview against an answer for a file that is no longer selected. */
  const previewToken = useRef(0)
  /** Directories with a request in flight, so a double click asks once. */
  const inFlight = useRef<Set<string>>(new Set())
  /**
   * Bumped whenever the whole tree is replaced. An answer carrying an older
   * generation belongs to a tree that is no longer on screen and is dropped.
   */
  const generation = useRef(0)
  /** The sidebar width the page draws and saves. */
  const [layout, setLayout] = useState<FileLayout>(readLayout)
  /** Whether this page's own boundary is being dragged. */
  const [resizing, setResizing] = useState(false)

  /**
   * Draw one layout: the sidebar's width, as a custom property on the root.
   *
   * The width lives on the root rather than in the sidebar's inline style for one
   * reason: a drag can then move it from the pointer without rendering React,
   * which keeps the frame rate independent of how many file rows the tree holds.
   */
  const publish = useCallback((next: FileLayout): void => {
    page.current?.style.setProperty('--dsh-cf-side-width', `${next.sideWidth}px`)
  }, [])

  // Before the first paint: the stylesheet's own fallback is the default width,
  // and a saved boundary must not be drawn at the default for one frame and then
  // jump to where it was left.
  useLayoutEffect(() => {
    publish(layout)
  }, [layout, publish])

  /** The page's own width, which is the room the sidebar and the preview share. */
  const available = useCallback((): number => page.current?.getBoundingClientRect().width ?? 0, [])

  /**
   * Record one layout: what the page draws from, and what it saves.
   *
   * The two are written together on purpose. A width drawn but not saved is one
   * the next visit forgets; a width saved but not drawn is a drag that looks like
   * it did nothing until the tab is reopened.
   */
  const record = useCallback((next: FileLayout): void => {
    setLayout(next)
    writeLayout(next)
  }, [])

  /**
   * Where the sidebar's edge is, as a drag starts.
   *
   * Measured off the box rather than read from the layout: the stylesheet is what
   * clamps a saved width to the window it is drawn in, so the edge on screen —
   * not the preference behind it — is where the pointer has actually taken hold.
   */
  const startSideResize = useCallback((): number => {
    setResizing(true)
    return side.current?.getBoundingClientRect().width ?? layout.sideWidth
  }, [layout.sideWidth])

  /** Draw the sidebar width the pointer implies, for this frame. */
  const dragSideResize = useCallback(
    (width: number): void => {
      const room = available()
      if (room <= 0) return
      page.current?.style.setProperty('--dsh-cf-side-width', `${clampSideWidth(width, room)}px`)
    },
    [available],
  )

  /** Record the sidebar width the gesture settled on. */
  const commitSideResize = useCallback(
    (width: number): void => {
      setResizing(false)
      const room = available()
      if (room <= 0) return
      record({ sideWidth: clampSideWidth(width, room) })
    },
    [available, record],
  )

  /**
   * A gesture that produced no width — a click on the boundary, or a pointer lost
   * mid-drag — draws the recorded layout again, so the preview a cancelled drag
   * left on screen cannot outlive the gesture.
   */
  const endResize = useCallback((): void => {
    setResizing(false)
    publish(layout)
  }, [layout, publish])

  // Layout effect, not a passive one: the composer seat is already in the tree
  // when this View mounts, and a passive effect would paint one frame of an
  // input this page cannot use.
  useLayoutEffect(() => suppressComposerSeat(page.current), [])

  /**
   * Ask the Host for one directory's children and file the answer under its path.
   *
   * The answer is merged into the map rather than replacing it: every open branch
   * keeps its own children, and a request for one folder never disturbs another.
   * A request already in flight for the same path is not repeated, and an answer
   * from before the tree was replaced is dropped.
   *
   * @param path - the directory as a workspace path; empty for the root.
   */
  const loadDirectory = useCallback(
    (path: string): void => {
      if (inFlight.current.has(path)) return
      const token = generation.current
      inFlight.current.add(path)
      setDirectories((previous) => ({
        ...previous,
        [path]: { ...(previous[path] ?? PENDING), loading: true, error: null },
      }))
      void fetchListing(sessionId, path).then((payload: ListPayload) => {
        if (token !== generation.current) return
        inFlight.current.delete(path)
        if (payload.ok === true) {
          // The Host answers the workspace's registry title when it can read one;
          // an older Host (or a composition without the registry) only supplies
          // the absolute root, and its basename is the name the sidebar shows.
          const name =
            typeof payload.workspace === 'string' && payload.workspace !== ''
              ? payload.workspace
              : typeof payload.root === 'string'
                ? workspaceNameOf(payload.root)
                : ''
          if (name !== '') setWorkspaceName(name)
          setDirectories((previous) => ({
            ...previous,
            [path]: {
              loading: false,
              error: null,
              entries: payload.entries ?? [],
              truncated: payload.truncated === true,
            },
          }))
          return
        }
        setDirectories((previous) => ({
          ...previous,
          [path]: {
            loading: false,
            error: typeof payload.error === 'string' ? payload.error : '',
            entries: [],
            truncated: false,
          },
        }))
      })
    },
    [sessionId],
  )

  // One tree per session: switching sessions drops every cached directory, every
  // open branch and the file being previewed, then reads the new root. The
  // generation bump is what keeps an answer for the old session out of the new
  // tree.
  useEffect(() => {
    generation.current += 1
    inFlight.current.clear()
    previewToken.current += 1
    setWorkspaceName('')
    setDirectories({})
    setExpanded([])
    setSelected(null)
    setPreview(null)
    setFileError(null)
    setFileLoading(false)
    loadDirectory('')
  }, [sessionId, loadDirectory])

  const openFile = useCallback(
    (path: string): void => {
      const token = previewToken.current + 1
      previewToken.current = token
      setSelected(path)
      setPreview(null)
      setFileError(null)
      setFileLoading(true)
      void fetchFile(sessionId, path).then((payload) => {
        if (previewToken.current !== token) return
        setFileLoading(false)
        if (payload.ok !== true) {
          setFileError(payload.error ?? t('error.read'))
          return
        }
        setPreview({
          text: pendingText(payload.text),
          lines: typeof payload.lines === 'number' ? payload.lines : 0,
          eof: payload.eof !== false,
          ...(typeof payload.bytes === 'number' ? { bytes: payload.bytes } : {}),
        })
      })
    },
    [sessionId, t],
  )

  /**
   * Open one branch, or close it again.
   *
   * A folder's children are asked for the first time it opens, and asked again
   * when the last answer was an error — closing and reopening is the reader's
   * retry for one branch, without reloading the tree around it.
   */
  const toggleDirectory = useCallback(
    (path: string): void => {
      if (expanded.includes(path)) {
        setExpanded(expanded.filter((item) => item !== path))
        return
      }
      setExpanded([...expanded, path])
      const state = directories[path]
      if (state === undefined || state.error !== null) loadDirectory(path)
    },
    [directories, expanded, loadDirectory],
  )

  /**
   * Show or hide the entries the system hides.
   *
   * Nothing is re-read: the listing already carries every child, so the choice
   * only changes what is drawn. A hidden folder keeps its branch state, which is
   * what lets the reader bring it back exactly as they left it.
   */
  const toggleHidden = useCallback((): void => {
    const next = !showHidden
    setShowHidden(next)
    writeShowHidden(next)
  }, [showHidden])

  /**
   * Re-read the tree that is on screen: the root and every open branch.
   *
   * Open branches are kept open on purpose — Refresh is "ask again", not "start
   * over" — and the selected file is read again beside them, so a change on disk
   * shows everywhere the reader is looking.
   */
  const refresh = useCallback((): void => {
    generation.current += 1
    inFlight.current.clear()
    const open = expanded.filter((path) => directories[path] !== undefined)
    setDirectories({})
    for (const path of ['', ...open]) loadDirectory(path)
    if (selected !== null) openFile(selected)
  }, [directories, expanded, loadDirectory, openFile, selected])

  /**
   * One directory's rows, and the rows of every open folder inside it.
   *
   * Recursion rather than a flattened list: an open folder owns its children in
   * the DOM, which is what gives each branch its indented block
   * without pairing rows back up with their depth afterwards.
   *
   * @param path - the directory to draw; empty for the root.
   * @returns its children, the open ones followed by their own.
   */
  const drawLevel = (path: string): ReactElement[] => {
    const state = directories[path]
    if (state === undefined) {
      return [
        <div className="dsh-cf-note" key={`${path}:pending`}>
          {t('side.loading')}
        </div>,
      ]
    }
    if (state.error !== null) {
      return [
        <div className="dsh-cf-error" key={`${path}:error`}>
          {state.error === '' ? t('side.error') : state.error}
        </div>,
      ]
    }
    if (state.entries.length === 0) {
      return [
        <div className="dsh-cf-note" key={`${path}:empty`}>
          {state.loading ? t('side.loading') : t('side.empty')}
        </div>,
      ]
    }

    // A dotted name is the system's own "hidden" mark; the eye decides whether
    // those children are drawn, and the listing itself always carries them.
    const entries = showHidden
      ? state.entries
      : state.entries.filter((entry) => !entry.name.startsWith('.'))
    if (entries.length === 0) {
      return [
        <div className="dsh-cf-note" key={`${path}:filtered`}>
          {t('side.filtered')}
        </div>,
      ]
    }

    const rows: ReactElement[] = [...entries].sort(compareEntries).map((entry) => {
      const target = childPath(path, entry.name)
      const isDirectory = entry.type === 'directory'
      const open = isDirectory && expanded.includes(target)
      return (
        <div className="dsh-cf-node" key={target}>
          <button
            type="button"
            className="dsh-cf-row"
            data-type={entry.type}
            data-open={open ? '' : undefined}
            data-selected={!isDirectory && selected === target ? '' : undefined}
            title={entry.name}
            aria-expanded={isDirectory ? open : undefined}
            disabled={entry.type === 'other'}
            onClick={() => {
              if (isDirectory) {
                toggleDirectory(target)
                return
              }
              if (entry.type === 'file') openFile(target)
            }}
          >
            <span className="dsh-cf-twist" aria-hidden="true">
              {isDirectory ? <IconArrow /> : null}
            </span>
            <span className="dsh-cf-row-icon" aria-hidden="true">
              {isDirectory ? <IconFolder /> : <IconFile />}
            </span>
            <span className="dsh-cf-row-name">{entry.name}</span>
            {entry.type === 'file' && entry.size !== undefined ? (
              <span className="dsh-cf-row-size">{formatSize(entry.size)}</span>
            ) : null}
          </button>
          {open ? <div className="dsh-cf-children">{drawLevel(target)}</div> : null}
        </div>
      )
    })

    if (state.truncated) {
      rows.push(
        <div className="dsh-cf-note" key={`${path}:truncated`}>
          {t('side.truncated')}
        </div>,
      )
    }
    return rows
  }

  return (
    <div
      ref={page}
      className={FILES_ROOT_CLASS}
      data-dsh-cool-file="view"
      // The shell's full-bleed opt-in, the hook the trajectory and terminal
      // views declare: the shell then drops the transcript width handles and
      // gives this View the whole conversation body.
      data-conversation-composer-overlay=""
      // One attribute for "the boundary is being dragged", which is how the
      // whole page keeps the drag's cursor and stops selecting text under the
      // pointer. Absent at rest, so the rules it turns on cost nothing the rest
      // of the time.
      data-resizing={resizing ? 'col' : undefined}
      style={PAGE}
    >
      <aside ref={side} className="dsh-cf-side" aria-label={t('side.root')}>
        <div className="dsh-cf-side-head">
          <div className="dsh-cf-side-title" title={workspaceName}>
            <span className="dsh-cf-side-name">{workspaceName}</span>
          </div>
          <button
            type="button"
            className="dsh-cf-icon-btn"
            aria-label={t('action.toggleHidden')}
            aria-pressed={showHidden}
            title={t('action.toggleHidden')}
            onClick={toggleHidden}
          >
            {showHidden ? <IconShow /> : <IconHide />}
          </button>
          <button
            type="button"
            className="dsh-cf-icon-btn"
            aria-label={t('action.refresh')}
            title={t('action.refresh')}
            onClick={refresh}
            disabled={directories['']?.loading === true}
          >
            <IconRefresh />
          </button>
        </div>

        <div className="dsh-cf-list">{drawLevel('')}</div>

        {/* The sidebar's own right edge, which is the boundary its width is
            measured to. */}
        <ResizeHandle
          onStart={startSideResize}
          onDrag={dragSideResize}
          onCommit={commitSideResize}
          onEnd={endResize}
        />
      </aside>

      <section className="dsh-cf-main">
        {selected === null ? (
          <div className="dsh-cf-empty">
            <div className="dsh-cf-empty-title">{t('preview.empty')}</div>
            <div className="dsh-cf-empty-hint">{t('preview.emptyHint')}</div>
          </div>
        ) : (
          <>
            <header className="dsh-cf-main-head">
              <span className="dsh-cf-file-name" title={selected}>
                {baseName(selected)}
              </span>
              <span className="dsh-cf-file-path" title={selected}>
                {selected}
              </span>
              {preview !== null ? (
                <span className="dsh-cf-row-size">
                  {t('preview.lines', { count: preview.lines })}
                  {preview.bytes === undefined ? '' : ` · ${formatSize(preview.bytes)}`}
                </span>
              ) : null}
            </header>

            {preview !== null && preview.eof === false ? (
              <div className="dsh-cf-truncated">{t('preview.truncated', { count: preview.lines })}</div>
            ) : null}

            {/* Keyed by the selected file so a new file starts at its first
                line and column: the two scrollers are reused otherwise, and
                the reader would land wherever the previous file was left. */}
            <div className="dsh-cf-body" key={selected}>
              {fileLoading ? (
                <div className="dsh-cf-note">{t('preview.loading')}</div>
              ) : fileError !== null ? (
                <div className="dsh-cf-error">{fileError}</div>
              ) : preview !== null ? (
                <CodePreview text={preview.text} path={selected} />
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

/**
 * The page text of a read answer, defaulting to nothing.
 *
 * @param text - the payload's text, when it carried one.
 * @returns the text to draw.
 */
function pendingText(text: string | undefined): string {
  return typeof text === 'string' ? text : ''
}
