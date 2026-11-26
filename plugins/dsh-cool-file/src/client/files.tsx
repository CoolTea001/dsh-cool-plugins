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
 * `api.ts`), and the local state is which folders are open, which children have
 * arrived, whether the entries the system hides are drawn, which file is
 * selected, whether the reader is previewing or editing, what drafts they hold,
 * and which request is in flight.
 *
 * Two of those facts — which folders are open and which file is on screen — are
 * the shape of a workspace's browsing rather than a statement about a file, so
 * they are saved per workspace root and drawn again on the next mount (see
 * `viewstate.ts`). The shell renders one View at a time, which means switching
 * tabs unmounts this page; without that memory a return to it would start from a
 * bare root however carefully the tree had been arranged. Only paths are saved:
 * every branch and the selected file are read again from the Host, so the tree
 * that comes back is the workspace as it is now, in the shape it was left in.
 * Unsaved drafts are not saved — an edit the reader has not written to disk
 * belongs to the page holding it.
 *
 * The page reads by default and writes only when asked. It lists entries,
 * expands them, and draws the selected file the way its kind is best read
 * (`shared/kinds.ts`): a picture as the picture itself, fetched by the browser
 * from the Host's raw route; a Markdown document as the rendered page, through
 * the shell's own renderer; anything else as its numbered, coloured source. The
 * editor — reached through the header's Preview/Editor switch — replaces one
 * file's complete text and nothing else, and is what shows a document's source
 * once Preview has started rendering it. It never creates, renames or deletes, and a
 * save quotes the freshness token of the read it started from, so a file that
 * moved on is refused instead of overwritten.
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
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'
import { IconChevronRight, IconFile, IconFolder } from '@dsh-cool/icons'
import { PanelScroll, ResizablePanel, Toast, useComposerSeatSuppression, writeClipboard } from '@dsh-cool/ui'
import {
  createEntry,
  deleteEntry,
  fetchFile,
  fetchListing,
  fetchText,
  renameEntry,
  revealEntry,
  saveFile,
} from './api.js'

import { CodePreview } from './code.js'
import { CodeEditor, EDIT_HIGHLIGHT_CHARS } from './editor.js'
import { ImageView } from './image.js'
import { SIDE_BOUNDS, SIDE_STORE } from './layout.js'
import type { Translate } from './locales.js'
import { MarkdownPreview } from './markdown.js'
import { FileMenu, TreeMenu, readMode, readWrap, writeMode, writeWrap, type FilesMode } from './mode.js'
import { rawImageUrl } from './raw.js'
import { RowDialog, type RowPrompt } from './row-dialog.js'
import { RowMenu, type RowCommand, type RowTarget } from './row-menu.js'
import { FILES_ROOT_CLASS } from './styles.js'
import { readViewState, readWorkspaceViewState, writeViewState } from './viewstate.js'
import { IMAGE_MAX_BYTES, fileKindOf, isPictureKind } from '../shared/kinds.js'
import type { DesktopFacts, FileEntry, ListPayload, MutationPayload, ReadPayload } from '../shared/contract.js'

/** The root is the whole conversation body, sized the way the shell hands it over. */
const PAGE: CSSProperties = {
  height: '100%',
  width: '100%',
}

/**
 * How strong the panels' scrollbar is.
 *
 * One value for both panes rather than two literals at the call sites: the tree
 * and the preview are read together, and a bar that is darker in one than the
 * other reads as a different kind of surface.
 *
 * A third strength, not half: at this alpha the thumb reads as a quiet cue that
 * the pane continues rather than a stripe competing with the rows beside it, and
 * it stays legible against the canvas on both light and dark appearances — below
 * roughly a quarter the thumb all but disappears into a white pane. It is still
 * the platform's own colour — only lighter — so it follows a theme that retints
 * its scrollbars, and `--dsh-ui-panel-bar-alpha` keeps its box, so the layout
 * does not move whether the bar is painted or not.
 *
 * Note what this alpha does to the hover state: the platform's
 * `::-webkit-scrollbar-thumb:hover` swaps in the hover colour token but keeps
 * this same alpha, so hovering gives a slightly stronger tint rather than a
 * solid one. That is the intended reading here — the bar stays quiet even under
 * the pointer — but it does mean the thumb is not meant to be hunted by eye
 * alone.
 */
const PANEL_BAR_OPACITY = 0.3

/** What one open preview holds. */
interface Preview {
  readonly text: string
  readonly lines: number
  readonly eof: boolean
  readonly bytes?: number
  /**
   * Whether a Markdown document is only the beginning of its file.
   *
   * Its own flag rather than `eof === false`: a partial document is not rendered
   * at all (see `markdown.tsx`), so the pane needs to know the difference between
   * "the whole file, one page" and "part of the file", which `eof` alone cannot
   * say once the fallback read is involved.
   */
  readonly partial?: boolean
}

/**
 * What the page knows about one file opened for editing.
 *
 * `text` is the complete file — not the preview's page — with its line endings
 * normalized to LF so a textarea can hold it, and `eol` remembers what the file
 * used so a save can put it back. `version` is the freshness token the read
 * returned: the save quotes it, and the Host refuses the write if the file moved
 * on since it was opened.
 */
interface EditorDoc {
  readonly loading: boolean
  /** The Host's message, or `''` when it gave none. Null means "no error". */
  readonly error: string | null
  readonly text: string
  readonly eol: '\n' | '\r\n'
  readonly bytes?: number
  readonly version?: string
}

/** A file whose editor is still being read. */
const PENDING_DOC: EditorDoc = {
  loading: true,
  error: null,
  text: '',
  eol: '\n',
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
 * The size the listing already reported for one workspace file.
 *
 * The tree holds it because it lists the children of every open branch, which is
 * why the pane can know a picture is over the raw route's cap before asking for
 * it — an `<img>` cannot report why a fetch failed, so the size check has to
 * happen on this side. Undefined when no listing has answered for the file's
 * directory (a file opened from the restored shape before its folder loaded).
 *
 * @param directories - every directory answer the page holds.
 * @param path - the file's workspace path, or null.
 * @returns the size in bytes, when one was reported.
 */
function directorySizeOf(
  directories: Readonly<Record<string, DirectoryState>>,
  path: string | null,
): number | undefined {
  if (path === null) return undefined
  const at = path.lastIndexOf('/')
  const parent = at === -1 ? '' : path.slice(0, at)
  const name = at === -1 ? path : path.slice(at + 1)
  const state = directories[parent]
  if (state === undefined || state.error !== null) return undefined
  return state.entries.find((entry) => entry.name === name)?.size
}

/**
 * The raw address of one workspace picture, with the refresh epoch folded in.
 *
 * Two mechanisms, one result. Remounting the pane (through the body's key) makes
 * React run the load again; changing the address makes the browser actually fetch
 * again, because an `<img>` caches by URL. The raw route ignores the extra
 * parameter, so the epoch is invisible to the Host and a refresh cannot be served
 * from a copy the reader has already seen.
 *
 * @param path - the file as a workspace path.
 * @param sessionId - the session whose workspace holds it, when known.
 * @param epoch - how many times Refresh has re-read this picture.
 * @returns the address the pane should point at.
 */
function imageUrl(path: string, sessionId: string | undefined, epoch: number): string {
  const url = rawImageUrl(path, sessionId)
  return epoch === 0 ? url : `${url}&rev=${epoch}`
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
 * The line ending a stored file uses.
 *
 * A file is CRLF when it contains CRLF and no bare LF; a mixed file is treated
 * as LF, which is what saving it will normalize it to.
 *
 * @param text - the file as stored.
 * @returns the ending a save should restore.
 */
function eolOf(text: string): '\n' | '\r\n' {
  if (!text.includes('\r\n')) return '\n'
  return text.replace(/\r\n/g, '').includes('\n') ? '\n' : '\r\n'
}

/**
 * The text as a textarea holds it: CRLF folded to LF.
 *
 * @param text - the file as stored.
 * @returns the text the draft is edited in.
 */
function toLf(text: string): string {
  return text.replace(/\r\n/g, '\n')
}

/**
 * The draft as the file must be stored, in the file's own line ending.
 *
 * @param text - the LF draft.
 * @param eol - the ending the file used.
 * @returns the content a save writes.
 */
function toEol(text: string, eol: '\n' | '\r\n'): string {
  return eol === '\n' ? text : text.replace(/\n/g, '\r\n')
}

/**
 * How many lines a text holds, by the read service's convention: a final newline
 * terminates the last line instead of starting an empty one.
 *
 * @param text - the text to count.
 * @returns the line count.
 */
function lineCount(text: string): number {
  if (text === '') return 0
  const trimmed = text.endsWith('\n') ? text.slice(0, -1) : text
  return trimmed.split('\n').length
}

/**
 * A saved file's text as the preview body shows it: the stored text without the
 * terminator after its last line, which is the form the paged read returns.
 *
 * @param text - the stored text.
 * @returns the preview text.
 */
function previewTextOf(text: string): string {
  return text.endsWith('\n') ? text.slice(0, -1) : text
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
 * One path after a rename: the entry, and everything below it, changes prefix.
 *
 * A rename moves a path in the workspace, and a folder's rename moves every
 * path underneath it too. One function for both cases — a path that is not the
 * entry and not below it comes back unchanged.
 *
 * @param path - the path to translate.
 * @param from - the entry's path before the rename.
 * @param to - the entry's path after it.
 * @returns the translated path.
 */
function renamePath(path: string, from: string, to: string): string {
  if (path === from) return to
  if (path.startsWith(`${from}/`)) return to + path.slice(from.length)
  return path
}

/**
 * One record's keys after a rename, or the same record when nothing moved.
 *
 * Returning the original reference for a record no path in which changed keeps
 * React from repainting the editor and every tree row for a rename that only
 * touched a sibling.
 *
 * @param previous - the record keyed by workspace path.
 * @param translate - the path translation to apply.
 * @returns the rewritten record, or the original when no key moved.
 */
function renameKeys<T>(
  previous: Readonly<Record<string, T>>,
  translate: (path: string) => string,
): Readonly<Record<string, T>> {
  const next: Record<string, T> = {}
  let changed = false
  for (const [path, value] of Object.entries(previous)) {
    const moved = translate(path)
    if (moved !== path) changed = true
    next[moved] = value
  }
  return changed ? next : previous
}

/**
 * The workspace path of the directory holding one path.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the parent's path, or the empty string (the root) for a top-level name.
 */
function parentOf(path: string): string {
  const at = path.lastIndexOf('/')
  return at === -1 ? '' : path.slice(0, at)
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

  /**
   * The browsing shape this session's workspace was left in, read once during
   * the first render so a return to this tab paints the tree the reader left
   * rather than a bare root that fills in a frame later. It is also the source
   * of the root an early snapshot is written under, before the Host has named
   * the directory.
   */
  const restored = useMemo(() => readViewState(sessionId), [sessionId])
  /** The workspace root the page is browsing; '' until the Host or the memory names one. */
  const [workspaceRoot, setWorkspaceRoot] = useState(() => restored?.root ?? '')
  /**
   * The session the tree on screen belongs to.
   *
   * A session switch is one render in which the id is already the new one while
   * `expanded` and `selected` still hold the old session's tree; the effect that
   * resets them runs after that render. The save effect below is held to this
   * instead, so the old tree is never attributed to the new session — which
   * would hand the next mount of that session the wrong workspace's shape.
   */
  const [shapeSession, setShapeSession] = useState<string | undefined>(sessionId)

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
  const [expanded, setExpanded] = useState<readonly string[]>(() => restored?.expanded ?? [])
  /** Whether entries whose names start with a dot are drawn. */
  const [showHidden, setShowHidden] = useState(readShowHidden)
  /** The selected file path, or null while the empty state is showing. */
  const [selected, setSelected] = useState<string | null>(() => restored?.selected ?? null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  // A restored file is already being read by the time the first frame is drawn,
  // so the pane says it is reading rather than showing an empty body for a beat.
  const [fileLoading, setFileLoading] = useState(() => restored?.selected != null)
  /** What the page does with the open file: preview it, or edit it. */
  const [mode, setMode] = useState<FilesMode>(readMode)
  /** Whether long source rows wrap in both the preview and the editor. */
  const [wrap, setWrap] = useState(readWrap)
  /**
   * The row the context menu is open on, or null while it is closed.
   *
   * Held here rather than inside each row: only one menu may be open at a time,
   * and the page owns the question of which row the commands would apply to.
   */
  const [rowTarget, setRowTarget] = useState<RowTarget | null>(null)
  /** The question a chosen row command opened, or null when none is open. */
  const [prompt, setPrompt] = useState<RowPrompt | null>(null)
  /** Whether the command behind the open dialog is still in flight. */
  const [promptBusy, setPromptBusy] = useState(false)
  /** The Host's failure for the open dialog, worded for the reader. */
  const [promptError, setPromptError] = useState<string | null>(null)
  /**
   * Whether the session's policy lets this page change the workspace.
   *
   * Read from every listing, because the answer is the Host's: a read-only
   * session lists its workspace through the very same route and refuses every
   * change. Optimistic until a listing answers, since the commands are also
   * fenced on the Host and a wrong guess costs a refused request rather than a
   * change nobody allowed.
   */
  const [writable, setWritable] = useState(true)
  /** What the Host's desktop can do with a workspace path; nothing until it says. */
  const [desktop, setDesktop] = useState<DesktopFacts>({ reveal: false })
  /** Whether the last copy action succeeded, for short trigger feedback. */
  const [copied, setCopied] = useState(false)
  /**
   * The short-lived banner a finished action leaves behind.
   *
   * It lives outside every menu and dialog because both of those close as soon
   * as a command is chosen: the answer arrives after the surface that asked the
   * question is gone, so the place to report it is the page itself.
   */
  const [notice, setNotice] = useState<{ readonly id: number; readonly text: string; readonly ok: boolean } | null>(null)
  /** Every file opened for editing, by workspace path. */
  const [docs, setDocs] = useState<Readonly<Record<string, EditorDoc>>>({})
  /** The unsaved drafts, by workspace path: a path present here is dirty. */
  const [drafts, setDrafts] = useState<Readonly<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  /**
   * Whether a write is actually in flight.
   *
   * A separate ref from {@link saving} on purpose: the state is what the retry
   * effect below watches for a committed set of answers, while this is the guard
   * a second ⌘S in the same render has to meet. Reading the state in the guard
   * would let two presses of one keystroke both pass — React has not committed
   * the first `setSaving(true)` yet — and two writes quoting the same freshness
   * token means the second one is refused as stale by the Host.
   */
  const savingRef = useRef(false)
  /** A save the reader asked for while one was already in flight. */
  const [pendingSave, setPendingSave] = useState(false)
  const [saveError, setSaveError] = useState<{ readonly text: string; readonly stale: boolean } | null>(null)
  /** Guards the preview against an answer for a file that is no longer selected. */
  const previewToken = useRef(0)
  /** Guards an editor read against an answer for a tree that is no longer shown. */
  const docGeneration = useRef(0)
  /** Directories with a request in flight, so a double click asks once. */
  const inFlight = useRef<Set<string>>(new Set())
  /**
   * Bumped whenever the whole tree is replaced. An answer carrying an older
   * generation belongs to a tree that is no longer on screen and is dropped.
   */
  const generation = useRef(0)
  /** Owns the short-lived banner, so two answers cannot leave two of them. */
  const noticeTimer = useRef<number | undefined>(undefined)
  /** Changes on every copy request, so an older answer cannot report for a new file. */
  const copyGeneration = useRef(0)
  /** Changes on every banner request, so an older one cannot name the newer one. */
  const noticeGeneration = useRef(0)
  /** Latest selected file/session, read only when an awaited copy completes. */
  const copyContext = useRef<{ path: string | null; sessionId: string | undefined }>({ path: selected, sessionId })
  copyContext.current = { path: selected, sessionId }
  useEffect(() => () => {
    if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current)
  }, [])
  useEffect(() => {
    copyGeneration.current += 1
    setCopied(false)
  }, [selected, sessionId])

  // Layout effect, not a passive one: the composer seat is already in the tree
  // when this View mounts, and a passive effect would paint one frame of an
  // input this page cannot use.
  useComposerSeatSuppression(page)

  /**
   * Ask the Host for one directory's children and file the answer under its path.
   *
   * The answer is merged into the map rather than replacing it: every open branch
   * keeps its own children, and a request for one folder never disturbs another.
   * A request already in flight for the same path is not repeated, and an answer
   * from before the tree was replaced is dropped.
   *
   * Two flows lean on the answers here. A branch that answered opens the restored
   * children inside it, which is what walks a saved shape down from the root: only
   * folders the workspace actually still holds are asked for, and a saved branch
   * that has since been deleted is never requested at all. A saved branch that
   * failed is folded away, because a shape restored against a changed workspace
   * must not leave an error standing where a folder used to be; a branch the
   * reader opened by hand keeps the error, since that click is exactly what they
   * need answered.
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
          // The two facts the row commands are drawn from. An older Host answers
          // neither, and its own route still fences every change, so the page
          // keeps offering the commands rather than disabling what may work.
          if (typeof payload.writable === 'boolean') setWritable(payload.writable)
          if (payload.desktop !== undefined) setDesktop(payload.desktop)
          // The absolute root is what this page's saved shape is keyed by, so a
          // first visit learns it here and can start remembering from now on. A
          // relative path whose root the memory did not name is that first visit:
          // the workspace's own shape — shared by every session in it — is
          // adopted here, before anything of the reader's is drawn. A root that
          // disagrees with the one the memory restored means the session moved,
          // so the shape read for the old directory is dropped rather than drawn
          // over the new one.
          const root = typeof payload.root === 'string' ? payload.root : ''
          /** The branches drawn open once this answer has been taken in. */
          let open: readonly string[] = expandedRef.current
          if (root !== '' && restoredRoot.current !== '' && root !== restoredRoot.current) {
            restoredRoot.current = ''
            restoredBranches.current.clear()
            open = []
            setExpanded([])
            setSelected(null)
            setPreview(null)
          } else if (path === '' && root !== '' && restoredRoot.current === '') {
            const saved = readWorkspaceViewState(root)
            if (saved !== null) {
              restoredRoot.current = root
              restoredBranches.current = new Set(saved.expanded)
              open = saved.expanded
              setExpanded(saved.expanded)
              if (saved.selected !== null) {
                setSelected(saved.selected)
                openFileRef.current(saved.selected, true)
              }
            }
          }
          if (root !== '') setWorkspaceRoot(root)
          const entries = payload.entries ?? []
          setDirectories((previous) => ({
            ...previous,
            [path]: {
              loading: false,
              error: null,
              entries,
              truncated: payload.truncated === true,
            },
          }))
          // A restored branch inside this one is opened by the same walk that
          // draws the tree, so the request order follows the shape rather than
          // one burst of paths the reader may not even have in view. Only a
          // branch with no answer yet is asked for: a Refresh asks for every open
          // path itself, and walking into those again would read them twice.
          const folders = new Set<string>()
          const known = directoriesRef.current
          for (const entry of entries) {
            if (entry.type !== 'directory') continue
            const child = childPath(path, entry.name)
            folders.add(child)
            if (known[child] === undefined && open.includes(child)) loadRef.current(child)
          }
          // An open branch this listing does not hold is a folder the workspace
          // no longer has: the parent has now answered, so its children are
          // known exactly, and keeping a dead path would leave the saved shape
          // carrying entries that can never be drawn again. A truncated answer
          // is not exact — the Host dropped children past its cap — so nothing
          // is pruned against one.
          if (payload.truncated !== true) {
            setExpanded((previous) => {
              const next = previous.filter((item) => parentOf(item) !== path || folders.has(item))
              return next.length === previous.length ? previous : next
            })
          }
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
        if (path === '') return
        // Only a branch the memory opened is folded here, and only once.
        if (!restoredBranches.current.delete(path)) return
        setExpanded((previous) => (previous.includes(path) ? previous.filter((item) => item !== path) : previous))
      })
    },
    [sessionId],
  )

  // The walk above calls back into itself through a ref: a `useCallback` cannot
  // name itself, and a dependency on the callback's own identity would recreate
  // it on every render — and every effect that loads through it with it.
  const loadRef = useRef(loadDirectory)
  loadRef.current = loadDirectory
  /** The open branches as the walk reads them, without recreating `loadDirectory`. */
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded
  /** The directory answers the walk reads, for the same reason. */
  const directoriesRef = useRef(directories)
  directoriesRef.current = directories
  /**
   * The editor's documents and drafts, read by the row commands.
   *
   * A rename has to answer "does the file I just moved hold unsaved text?"
   * before it can decide whether to read the file again, and reading that from
   * the state directly would put the whole document map in the callback's
   * dependencies — recreating it on every keystroke in the editor.
   */
  const docsRef = useRef(docs)
  docsRef.current = docs
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  /** The branches the memory restored, which a failed answer may still fold away. */
  const restoredBranches = useRef<Set<string>>(new Set())
  /** The workspace root the restored shape belongs to, or '' when none was drawn. */
  const restoredRoot = useRef(restored?.root ?? '')

  /**
   * Draw one paged read of a text file.
   *
   * The two reads below — the preview's page and the fallback page a large
   * Markdown document falls back to — answer in the same shape, so they finish in
   * the same place: the page's text, its line count, and whether it reaches the
   * end of the file.
   *
   * @param payload - the read answer.
   * @param eof - whether the page is the whole file, which the caller knows.
   */
  const applyPage = useCallback((payload: ReadPayload, eof: boolean, partial = false): void => {
    setPreview({
      text: pendingText(payload.text),
      lines: typeof payload.lines === 'number' ? payload.lines : 0,
      eof,
      ...(partial ? { partial: true } : {}),
      ...(typeof payload.bytes === 'number' ? { bytes: payload.bytes } : {}),
    })
  }, [])

  /**
   * Read one file for the preview pane and draw it.
   *
   * What "read" means depends on the file's kind (`shared/kinds.ts`). An image is
   * not read here at all: the pane points an `<img>` at the raw route and the
   * browser decodes it, so no text — and no failed text read on a binary file —
   * is ever involved. A Markdown document is read whole, through the editor's
   * text route, because a rendered document must not stop at the preview's page
   * cap; a document past that cap falls back to the paged read and is marked
   * partial, which the pane answers with the source view and a notice rather than
   * with half a page. Everything else keeps the paged read the source view was
   * built on.
   *
   * @param path - the file as a workspace path.
   * @param restoring - whether this read is the memory putting a file back, in
   *   which case a file that has since gone is dropped rather than drawn as a
   *   failure: nothing the reader did on this mount caused it, and an empty pane
   *   is the honest answer to "the file you were reading is not there".
   */
  const openFile = useCallback(
    (path: string, restoring = false): void => {
      const token = previewToken.current + 1
      previewToken.current = token
      setSelected(path)
      setPreview(null)
      setFileError(null)
      setLinkError(null)

      /** Report a read that did not produce a page. */
      const fail = (text: string): void => {
        setFileLoading(false)
        if (restoring) setSelected(null)
        else setFileError(text)
      }

      const kind = fileKindOf(path)
      // A binary picture is fetched by the `<img>` itself, so the pane is ready
      // as soon as it is drawn. SVG is not skipped: it is read like source even
      // while its preview shows the artwork, because the reader may switch to the
      // editor — or to the source view — without asking for the file again.
      if (kind === 'image') {
        setFileLoading(false)
        return
      }
      setFileLoading(true)

      const readPage = (partial: boolean): void => {
        void fetchFile(sessionId, path).then((page) => {
          if (previewToken.current !== token) return
          if (page.ok !== true) {
            fail(page.error ?? t('error.read'))
            return
          }
          setFileLoading(false)
          applyPage(page, page.eof !== false, partial)
        })
      }

      if (kind !== 'markdown') {
        readPage(false)
        return
      }

      void fetchText(sessionId, path).then((payload) => {
        if (previewToken.current !== token) return
        if (payload.ok === true) {
          const raw = typeof payload.text === 'string' ? payload.text : ''
          setFileLoading(false)
          setPreview({
            text: previewTextOf(raw),
            lines: lineCount(raw),
            eof: true,
            ...(typeof payload.bytes === 'number' ? { bytes: payload.bytes } : {}),
          })
          return
        }
        // A document too large to read whole is still worth showing as far as
        // the paged read reaches, but as source: the pane cannot render half a
        // page without lying about it, and the notice above the source says what
        // the reader is looking at.
        if (payload.reason === 'too-large') {
          readPage(true)
          return
        }
        // The preview words its own failures: the editor's copy says "can only be
        // previewed", which is exactly what the reader is already doing.
        fail(
          payload.reason === 'not-text'
            ? t('preview.notText')
            : payload.reason === 'missing'
              ? t('preview.missing')
              : (payload.error ?? t('error.read')),
        )
      })
    },
    [applyPage, sessionId, t],
  )

  /** The opening read of a restored file, for the reset effect below. */
  const openFileRef = useRef(openFile)
  openFileRef.current = openFile

  /**
   * The line a Markdown link asked the open file to reveal, if any.
   *
   * Reset by every plain open from the tree — a click there means "this file", not
   * "this line" — and consumed by the body once it has scrolled, so re-rendering
   * the pane later does not jump the reader back.
   */
  const [revealLine, setRevealLine] = useState<number | undefined>(undefined)
  /**
   * A link the page could not follow, worded for the reader.
   *
   * Cleared by any open: the notice belongs to the click that produced it, not to
   * the document behind it.
   */
  const [linkError, setLinkError] = useState<string | null>(null)

  // `toggleDirectory` is declared below, after the effects that reset the tree;
  // a ref keeps this callback off that ordering without making it depend on a
  // function identity that changes with every listing.
  const toggleDirectoryRef = useRef<(path: string) => void>(() => {})

  /**
   * Open one workspace target a document linked to, optionally at a line.
   *
   * A link is authored by whoever wrote the document, so it can name anything:
   * a sibling file, a picture, a folder, or something the workspace does not
   * hold. Those are three different answers and the renderer cannot tell them
   * apart for this page — it only knows a local-looking destination. The cache of
   * directory answers is what makes the difference visible here: a target listed
   * as a folder is opened as one, and a target a listed folder does not hold is
   * reported in the page's own words instead of the Host's English.
   *
   * @param path - the target as a workspace path.
   * @param line - the 1-based line the link named.
   */
  const openDocumentAt = useCallback(
    (path: string, line?: number): void => {
      const at = path.lastIndexOf('/')
      const parent = at === -1 ? '' : path.slice(0, at)
      const name = at === -1 ? path : path.slice(at + 1)
      const listing = directories[parent]

      // A folder link opens that branch rather than asking the Host for a text
      // read it can only refuse.
      if (listing !== undefined && listing.error === null) {
        const entry = listing.entries.find((item) => item.name === name)
        if (entry?.type === 'directory') {
          if (!expanded.includes(path)) toggleDirectoryRef.current(path)
          return
        }
        // A file the listing says is not there: the document is out of date with
        // the workspace. The page says so in a line above the body and leaves the
        // document open — the link is not the file the reader is reading, and
        // replacing a rendered document with an error over it would lose their
        // place for a dead link.
        if (entry === undefined) {
          setLinkError(t('preview.missing'))
          return
        }
      }

      openFile(path)
      // A line is only meaningful where the pane draws numbered rows. A rendered
      // document has no lines to reveal — its source view does — so the anchor is
      // dropped there rather than promised and never honoured. `#L24` is written
      // to point at code, which is the kind that keeps it; SVG is source too, and
      // the editor it can open is the pane that numbers those rows.
      const revealKind = fileKindOf(path)
      setRevealLine(revealKind === 'text' || revealKind === 'svg' ? line : undefined)
    },
    [directories, expanded, openFile, t],
  )

  // One tree per session: switching sessions drops every cached directory, every
  // open branch and the file being previewed, then reads the new root and draws
  // the shape that workspace was left in — or a bare root when it has none. The
  // generation bump is what keeps an answer for the old session out of the new
  // tree.
  //
  // The two reads go through refs rather than through the callbacks' identities:
  // both are recreated when the language changes (their copy comes through `t`),
  // and a reset keyed on that would throw away a tree nobody asked to reload.
  useEffect(() => {
    generation.current += 1
    docGeneration.current += 1
    inFlight.current.clear()
    previewToken.current += 1
    setWorkspaceName('')
    setWritable(true)
    setDesktop({ reveal: false })
    setRowTarget(null)
    setPrompt(null)
    setPromptBusy(false)
    setPromptError(null)
    setDirectories({})
    setWorkspaceRoot(restored?.root ?? '')
    // The root this mount's shape belongs to, and the branches it restored:
    // both are what tells a later answer whether it may prune or must adopt.
    restoredRoot.current = restored?.root ?? ''
    restoredBranches.current = new Set(restored?.expanded ?? [])
    setShapeSession(sessionId)
    setExpanded(restored?.expanded ?? [])
    setSelected(restored?.selected ?? null)
    setPreview(null)
    setFileError(null)
    setFileLoading(restored?.selected != null)
    setDocs({})
    setDrafts({})
    setSaving(false)
    setSaveError(null)
    setRevealLine(undefined)
    loadRef.current('')
    // The file is read again rather than remembered: only its path was saved, so
    // what comes back is the file as it is now.
    if (restored?.selected != null) openFileRef.current(restored.selected, true)
  }, [restored, sessionId])

  // Save the shape of the browsing whenever it changes, so what the next mount
  // draws is what this one was left showing. Nothing is written before the
  // workspace root is known — a shape stored under a guessed key would hand
  // another workspace this one's tree — and nothing is written while the states
  // still hold a previous session's tree, which is the render before the reset
  // effect above runs.
  useEffect(() => {
    if (workspaceRoot === '' || shapeSession !== sessionId) return
    writeViewState(sessionId, workspaceRoot, { expanded, selected })
  }, [expanded, selected, sessionId, shapeSession, workspaceRoot])

  /**
   * Read one file whole, for the editor.
   *
   * A separate read from the preview's: the editor must see every line and the
   * file's own line endings, not the first page of a normalized one. The answer
   * carries the freshness token the save will quote, and an answer for a tree
   * that has since been replaced is dropped.
   *
   * @param path - the file as a workspace path.
   */
  const loadDocument = useCallback(
    (path: string): void => {
      const token = docGeneration.current
      setDocs((previous) => ({
        ...previous,
        [path]: { ...(previous[path] ?? PENDING_DOC), loading: true, error: null },
      }))
      void fetchText(sessionId, path).then((payload) => {
        if (token !== docGeneration.current) return
        setDocs((previous) => {
          if (payload.ok !== true) {
            const error =
              payload.reason === 'too-large'
                ? t('editor.tooLarge')
                : payload.reason === 'not-text'
                  ? t('editor.notText')
                  : payload.reason === 'missing'
                    ? t('editor.missing')
                    : (typeof payload.error === 'string' ? payload.error : t('editor.error'))
            return {
              ...previous,
              [path]: { loading: false, error, text: '', eol: '\n' },
            }
          }
          const raw = typeof payload.text === 'string' ? payload.text : ''
          return {
            ...previous,
            [path]: {
              loading: false,
              error: null,
              text: toLf(raw),
              eol: eolOf(raw),
              ...(typeof payload.bytes === 'number' ? { bytes: payload.bytes } : {}),
              ...(typeof payload.version === 'string' ? { version: payload.version } : {}),
            },
          }
        })
      })
    },
    [sessionId, t],
  )

  /**
   * Record the editor's text as the selected file's draft.
   *
   * A draft equal to the file as it was read is not a change, so it is dropped
   * rather than kept as a dirty file the reader would have to save to clear.
   *
   * @param value - the textarea's complete value.
   */
  const editDocument = useCallback(
    (value: string): void => {
      if (selected === null) return
      const doc = docs[selected]
      if (doc === undefined) return
      setSaveError(null)
      setDrafts((previous) => {
        if (value === doc.text) {
          if (previous[selected] === undefined) return previous
          const next = { ...previous }
          delete next[selected]
          return next
        }
        return { ...previous, [selected]: value }
      })
    },
    [docs, selected],
  )

  /**
   * Write the selected file's draft back to disk.
   *
   * The text goes out in the file's own line ending, under the token the read
   * returned: a file the agent (or another editor) changed in between is refused
   * as stale instead of being silently overwritten. The confirmation is put back
   * into the preview too, so the two modes cannot disagree about what is on disk.
   *
   * Two things about timing are deliberate.
   *
   * A second request from the same page never runs beside the first. The Host
   * takes one write at a time per file and refuses the loser as stale — its
   * guard compares the freshness token, and the first write changes it — so two
   * presses of ⌘S would report "changed on disk" about a change this page made
   * itself. The in-flight flag is a ref rather than the `saving` state because
   * two presses of one keystroke are handled before React commits the first
   * `setSaving(true)`; a state read would let both through.
   *
   * A save must also not throw away what the reader typed while it was in
   * flight. The answer confirms the text that was sent, not the draft on screen,
   * so the draft is only cleared when it still equals what went out; otherwise it
   * stays dirty and is written by the queued save this press asked for.
   */
  const saveRef = useRef<() => void>(() => {})
  const save = useCallback((): void => {
    if (selected === null) return
    // A write is already running: remember the request and let its completion
    // run it against the answers that write returns.
    if (savingRef.current) {
      setPendingSave(true)
      return
    }
    const path = selected
    const doc = docs[path]
    const draft = drafts[path]
    if (doc === undefined || doc.loading || doc.error !== null || draft === undefined) return

    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    // The draft this request is responsible for. Anything typed after it is not
    // in the text below and must survive the answer.
    const sent = draft
    void saveFile(sessionId, path, toEol(sent, doc.eol), doc.version).then((payload) => {
      savingRef.current = false
      setSaving(false)
      if (payload.ok !== true) {
        setSaveError({
          text: payload.reason === 'stale' ? t('editor.stale') : (payload.error ?? t('editor.saveFailed')),
          stale: payload.reason === 'stale',
        })
        // A refused write wrote nothing, so a queued request has no new token to
        // quote: asking again would be refused the same way. The reader decides.
        setPendingSave(false)
        return
      }
      const bytes = typeof payload.bytes === 'number' ? payload.bytes : undefined
      const lines = typeof payload.lines === 'number' ? payload.lines : lineCount(sent)
      setDocs((previous) => {
        const current = previous[path]
        if (current === undefined) return previous
        return {
          ...previous,
          [path]: {
            ...current,
            // The file on disk is the text that was sent; the reader's newer
            // keystrokes, if any, live in the draft rather than here.
            text: sent,
            ...(bytes === undefined ? {} : { bytes }),
            ...(typeof payload.version === 'string' ? { version: payload.version } : {}),
          },
        }
      })
      // Clear the draft only when it is still what was written. A draft that
      // moved on keeps its text — and its unsaved marker — so the queued save
      // picks it up instead of the page silently dropping it.
      setDrafts((previous) => {
        if (previous[path] !== sent) return previous
        const next = { ...previous }
        delete next[path]
        return next
      })
      // The preview read the file before this save; a whole-file preview is
      // brought forward, while a truncated one keeps its page rather than
      // drawing the entire file into the tokenizer.
      setPreview((current) =>
        current === null || current.eof === false
          ? current
          : {
              text: previewTextOf(toEol(sent, doc.eol)),
              lines,
              eof: true,
              ...(bytes === undefined ? {} : { bytes }),
            },
      )
    })
  }, [docs, drafts, selected, sessionId, t])
  saveRef.current = save

  // Run a save the reader asked for while one was in flight. Declared after the
  // answers above have been committed, so the queued write quotes the token and
  // the draft this write just settled rather than the ones it started from.
  useEffect(() => {
    if (!pendingSave || savingRef.current) return
    setPendingSave(false)
    saveRef.current()
  }, [pendingSave, saving, docs, drafts, selected])

  /**
   * Throw the draft away and read the file as it is on disk again.
   *
   * Offered after a stale save, where the draft is based on a version that no
   * longer exists: keeping the two apart without a merge tool is the honest
   * choice, so the reader is told the draft is going and may decline by not
   * pressing the button.
   */
  const reloadDocument = useCallback((): void => {
    if (selected === null) return
    const path = selected
    setSaveError(null)
    setDrafts((previous) => {
      if (previous[path] === undefined) return previous
      const next = { ...previous }
      delete next[path]
      return next
    })
    loadDocument(path)
  }, [loadDocument, selected])

  /** Switch between previewing and editing, and remember the choice. */
  const changeMode = useCallback((next: FilesMode): void => {
    setMode(next)
    writeMode(next)
  }, [])

  /** Switch between wrapped and horizontally scrolling source rows. */
  const changeWrap = useCallback((next: boolean): void => {
    setWrap(next)
    writeWrap(next)
  }, [])

  /** Copy the complete file, including an unsaved draft when one is on screen. */
  const copyFile = useCallback((): void => {
    // A binary picture has no text to put on the clipboard; SVG does, and is
    // copied as the source an editor would have shown.
    if (selected === null || fileKindOf(selected) === 'image') return
    const path = selected
    const session = sessionId
    const generation = copyGeneration.current + 1
    copyGeneration.current = generation
    setCopied(false)
    setNotice(null)
    if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current)
    const doc = docs[path]
    const draft = drafts[path]
    const available = mode === 'editor'
      ? doc !== undefined && !doc.loading && doc.error === null ? draft ?? doc.text : undefined
      : preview !== null && preview.eof ? preview.text : undefined
    const current = (): boolean => generation === copyGeneration.current
      && copyContext.current.path === path && copyContext.current.sessionId === session
    const say = (text: string, ok: boolean): void => {
      if (!current()) return
      setCopied(ok)
      // One id space for every banner on the page, so the copy answer and a row
      // command's answer cannot name each other's notice.
      const id = noticeGeneration.current + 1
      noticeGeneration.current = id
      setNotice({ id, text, ok })
      if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current)
      noticeTimer.current = window.setTimeout(() => {
        if (copyGeneration.current === generation) setCopied(false)
      }, 3000)
    }
    void (async (): Promise<void> => {
      let text = available
      if (text === undefined) {
        const answer = await fetchText(session, path, 'copy')
        if (!answer.ok || answer.text === undefined) {
          say(answer.error ?? t('error.read'), false)
          return
        }
        text = answer.text
      }
      if (!current()) return
      const success = await writeClipboard(text)
      say(success ? t('action.copied') : t('action.copyFailed'), success)
    })()
  }, [docs, drafts, mode, preview, selected, sessionId, t])

  // A file opened in editor mode needs its whole text; reading it here rather
  // than in the switch keeps the choice instant and the read off the click path.
  // A binary picture has no text to read for an editor, and the pane never offers
  // the switch for one — this guard is what keeps a stale editor mode (left over
  // from the last text file) from asking for a binary file's "text". SVG is the
  // exception: its source is text, so it is read like any other source file.
  useEffect(() => {
    if (mode !== 'editor' || selected === null) return
    if (fileKindOf(selected) === 'image') return
    if (docs[selected] !== undefined) return
    loadDocument(selected)
  }, [docs, loadDocument, mode, selected])

  // A new file is a new subject: a failure reported for the last one does not
  // apply to it.
  useEffect(() => {
    setSaveError(null)
  }, [selected])

  /**
   * Open one branch, or close it again.
   *
   * A folder's children are asked for the first time it opens, and asked again
   * when the last answer was an error — closing and reopening is the reader's
   * retry for one branch, without reloading the tree around it.
   *
   * Closing a folder closes everything under it as well: a descendant is only
   * drawable while its parent is open, so keeping one open would leave the saved
   * shape holding branches the tree cannot show until the reader reopens the
   * parent — and then they would spring back open, which is not what closing
   * means.
   */
  const toggleDirectory = useCallback(
    (path: string): void => {
      // The reader is now arranging this branch themselves, so an answer that
      // fails is theirs to see and retry rather than one the memory folds away.
      restoredBranches.current.delete(path)
      if (expanded.includes(path)) {
        const prefix = `${path}/`
        for (const item of expanded) if (item.startsWith(prefix)) restoredBranches.current.delete(item)
        setExpanded(expanded.filter((item) => item !== path && !item.startsWith(prefix)))
        return
      }
      setExpanded([...expanded, path])
      const state = directories[path]
      if (state === undefined || state.error !== null) loadDirectory(path)
    },
    [directories, expanded, loadDirectory],
  )
  // The link opener reads the current toggle through this: it declares earlier,
  // and a stale closure here would open a branch the page has since folded.
  toggleDirectoryRef.current = toggleDirectory

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
   * Bumped whenever Refresh re-reads a selected picture.
   *
   * An `<img>` caches by address, and an image preview reads nothing through this
   * page — the browser fetches the picture itself — so a refresh that left the
   * address alone would show the frame it already had. The body's key carries
   * this number, which remounts the image pane and therefore fetches again.
   */
  const [imageEpoch, setImageEpoch] = useState(0)

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
    if (selected !== null) {
      openFile(selected)
      // A picture is not read through this page (the `<img>` fetches it), so the
      // epoch is what makes Refresh mean something for one. SVG is a picture too:
      // even in editor mode the address it bumps keeps the preview's cache fresh.
      if (isPictureKind(fileKindOf(selected))) setImageEpoch((count) => count + 1)
      // An open editor follows the disk too — unless it holds a draft, which a
      // refresh must not throw away.
      if (docs[selected] !== undefined && drafts[selected] === undefined) loadDocument(selected)
    }
  }, [directories, docs, drafts, expanded, loadDirectory, loadDocument, openFile, selected])

  /**
   * Re-read the directories one change touched, keeping the tree's shape.
   *
   * A rename, a creation and a deletion change the rows of one directory and,
   * when the entry was an open folder, of every open branch below it. Asking the
   * Host for the whole tree would replace branches nobody touched and lose the
   * reader's place, so the reload is bounded to the parent and to the branches
   * the caller says still exist under it.
   *
   * The two lists are taken together on purpose. Everything dropped from the
   * cache is asked for again — a branch dropped but not requested would draw
   * "Loading…" for good — and everything asked for is dropped first, so the
   * answer drawn is the Host's new one rather than the one already held.
   *
   * @param parent - the directory whose children changed.
   * @param branches - the open branches below it, named by their post-change
   *   paths, which the caller has already rewritten.
   */
  const reloadParent = useCallback(
    (parent: string, branches: readonly string[] = expandedRef.current): void => {
      const prefix = parent === '' ? '' : `${parent}/`
      const below = branches.filter((path) => path !== parent && path.startsWith(prefix))
      // A request already in flight for one of these paths would make the
      // reload a no-op, and its answer is the stale one; dropping the guard is
      // what lets the new read through. Any late answer from the old request is
      // harmless: it lands under the same key and is replaced by this one.
      for (const path of [parent, ...below]) inFlight.current.delete(path)
      setDirectories((previous) => {
        let next: Record<string, DirectoryState> | undefined
        for (const path of [parent, ...below]) {
          if (previous[path] === undefined) continue
          next ??= { ...previous }
          delete next[path]
        }
        return next ?? previous
      })
      loadRef.current(parent)
      for (const path of below) loadRef.current(path)
    },
    [],
  )

  /**
   * Report one refused row command in the page's own banner.
   *
   * Only refusals reach this banner. A command that worked is visible as the
   * change it made — a row under a new name, a new row, a row gone from the
   * tree — so a banner repeating it would be a second, quieter statement of
   * something the page already shows.
   *
   * @param text - the sentence to show.
   * @param ok - whether the command succeeded; always false today, kept so the
   *   banner can still carry a success if a command ever needs one.
   */
  const report = useCallback((text: string, ok: boolean): void => {
    const id = noticeGeneration.current + 1
    noticeGeneration.current = id
    setNotice({ id, text, ok })
    if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current)
    // The shell's toast holds for three seconds and then fades for one; the
    // banner is removed after the fade, not during it, or the exit animation is
    // cut in half every time.
    noticeTimer.current = window.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current))
    }, 4000)
  }, [])

  /**
   * Word one failed row command.
   *
   * A cause the Host names is worded here, because its own sentence is written
   * for a developer; anything else — a permission denial, an I/O fault — is
   * drawn verbatim, since the Host's diagnosis is more specific than anything
   * this page could substitute for it.
   *
   * @param payload - the failed answer.
   * @param fallback - the sentence to use when the answer carried no text.
   * @returns the words to draw.
   */
  const failureText = useCallback(
    (payload: { readonly reason?: string; readonly error?: string }, fallback: string): string => {
      if (payload.reason === 'exists') return t('menu.exists')
      if (payload.reason === 'invalid') return t('menu.invalid')
      if (payload.reason === 'missing') return t('menu.gone')
      if (payload.reason === 'read-only') return t('menu.readOnly')
      if (payload.reason === 'unavailable') return t('menu.revealUnavailable')
      if (payload.reason === 'unsupported') return t('menu.unsupported')
      if (typeof payload.error === 'string' && payload.error !== '') return payload.error
      return fallback
    },
    [t],
  )

  /** Close the open question, discarding what it asked. */
  const dismissPrompt = useCallback((): void => {
    setPrompt(null)
    setPromptError(null)
    setPromptBusy(false)
  }, [])

  /**
   * Ask what one chosen row command needs, or run it when it needs nothing.
   *
   * Rename and the two creations ask for a name first; delete asks for a
   * confirmation; reveal asks for nothing and is simply performed. Every
   * command is routed through the row the menu captured, never through the
   * selection, so a menu opened on one row cannot act on another.
   *
   * @param command - the row command chosen from the menu.
   * @param target - the row the menu was opened on.
   */
  const runCommand = useCallback(
    (command: RowCommand, target: RowTarget): void => {
      /**
       * Open a question one turn after the menu closes.
       *
       * The menu hands the keyboard back to the row it was opened on in a
       * microtask, and the dialog records the control it must return focus to
       * in a layout effect. Opening both in one commit therefore makes the
       * dialog record the page body — the row has not received focus yet — and
       * closing the dialog would strand the keyboard there. One macrotask later
       * the row holds focus, and the dialog captures it faithfully.
       *
       * @param next - the question to open.
       */
      const ask = (next: RowPrompt): void => {
        setPromptError(null)
        window.setTimeout(() => setPrompt(next), 0)
      }
      if (command === 'rename') {
        const at = target.path.lastIndexOf('/')
        ask({
          kind: 'rename',
          path: target.path,
          initial: at === -1 ? target.path : target.path.slice(at + 1),
        })
        return
      }
      if (command === 'create-file' || command === 'create-folder') {
        ask({ kind: command, path: target.path, initial: '' })
        return
      }
      if (command === 'delete') {
        const at = target.path.lastIndexOf('/')
        ask({
          kind: 'delete',
          path: target.path,
          name: at === -1 ? target.path : target.path.slice(at + 1),
          directory: target.type === 'directory',
        })
        return
      }
      // Reveal changes nothing on disk, so it has no question to ask and no
      // tree to reload. A success is also not reported: the file manager
      // opening *is* the answer, and a banner over the file the reader just
      // jumped to says nothing they cannot see. Only a refusal is worded — the
      // reader would otherwise be left with a closed menu and nothing else.
      void revealEntry(sessionId, target.path).then((payload) => {
        if (payload.ok) return
        report(failureText(payload, t('menu.revealFailed')), false)
      })
    },
    [failureText, report, sessionId, t],
  )

  /**
   * Submit a name for the open rename or creation question.
   *
   * The tree is reloaded from the parent directory afterwards, and a successful
   * file creation opens what it just made in the preview: a reader who asked for
   * a new empty file almost always means to put something in it, and the header's
   * Preview/Editor switch is one click away from the field that does that. A new
   * folder opens instead — the reader's next move is inside it, so it is drawn
   * expanded.
   *
   * The folder the entry was created in is opened as well. The menu can be
   * raised on a closed branch — a row is a row whether or not its children are
   * drawn — and a reload of a branch that stays closed would put the new entry
   * somewhere the reader cannot see. Opening the parent is what makes the
   * creation visible at the place it happened.
   *
   * @param name - the name the dialog's field holds.
   */
  const submitName = useCallback(
    (name: string): void => {
      if (prompt === null || prompt.kind === 'delete') return
      const parent = prompt.kind === 'rename' ? parentOf(prompt.path) : prompt.path
      setPromptBusy(true)
      setPromptError(null)
      const answer: Promise<MutationPayload> = prompt.kind === 'rename'
        ? renameEntry(sessionId, prompt.path, name)
        : createEntry(sessionId, prompt.path, name, prompt.kind === 'create-folder' ? 'directory' : 'file')
      void answer.then((payload) => {
        setPromptBusy(false)
        if (!payload.ok) {
          setPromptError(failureText(payload, t('menu.failed')))
          return
        }
        setPrompt(null)
        if (prompt.kind === 'rename') {
          // The entry moved, so everything that names it moves with it: the
          // selection, the open branches, the editor's document and draft. A
          // folder carries its whole subtree, which is why every path below it
          // is rewritten rather than only the one the menu was opened on.
          const from = prompt.path
          const next = typeof payload.path === 'string' && payload.path !== '' ? payload.path : from
          const moved = (path: string): string => renamePath(path, from, next)
          const branches = expandedRef.current.map(moved)
          expandedRef.current = branches
          setExpanded(branches)
          if (selected !== null) setSelected(moved(selected))
          // The cached answers are keyed by path too, so they move with the
          // entry: without this an open branch below a renamed folder would keep
          // its children under a path the tree can no longer name.
          const cached = renameKeys(directoriesRef.current, moved)
          directoriesRef.current = cached
          setDirectories(cached)
          // The editor's document is read under its old path, and a file's move
          // rewrites it: the freshness token the read returned no longer
          // describes what is on disk. A file with no unsaved draft is therefore
          // read again, which is also what keeps the next save from being
          // refused as stale; a draft is kept exactly as it was, because it is
          // the reader's text and not the file's.
          const movedDocs = renameKeys(docsRef.current, moved)
          const dirty = draftsRef.current[from] !== undefined
          if (movedDocs[next] !== undefined && !dirty) {
            const rest = { ...movedDocs }
            delete rest[next]
            setDocs(rest)
            loadDocument(next)
          } else {
            setDocs(movedDocs)
          }
          const movedDrafts = renameKeys(draftsRef.current, moved)
          draftsRef.current = movedDrafts
          setDrafts(movedDrafts)
          // No banner: the row is drawn under its new name, which is the
          // result. Only a refusal is worth words, and it stays in the dialog.
          reloadParent(parentOf(next), branches)
          return
        }
        // No banner here either: a created file opens in the preview and a
        // created folder is drawn open, so both already show what happened.
        const created = typeof payload.path === 'string' ? payload.path : undefined
        // The folder the entry was created in is opened whether or not the
        // reader had it open: the menu can be raised on a closed row, and an
        // entry added to a branch that stays closed is one nothing draws.
        const opened = prompt.kind === 'create-folder' && created !== undefined
          ? [parent, created]
          : [parent]
        const branches = [...expandedRef.current]
        // The root is drawn whatever the list says, so it is never recorded as
        // an open branch: an entry for it would travel into the saved shape and
        // name a row that has no disclosure to open.
        for (const path of opened) {
          if (path !== '' && !branches.includes(path)) branches.push(path)
        }
        if (branches.length !== expandedRef.current.length) {
          expandedRef.current = branches
          setExpanded(branches)
        }
        // The reload is given the branches that exist now, so the new folder is
        // asked for by the same walk that asks for its parent — a branch added
        // to the list but never requested would draw "Loading…" for good.
        reloadParent(parent, branches)
        if (prompt.kind === 'create-file' && created !== undefined) {
          setRevealLine(undefined)
          openFileRef.current(created)
        }
      })
    },
    [failureText, prompt, selected, sessionId, t],
  )

  /**
   * Confirm the open delete question.
   *
   * A deleted entry leaves the tree, so its selection, its branch and its cached
   * text go with it: an editor holding a document for a file that is no longer
   * on disk would only be able to fail the next save.
   */
  const confirmDelete = useCallback((): void => {
    if (prompt === null || prompt.kind !== 'delete') return
    const target = prompt.path
    setPromptBusy(true)
    setPromptError(null)
    void deleteEntry(sessionId, target).then((payload) => {
      setPromptBusy(false)
      if (!payload.ok) {
        setPromptError(failureText(payload, t('menu.failed')))
        return
      }
      setPrompt(null)
      const gone = (path: string): boolean => path === target || path.startsWith(`${target}/`)
      // The surviving branches are what the reload is given: the deleted ones
      // must not be asked for, or every one of them would answer "no such
      // directory" and draw an error under a folder that is simply gone.
      const surviving = expandedRef.current.filter((path) => !gone(path))
      expandedRef.current = surviving
      setExpanded(surviving)
      if (selected !== null && gone(selected)) {
        setSelected(null)
        setPreview(null)
        setFileError(null)
        setFileLoading(false)
      }
      setDirectories((previous) => {
        const next: Record<string, DirectoryState> = {}
        let changed = false
        for (const [path, state] of Object.entries(previous)) {
          if (gone(path)) changed = true
          else next[path] = state
        }
        return changed ? next : previous
      })
      const forgetDocs = <T,>(previous: Readonly<Record<string, T>>): Readonly<Record<string, T>> => {
        const next: Record<string, T> = {}
        let changed = false
        for (const [path, value] of Object.entries(previous)) {
          if (gone(path)) changed = true
          else next[path] = value
        }
        return changed ? next : previous
      }
      const remainingDocs = forgetDocs(docsRef.current)
      docsRef.current = remainingDocs
      setDocs(remainingDocs)
      const remainingDrafts = forgetDocs(draftsRef.current)
      draftsRef.current = remainingDrafts
      setDrafts(remainingDrafts)
      // No banner: the row leaving the tree is the result, and a creation
      // reported itself the same way. Only a refusal is worth words, and it
      // stays in the dialog that asked.
      reloadParent(parentOf(target), surviving)
    })
  }, [failureText, prompt, selected, sessionId, t])

  /**
   * Run one command the row menu handed back.
   *
   * The menu passes the target it captured, not the page's current one: an
   * answer that arrives after a re-render still applies to the row the reader
   * right-clicked, and the menu's own subject cannot drift under it.
   *
   * @param command - the chosen command.
   * @param target - the row the menu was opened on.
   */
  const onRowCommand = useCallback(
    (command: RowCommand, target: RowTarget): void => {
      runCommand(command, target)
    },
    [runCommand],
  )

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
    // An empty folder draws no rows and no notice: the open branch is the whole
    // answer, and a line under it would say "nothing" where nothing already
    // reads as nothing. A folder still being read keeps its note, because there
    // the alternative is a branch that looks empty before it is known to be.
    if (state.entries.length === 0) {
      return state.loading
        ? [
            <div className="dsh-cf-note" key={`${path}:pending`}>
              {t('side.loading')}
            </div>,
          ]
        : []
    }

    // Hidden is the Host's judgement, not this page's: the listing carries the
    // platform's own mark where it has one, and the eye decides whether those
    // children are drawn. A Host that predates the field answers with none, and
    // then the POSIX convention is what this page has to go on.
    const entries = showHidden
      ? state.entries
      : state.entries.filter((entry) => (entry.hidden ?? entry.name.startsWith('.')) !== true)
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
            data-ignored={entry.ignored === true ? '' : undefined}
            data-open={open ? '' : undefined}
            data-selected={!isDirectory && selected === target ? '' : undefined}
            data-menu={rowTarget?.path === target ? '' : undefined}
            title={entry.name}
            aria-expanded={isDirectory ? open : undefined}
            disabled={entry.type === 'other'}
            onClick={() => {
              if (isDirectory) {
                toggleDirectory(target)
                return
              }
              if (entry.type === 'file') {
                setRevealLine(undefined)
                openFile(target)
              }
            }}
            onContextMenu={(event) => {
              // The gesture is the menu's, not the browser's: the row owns the
              // command list, and the platform's own context menu would offer a
              // page-level set of items instead. The row is focused before the
              // menu opens because it is where the menu hands the keyboard back.
              event.preventDefault()
              event.stopPropagation()
              event.currentTarget.focus({ preventScroll: true })
              setRowTarget({
                path: target,
                type: entry.type,
                x: event.clientX,
                y: event.clientY,
                element: event.currentTarget,
              })
            }}
            onKeyDown={(event) => {
              // The keyboard's own context-menu gesture, on the platform's two
              // spellings: the dedicated key, and Shift+F10.
              const requested = event.key === 'ContextMenu'
                || (event.shiftKey && event.key === 'F10')
              if (!requested) return
              event.preventDefault()
              event.currentTarget.focus({ preventScroll: true })
              const rect = event.currentTarget.getBoundingClientRect()
              setRowTarget({
                path: target,
                type: entry.type,
                x: rect.left,
                y: rect.bottom,
                element: event.currentTarget,
              })
            }}
          >
            <span className="dsh-cf-twist" aria-hidden="true">
              {isDirectory ? <IconChevronRight /> : null}
            </span>
            <span className="dsh-cf-row-icon" aria-hidden="true">
              {isDirectory ? <IconFolder size={15} /> : <IconFile size={15} />}
            </span>
            <span className="dsh-cf-row-name">{entry.name}</span>
            {drafts[target] === undefined ? null : (
              <span className="dsh-cf-row-dot" title={t('editor.unsaved')} aria-hidden="true" />
            )}
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

  const doc = selected === null ? undefined : docs[selected]
  const draft = selected === null ? undefined : drafts[selected]
  // What the preview pane draws for the selected file. An image has no text to
  // edit, so the editor cannot apply to it: the pane shows the picture and the
  // header draws no switch at all.
  //
  // This is a fact about the file's kind, not about whether it can be read right
  // now. A text file whose document read failed — too large, not UTF-8, gone from
  // disk — keeps its switch: the reader may have arrived in editor mode by the
  // saved preference, a failed read is what the body's notice explains, and
  // hiding the control that got them there would leave no way back to the
  // preview.
  const kind = selected === null ? 'text' : fileKindOf(selected)
  // SVG is a picture whose source is text: it previews as artwork and edits as
  // code, so it is the one picture kind that keeps the editor.
  const editable = kind !== 'image'
  // The mode the pane is actually drawn in, which is the saved preference only
  // where it can be honoured. The header names this, not the preference, so the
  // selected segment never claims an editor it is not showing.
  const effectiveMode: FilesMode = editable ? mode : 'preview'
  const editing = effectiveMode === 'editor' && selected !== null && editable
  // Whether the pane draws the file as a picture rather than as source. SVG
  // answers yes in preview mode and no in editor mode, where its markup is shown.
  const picturing = isPictureKind(kind) && !(kind === 'svg' && effectiveMode === 'editor')
  // The text the editor would draw, once the file is open and readable; null
  // while it is still loading, or when it cannot be edited at all.
  const editorText = doc !== undefined && !doc.loading && doc.error === null ? draft ?? doc.text : null
  // The editor redraws its rows on every keystroke. Past the budget that redraw
  // would stall the field, so the rows go plain and the page says why, rather
  // than leaving the reader to wonder where the colours went.
  const plainEdit = editorText !== null && editorText.length > EDIT_HIGHLIGHT_CHARS

  // The header's line/size note follows the mode: the preview's page while
  // previewing, the whole document while editing, where the draft's own line
  // count is what the reader is looking at.
  //
  // A rendered document is a page, not a file of numbered rows, so it carries no
  // line count either: the size is the one fact about it that still means what it
  // says. A picture has neither — but its size is known from the listing it was
  // opened from, which is why it reports bytes alone.
  const entrySize = directorySizeOf(directories, selected)
  let meta: { readonly lines?: number; readonly bytes?: number } | null = null
  if (picturing) {
    // A file drawn as a picture reports size alone: its rows are not what the
    // reader is looking at. SVG in editor mode leaves this branch and counts
    // lines below like any other source file.
    meta = entrySize === undefined ? null : { bytes: entrySize }
  } else if (editing) {
    if (doc !== undefined && !doc.loading && doc.error === null) {
      meta = {
        lines: lineCount(draft ?? doc.text),
        ...(draft !== undefined || doc.bytes === undefined ? {} : { bytes: doc.bytes }),
      }
    }
  } else if (preview !== null) {
    const rendered = kind === 'markdown' && preview.partial !== true
    meta = {
      ...(rendered ? {} : { lines: preview.lines }),
      ...(preview.bytes === undefined ? {} : { bytes: preview.bytes }),
    }
    if (meta.bytes === undefined && meta.lines === undefined) meta = null
  }

  // A picture over the raw route's cap cannot be shown at all, so the pane is
  // told before it asks: the `<img>` could never report why it failed. SVG is
  // included whenever it is being shown as a picture, not while it is edited.
  const imageRefusal =
    picturing && entrySize !== undefined && entrySize > IMAGE_MAX_BYTES
      ? t('preview.imageTooLarge', { size: formatSize(IMAGE_MAX_BYTES) })
      : undefined

  return (
    <div
      ref={page}
      className={FILES_ROOT_CLASS}
      data-dsh-cool-file="view"
      // The shell's full-bleed opt-in, the hook the trajectory and terminal
      // views declare: the shell then drops the transcript width handles and
      // gives this View the whole conversation body.
      data-conversation-composer-overlay=""
      // No `data-resizing` here: the shared panel sets that attribute on this
      // very element for the length of a drag, so the page's cursor and its
      // selection lock follow the gesture without this View re-rendering.
      style={PAGE}
    >
      {notice === null ? null : (
        <Toast
          key={notice.id}
          text={notice.text}
          tone={notice.ok ? 'success' : undefined}
          onDone={() => {
            setNotice(current => current?.id === notice.id ? null : current)
          }}
        />
      )}
      {/* The row menu and its question live at the page root: the menu is
          portaled to the body and the dialog to its own layer, so neither is
          cropped by the tree's scrollport. */}
      <RowMenu
        target={rowTarget}
        writable={writable}
        reveal={desktop.reveal}
        fileManager={desktop.fileManager}
        onClose={() => setRowTarget(null)}
        onCommand={onRowCommand}
        t={t}
      />
      {prompt === null ? null : (
        <RowDialog
          key={`${prompt.kind}:${prompt.path}`}
          prompt={prompt}
          busy={promptBusy}
          error={promptError}
          onCancel={dismissPrompt}
          onSubmitName={submitName}
          onConfirmDelete={confirmDelete}
          t={t}
        />
      )}
      {/* The sidebar's own right edge is the boundary its width is dragged by;
          the shared panel draws it, measures the column, and records the width
          it is left at. Everything inside stays this page's own chrome. */}
      <ResizablePanel
        className="dsh-cf-side"
        aria-label={t('side.root')}
        root={page}
        property="--dsh-cf-side-width"
        bounds={SIDE_BOUNDS}
        store={SIDE_STORE}
      >
        {/* The header is the root's own row: right-clicking it offers the
            commands a row would, with the two that change the root's identity
            left out (see `RowTarget.root`). Without it a workspace whose root
            holds no folder would have nowhere to create one. */}
        <div
          className="dsh-cf-side-head"
          tabIndex={-1}
          onContextMenu={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const element = event.currentTarget
            // Not a tab stop of its own: the focus is what the menu hands back
            // to, and a header that joined the tab order would be one more stop
            // between the workspace and its tree.
            element.focus({ preventScroll: true })
            setRowTarget({
              path: '',
              type: 'directory',
              root: true,
              x: event.clientX,
              y: event.clientY,
              element,
            })
          }}
        >
          <div className="dsh-cf-side-title" title={workspaceName}>
            <span className="dsh-cf-side-name">{workspaceName}</span>
          </div>
          <TreeMenu
            showHidden={showHidden}
            refreshing={directories['']?.loading === true}
            onRefresh={refresh}
            onToggleHidden={toggleHidden}
            t={t}
          />
        </div>

        {/* The tree is a `PanelScroll` rather than a plain box: the bar belongs to
            the pointer, and it keeps its own width whether shown or hidden, so
            the rows do not shift as the pointer crosses the edge. Only `y` is
            allowed — a name is elided, never reached by scrolling sideways, so a
            horizontal bar here would advertise a gesture with nothing behind it.

            The alpha is the pane's own: a tree bar sits among rows it would
            otherwise cut, so it is held at `PANEL_BAR_OPACITY` in both preview
            and tree. */}
        <PanelScroll className="dsh-cf-list" direction="y" barOpacity={PANEL_BAR_OPACITY}>
          {drawLevel('')}
        </PanelScroll>

      </ResizablePanel>

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
              {meta === null ? null : (
                <span className="dsh-cf-file-meta">
                  {meta.lines === undefined ? null : t('preview.lines', { count: meta.lines })}
                  {meta.lines !== undefined && meta.bytes !== undefined ? ' · ' : null}
                  {meta.bytes === undefined ? null : formatSize(meta.bytes)}
                </span>
              )}
              <FileMenu
                mode={effectiveMode}
                onSelectMode={changeMode}
                editable={editable}
                wrap={wrap}
                onSelectWrap={changeWrap}
                canCopy={editable}
                canWrap={!picturing && (editing || kind !== 'markdown' || preview?.partial === true || fileError !== null)}
                copied={copied}
                onCopy={copyFile}
                t={t}
              />
            </header>

            {/* The source view's page notice. A rendered document is a page, so it
                reports its own partial read (see `markdown.tsx`) instead. */}
            {!editing && kind !== 'markdown' && preview !== null && preview.eof === false ? (
              <div className="dsh-cf-truncated">{t('preview.truncated', { count: preview.lines })}</div>
            ) : null}

            {plainEdit ? <div className="dsh-cf-truncated">{t('editor.plain')}</div> : null}

            {linkError === null ? null : (
              <div className="dsh-cf-truncated" role="alert">
                {linkError}
              </div>
            )}

            {saveError === null ? null : (
              <div className="dsh-cf-save-error" role="alert">
                <span className="dsh-cf-save-error-text">{saveError.text}</span>
                {saveError.stale ? (
                  <button type="button" className="dsh-cf-link" onClick={reloadDocument}>
                    {t('editor.reload')}
                  </button>
                ) : null}
              </div>
            )}

            {/* Keyed by the mode and the file: a new subject starts at its first
                line, rather than wherever the previous one left its scroller. An
                image also carries the refresh epoch, because the browser fetches
                a picture by address and would otherwise keep the cached one.

                The More menu switches how this one pane draws the file rather
                than selecting a tab panel, so the pane names itself. Without a
                name, a scroll region a keyboard reader lands in would only
                announce "region". */}
            <PanelScroll
              className="dsh-cf-body"
              key={`${mode}:${selected}:${imageEpoch}`}
              // The preview scrolls down; a long line is slid by the code block
              // inside it, not by the page. The editor is the exception: its own
              // field owns both axes and the artwork follows it, so the page must
              // not be a scroll container there at all — a second, empty bar
              // beside the field's would be one scroll gesture too many.
              direction={editing ? 'none' : 'y'}
              barOpacity={PANEL_BAR_OPACITY}
              data-editor={editing ? '' : undefined}
              role="region"
              aria-label={t('preview.pane')}
              // The preview holds nothing focusable, so the panel itself is the
              // tab stop that lets the arrow keys scroll it. The editor does not
              // get one: its field is already the stop, and a second one in front
              // of it would only be a step to walk past.
              tabIndex={editing ? undefined : 0}
            >
              {picturing ? (
                <ImageView
                  // The epoch rides in the address as well as the key: a remount
                  // alone trusts the raw route's `no-store` header, while a new
                  // address is a request the browser cannot answer from cache.
                  src={imageUrl(selected, sessionId, imageEpoch)}
                  alt={baseName(selected)}
                  refusal={imageRefusal}
                  t={t}
                />
              ) : editing ? (
                doc === undefined || doc.loading ? (
                  <div className="dsh-cf-note">{t('editor.loading')}</div>
                ) : doc.error !== null ? (
                  <div className="dsh-cf-error">{doc.error}</div>
                ) : (
                  <CodeEditor
                    text={draft ?? doc.text}
                    path={selected}
                    wrap={wrap}
                    onChange={editDocument}
                    onSave={save}
                    label={selected}
                  />
                )
              ) : fileLoading ? (
                <div className="dsh-cf-note">{t('preview.loading')}</div>
              ) : fileError !== null ? (
                <div className="dsh-cf-error">{fileError}</div>
              ) : preview === null ? null : kind === 'markdown' ? (
                <MarkdownPreview
                  text={preview.text}
                  path={selected}
                  wrap={wrap}
                  sessionId={sessionId}
                  partial={preview.partial === true}
                  onOpenFile={openDocumentAt}
                  t={t}
                />
              ) : (
                <CodePreview text={preview.text} path={selected} wrap={wrap} line={revealLine} />
              )}
            </PanelScroll>
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
