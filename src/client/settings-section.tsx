/**
 * The Sessions page of the Settings panel: list, search, filter, selection,
 * archive, and deletion.
 *
 * The list itself is not fetched here. DSH already keeps the Host-authoritative
 * Session catalog and Workspace archive set in the two client stores the shell
 * exposes to every slot (`useSessions` / `useWorkspaces`), and every archive is
 * a Workspace-controller call whose reply updates those stores. Reading them
 * directly means this page shares the sidebar's rows and running states instead
 * of maintaining a second, drifting catalog; deletion is the one operation the
 * client face does not expose, so it still crosses this package's own Host
 * route.
 *
 * Search is deliberately title-only: the row's title is the display title the
 * shell computes (durable title, then project directory name, then id), so the
 * text a reader can see in the row is exactly the text the box matches.
 */

import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import {
  Button, Input, Menu, Modal, type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { deleteSessions } from './api.js'
import { ARROW_DOWN_MARKUP } from './icons.js'
import { reasonOf } from './reason.js'
import type { ArchiveActivity, ArchiveResult } from './archive.js'
import type { MessageKey, Translate } from './locales.js'
import type { Failure } from '../shared/contract.js'

/** The selector-hook shape DSH hands every slot component. */
type SelectorHook = (selector: (state: any) => any) => any

/** The slice of a client Session summary this page reads. */
interface SessionSummaryLike {
  readonly id: string
  readonly title?: string
  readonly displayTitle?: string
  readonly cwd?: string
  readonly origin?: 'subagent'
  readonly running?: boolean
  readonly updatedAt?: number
}

/** The slice of the client Session list this page reads. */
interface SessionListStateLike {
  readonly ids?: readonly string[]
  readonly byId?: Readonly<Record<string, SessionSummaryLike | undefined>>
  readonly phase?: 'pending' | 'ready'
  readonly error?: unknown
}

/** The slice of one client Workspace row this page reads. */
interface WorkspaceViewLike {
  readonly workspaceId: string
  readonly title: string
  readonly sessionIds?: readonly string[]
}

/** The slice of the client Workspace snapshot this page reads. */
interface WorkspaceStateLike {
  readonly items?: readonly WorkspaceViewLike[]
  readonly archivedSessionIds?: readonly string[]
}

/** The section's injected share: the locale seat plus the Host-backed actions. */
export interface SessionsSectionProps {
  readonly t: Translate
  readonly useSessions: SelectorHook
  readonly useWorkspaces: SelectorHook
  /** Archive or restore one Session through the Workspace controller. */
  readonly setArchived?: (sessionId: string, archived: boolean, stopActivity: boolean) => Promise<ArchiveResult>
  /** Ask the Session catalog to refresh after a deletion. */
  readonly refresh?: () => void
  /** Clear the shell's main view when its Session disappeared. */
  readonly onDeleted?: (sessionId: string) => void
}

/** One row's flattened view of the two stores. */
interface SessionRow {
  readonly id: string
  readonly title: string
  readonly cwd?: string
  readonly workspaceId?: string
  readonly workspaceTitle?: string
  readonly archived: boolean
  readonly running: boolean
  readonly updatedAt: number
}

/** The archive-state filter in the toolbar. */
type ArchiveFilter = 'all' | 'unarchived' | 'archived'

/** One visible failure, kept structured so a language switch re-words it. */
interface Problem {
  readonly prefix?: { readonly key: MessageKey; readonly params?: Readonly<Record<string, string | number>> }
  readonly failure?: Failure
  readonly error?: string
  readonly fallback?: MessageKey
}

/** Flatten the two stores into the rows this page renders. */
function buildRows(state: SessionListStateLike, workspaces: WorkspaceStateLike): SessionRow[] {
  const archived = new Set(workspaces.archivedSessionIds ?? [])
  const workspaceBySession = new Map<string, { readonly id: string; readonly title: string }>()
  for (const workspace of workspaces.items ?? []) {
    for (const id of workspace.sessionIds ?? []) {
      if (!workspaceBySession.has(id)) {
        workspaceBySession.set(id, { id: workspace.workspaceId, title: workspace.title })
      }
    }
  }

  const rows: SessionRow[] = []
  for (const id of state.ids ?? []) {
    const summary = state.byId?.[id]
    if (summary === undefined) continue
    // Subagent Sessions are conversation internals; their parent's deletion
    // includes them, so the management surface lists only top-level rows.
    if (summary.origin === 'subagent') continue
    const workspace = workspaceBySession.get(id)
    const durable = typeof summary.title === 'string' && summary.title.trim() !== ''
      ? summary.title.trim()
      : undefined
    const display = typeof summary.displayTitle === 'string' && summary.displayTitle.trim() !== ''
      ? summary.displayTitle.trim()
      : undefined
    rows.push({
      id,
      title: durable ?? display ?? id,
      ...(summary.cwd === undefined ? {} : { cwd: summary.cwd }),
      ...(workspace === undefined ? {} : { workspaceId: workspace.id, workspaceTitle: workspace.title }),
      archived: archived.has(id),
      running: summary.running === true,
      updatedAt: typeof summary.updatedAt === 'number' && Number.isFinite(summary.updatedAt) ? summary.updatedAt : 0,
    })
  }
  rows.sort((left, right) => right.updatedAt - left.updatedAt || left.title.localeCompare(right.title))
  return rows
}

/** Read the document language the locale service keeps in sync. */
function localeTag(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const language = document.documentElement.lang
  return language === '' ? undefined : language
}

/** Format one epoch instant, or an em dash when the row carries none. */
function formatDay(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  try {
    return new Intl.DateTimeFormat(localeTag(), { year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
  } catch {
    return '—'
  }
}

/** Format the same instant with its time, for the row's hover text. */
function formatFull(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return ''
  try {
    return new Intl.DateTimeFormat(localeTag(), { dateStyle: 'medium', timeStyle: 'short' }).format(ms)
  } catch {
    return ''
  }
}

/** Word one failure, keeping the retryable summary ahead of its detail. */
function problemText(t: Translate, problem: Problem): string {
  const parts: string[] = []
  if (problem.prefix !== undefined) parts.push(t(problem.prefix.key, problem.prefix.params))
  if (problem.failure !== undefined) {
    parts.push(t(`error.${problem.failure.code}` as MessageKey, problem.failure.params))
  } else if (typeof problem.error === 'string' && problem.error !== '') {
    parts.push(problem.error === 'HTTP 405' ? t('error.host-stale') : problem.error)
  } else if (problem.prefix === undefined) {
    parts.push(t(problem.fallback ?? 'sessions.actionFailed'))
  }
  return parts.join(' ')
}

/** Word a request-level failure, translating the one code the page knows. */
function rawReason(t: Translate, error: string | undefined, fallback: MessageKey): string {
  if (error === 'HTTP 405') return t('error.host-stale')
  return typeof error === 'string' && error !== '' ? error : t(fallback)
}

/** One activity family, as the stop-and-archive dialog names it. */
function activityLine(t: Translate, activity: ArchiveActivity): string {
  switch (activity.kind) {
    case 'turn': return t('sessions.activityTurn')
    case 'subagent': return t('sessions.activitySubagents', { count: activity.count })
    case 'job': return t('sessions.activityJobs', { count: activity.count })
    case 'schedule': return t('sessions.activitySchedules', { count: activity.count })
    default: return t('sessions.activityOther', { count: activity.count, kind: activity.kind })
  }
}

/** The props one toolbar dropdown needs. */
interface FilterMenuProps {
  /** The option label shown on the closed trigger. */
  readonly label: string
  /** The selectable rows, with the current one marked by the product's check. */
  readonly items: readonly MenuEntry[]
  /** The id of the option currently applied. */
  readonly selectedId: string
  /** Called with a row's id; the menu closes itself first. */
  readonly onSelect: (id: string) => void
  /** The trigger's extra class, so each filter keeps its own width rules. */
  readonly className?: string
  /** Which edge of the trigger the card lines up with. */
  readonly align?: 'start' | 'end'
  /** An optional width class for the portalled card. */
  readonly listClassName?: string
}

/**
 * One toolbar filter: the product's Menu anchored to a control shaped like the
 * search box, so both filters share its 32px height and its border.
 *
 * The list portals to the document body: the options column is a scroll
 * container, and an in-place card would be clipped at its edge (or add a
 * horizontal scrollbar) instead of floating over the panel.
 *
 * @param props - the current option, the rows to offer, and the change callback.
 * @returns the trigger and its dropdown.
 */
function FilterMenu({
  label, items, selectedId, onSelect, className, align = 'start', listClassName,
}: FilterMenuProps): ReactElement {
  const [open, setOpen] = useState(false)
  return (
    <Menu
      open={open}
      portal
      align={align}
      items={items}
      selectedId={selectedId}
      listClassName={listClassName}
      className="dsh-cs-filter-wrap"
      onSelect={(id) => {
        setOpen(false)
        onSelect(id)
      }}
      onClose={() => { setOpen(false) }}
      anchor={(
        <button
          type="button"
          className={className === undefined ? 'dsh-cs-filter' : `dsh-cs-filter ${className}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => { setOpen(value => !value) }}
        >
          <span className="dsh-cs-filter-label">{label}</span>
          <span
            className="dsh-cs-caret"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: ARROW_DOWN_MARKUP }}
          />
        </button>
      )}
    />
  )
}

/**
 * Render the Sessions page.
 *
 * @param props - the locale seat, the two catalog hooks, and the injected actions.
 * @returns the management surface and its confirmations.
 */
export function SessionsSection({
  t,
  useSessions,
  useWorkspaces,
  setArchived,
  refresh,
  onDeleted,
}: SessionsSectionProps): ReactElement {
  const sessionState = useSessions((state: any) => state) as SessionListStateLike
  const workspaceState = useWorkspaces((state: any) => state) as WorkspaceStateLike
  // A successful deletion hides its rows immediately; the catalog refresh that
  // follows may take a moment, and a row whose artifact is already gone must
  // not stay clickable in between.
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set())
  const rows = useMemo(
    () => buildRows(sessionState, workspaceState).filter(row => !removed.has(row.id)),
    [sessionState, workspaceState, removed],
  )

  const [query, setQuery] = useState('')
  const [workspaceFilter, setWorkspaceFilter] = useState('all')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkArchiving, setBulkArchiving] = useState(false)
  const [problem, setProblem] = useState<Problem | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<{ readonly ids: readonly string[] } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined)

  const [archiveStop, setArchiveStop] = useState<{ readonly row: SessionRow; readonly activity: readonly ArchiveActivity[] } | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | undefined>(undefined)

  const selectAllRef = useRef<HTMLInputElement | null>(null)

  // A row that left the catalog (deleted from another surface, or refreshed
  // away) must not stay selected behind the user's back.
  useEffect(() => {
    setSelected((previous) => {
      if (previous.size === 0) return previous
      const existing = new Set(rows.map(row => row.id))
      let changed = false
      const next = new Set<string>()
      for (const id of previous) {
        if (existing.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : previous
    })
  }, [rows])

  const workspaceOptions = useMemo(() => {
    const titles = new Map<string, string>()
    for (const row of rows) {
      if (row.workspaceId !== undefined) titles.set(row.workspaceId, row.workspaceTitle ?? '')
    }
    return [...titles].map(([id, title]) => ({ id, title })).sort((left, right) => left.title.localeCompare(right.title))
  }, [rows])
  const hasUnassigned = useMemo(() => rows.some(row => row.workspaceId === undefined), [rows])

  // The two filters' rows and the label the closed trigger shows. Both lists
  // are rebuilt when the catalog or the language changes, so a renamed
  // workspace or a locale switch reaches the open menu too.
  const workspaceItems = useMemo<readonly MenuEntry[]>(() => [
    { id: 'all', label: t('sessions.allWorkspaces') },
    ...workspaceOptions.map(option => ({ id: option.id, label: option.title })),
    ...(hasUnassigned ? [{ id: 'none', label: t('sessions.noWorkspace') }] : []),
  ], [t, workspaceOptions, hasUnassigned])

  const archiveItems = useMemo<readonly MenuEntry[]>(() => [
    { id: 'all', label: t('sessions.allSessions') },
    { id: 'unarchived', label: t('sessions.unarchived') },
    { id: 'archived', label: t('sessions.archived') },
  ], [t])

  const workspaceLabel = workspaceFilter === 'all'
    ? t('sessions.allWorkspaces')
    : workspaceFilter === 'none'
      ? t('sessions.noWorkspace')
      : workspaceOptions.find(option => option.id === workspaceFilter)?.title ?? t('sessions.allWorkspaces')

  const archiveLabel = archiveFilter === 'all'
    ? t('sessions.allSessions')
    : archiveFilter === 'unarchived' ? t('sessions.unarchived') : t('sessions.archived')

  // A filter naming a workspace that just disappeared (deleted, or emptied by
  // a catalog refresh) would otherwise strand the page on an empty list.
  useEffect(() => {
    if (workspaceFilter === 'none') {
      if (!hasUnassigned) setWorkspaceFilter('all')
      return
    }
    if (workspaceFilter !== 'all' && !workspaceOptions.some(option => option.id === workspaceFilter)) {
      setWorkspaceFilter('all')
    }
  }, [workspaceFilter, workspaceOptions, hasUnassigned])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return rows.filter((row) => {
      if (workspaceFilter !== 'all') {
        if (workspaceFilter === 'none') {
          if (row.workspaceId !== undefined) return false
        } else if (row.workspaceId !== workspaceFilter) return false
      }
      if (archiveFilter === 'archived' && !row.archived) return false
      if (archiveFilter === 'unarchived' && row.archived) return false
      if (needle !== '' && !row.title.toLocaleLowerCase().includes(needle)) return false
      return true
    })
  }, [rows, query, workspaceFilter, archiveFilter])

  const visibleIds = useMemo(() => filtered.map(row => row.id), [filtered])
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id))
  const someSelected = visibleIds.some(id => selected.has(id))

  useEffect(() => {
    const node = selectAllRef.current
    if (node !== null) node.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const clearSelection = (): void => { setSelected(new Set()) }

  // Only the selected rows that still have something to archive: already
  // archived rows are a no-op, and the bulk action stays disabled when the
  // selection holds nothing else.
  const archivableSelected = useMemo(
    () => rows.filter(row => selected.has(row.id) && !row.archived),
    [rows, selected],
  )

  const toggleAll = (): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (allSelected) {
        for (const id of visibleIds) next.delete(id)
      } else {
        for (const id of visibleIds) next.add(id)
      }
      return next
    })
  }

  const toggleRow = (id: string, checked: boolean): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const openDelete = (ids: readonly string[]): void => {
    if (ids.length === 0) return
    setDeleteError(undefined)
    setDeleteTarget({ ids: [...ids] })
  }

  const closeDelete = (): void => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError(undefined)
  }

  const confirmDelete = async (): Promise<void> => {
    const target = deleteTarget
    if (deleting || target === null) return
    setDeleting(true)
    setDeleteError(undefined)
    const payload = await deleteSessions(target.ids)
    const results = payload.results ?? []
    const requestError = typeof payload.error === 'string' && payload.error !== '' ? payload.error : undefined

    if (results.length === 0) {
      setDeleting(false)
      setDeleteError(rawReason(t, requestError, 'sessions.actionFailed'))
      return
    }

    const succeeded = results
      .filter(result => result.ok === true && typeof result.sessionId === 'string')
      .map(result => result.sessionId as string)
    const failed = results.filter(result => result.ok !== true)

    for (const id of succeeded) onDeleted?.(id)
    if (succeeded.length > 0) {
      setRemoved((previous) => {
        const next = new Set(previous)
        for (const id of succeeded) next.add(id)
        return next
      })
      setSelected((previous) => {
        if (previous.size === 0) return previous
        const next = new Set(previous)
        for (const id of succeeded) next.delete(id)
        return next
      })
    }

    setDeleting(false)
    if (succeeded.length === 0) {
      // Nothing was removed: keep the confirmation up so the user can retry.
      const first = failed[0]
      setDeleteError(first === undefined
        ? rawReason(t, requestError, 'sessions.actionFailed')
        : reasonOf(t, first, 'error.delete-failed'))
      return
    }

    setDeleteTarget(null)
    if (failed.length > 0) {
      const first = failed[0]
      const detail = requestError ?? first?.error
      setProblem({
        prefix: { key: 'sessions.bulkPartial', params: { deleted: succeeded.length, failed: failed.length } },
        ...(first === undefined || first.failure === undefined ? {} : { failure: first.failure }),
        ...(detail === undefined ? {} : { error: detail }),
      })
    } else if (requestError !== undefined) {
      // A later batch could not be attempted; the completed ones still count.
      setProblem({
        prefix: { key: 'sessions.bulkStopped', params: { deleted: succeeded.length } },
        error: requestError,
      })
    }
  }

  const toggleArchive = async (row: SessionRow): Promise<void> => {
    if (setArchived === undefined) {
      setProblem({ error: t('sessions.unavailable') })
      return
    }
    setBusyId(row.id)
    setProblem(null)
    const result = await setArchived(row.id, row.archived, false)
    setBusyId(null)
    if (result.ok) return
    if (result.unavailable === true) {
      setProblem({ error: t('sessions.unavailable') })
      return
    }
    if (result.active !== undefined) {
      setArchiveError(undefined)
      setArchiveStop({ row, activity: result.active })
      return
    }
    setProblem({
      ...(result.failure === undefined ? {} : { failure: result.failure }),
      ...(result.message === undefined ? {} : { error: result.message }),
    })
  }

  /**
   * Archive every selected row that is not archived yet.
   *
   * Running rows are left for the single-row stop-and-archive confirmation:
   * stopping work in bulk without naming the sessions would hide what is about
   * to be interrupted, so this pass skips them and reports the count instead.
   */
  const archiveSelected = async (): Promise<void> => {
    if (setArchived === undefined) {
      setProblem({ error: t('sessions.unavailable') })
      return
    }
    if (bulkArchiving) return
    const targets = rows.filter(row => selected.has(row.id) && !row.archived)
    if (targets.length === 0) return
    setBulkArchiving(true)
    setProblem(null)
    const archivedIds: string[] = []
    let skipped = 0
    let firstFailure: ArchiveResult | undefined
    for (const row of targets) {
      const result = await setArchived(row.id, false, false)
      if (result.ok) {
        archivedIds.push(row.id)
      } else if (result.active !== undefined) {
        skipped += 1
      } else {
        firstFailure ??= result
      }
    }
    setBulkArchiving(false)
    if (archivedIds.length > 0) {
      setSelected((previous) => {
        const next = new Set(previous)
        for (const id of archivedIds) next.delete(id)
        return next
      })
    }
    const failed = targets.length - archivedIds.length - skipped
    if (failed > 0) {
      setProblem({
        ...(archivedIds.length === 0
          ? {}
          : { prefix: { key: 'sessions.bulkArchiveFailed' as const, params: { archived: archivedIds.length, failed } } }),
        ...(firstFailure?.failure === undefined ? {} : { failure: firstFailure.failure }),
        ...(firstFailure?.message === undefined ? {} : { error: firstFailure.message }),
      })
      return
    }
    if (skipped > 0) {
      setProblem({
        prefix: {
          key: 'sessions.bulkArchivePartial',
          params: { archived: archivedIds.length, skipped },
        },
      })
    }
  }

  const closeArchiveStop = (): void => {
    if (archiving) return
    setArchiveStop(null)
    setArchiveError(undefined)
  }

  const confirmStopArchive = async (): Promise<void> => {
    const pending = archiveStop
    if (archiving || pending === null || setArchived === undefined) return
    setArchiving(true)
    setArchiveError(undefined)
    const result = await setArchived(pending.row.id, false, true)
    setArchiving(false)
    if (result.ok) {
      setArchiveStop(null)
      return
    }
    if (result.failure !== undefined) {
      setArchiveError(t(`error.${result.failure.code}` as MessageKey, result.failure.params))
      return
    }
    setArchiveError(typeof result.message === 'string' && result.message !== ''
      ? result.message
      : t('sessions.actionFailed'))
  }

  const loading = sessionState.phase === 'pending' && rows.length === 0
  const loadFailed = !loading && rows.length === 0 && sessionState.error !== undefined && sessionState.error !== null
  const deleteIsBatch = (deleteTarget?.ids.length ?? 0) > 1

  return (
    <div className="dsh-cs-settings">
      <div>
        <h2 className="dsh-cs-settings-heading">{t('settings.title')}</h2>
        <p className="dsh-cs-settings-description">{t('settings.description')}</p>
      </div>

      <div className="dsh-cs-toolbar">
        <Input
          className="dsh-cs-search"
          type="search"
          value={query}
          placeholder={t('sessions.searchPlaceholder')}
          aria-label={t('sessions.search')}
          onChange={(event) => {
            setQuery(event.target.value)
            clearSelection()
          }}
        />
        <FilterMenu
          label={workspaceLabel}
          items={workspaceItems}
          selectedId={workspaceFilter}
          className="dsh-cs-filter-workspace"
          listClassName="dsh-cs-menu"
          onSelect={(id) => {
            if (id === workspaceFilter) return
            setWorkspaceFilter(id)
            clearSelection()
          }}
        />
        <FilterMenu
          label={archiveLabel}
          items={archiveItems}
          selectedId={archiveFilter}
          className="dsh-cs-filter-archive"
          align="end"
          onSelect={(id) => {
            if (id === archiveFilter) return
            setArchiveFilter(id as ArchiveFilter)
            clearSelection()
          }}
        />
      </div>

      {problem !== null && (
        <div className="dsh-cs-problem" role="alert">
          <span>{problemText(t, problem)}</span>
          <button type="button" className="dsh-cs-problem-dismiss" aria-label={t('action.close')} onClick={() => { setProblem(null) }}>×</button>
        </div>
      )}

      {/* A row of its own, outside the table card: the count on the left,
          the bulk actions on the right only once something is selected. */}
      <div className="dsh-cs-selection-bar">
        <span className="dsh-cs-selection-count">{t('sessions.selectedCount', { count: selected.size })}</span>
        {selected.size > 0 && (
          <div className="dsh-cs-bulk-actions">
            <button
              type="button"
              className="dsh-cs-link"
              disabled={archivableSelected.length === 0 || bulkArchiving}
              onClick={() => { void archiveSelected() }}
            >
              {t('sessions.archiveSelected')}
            </button>
            <button
              type="button"
              className="dsh-cs-link dsh-cs-danger"
              disabled={deleting || bulkArchiving}
              onClick={() => { openDelete([...selected]) }}
            >
              {t('sessions.deleteSelected')}
            </button>
          </div>
        )}
      </div>

      <div className="dsh-cs-table">
        <div className="dsh-cs-table-body" role="table" aria-label={t('settings.title')}>
          <div className="dsh-cs-table-head" role="row">
            <span role="columnheader" className="dsh-cs-head-check">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                disabled={visibleIds.length === 0 || bulkArchiving}
                aria-label={t('sessions.selectAll')}
                title={t('sessions.selectAll')}
                onChange={toggleAll}
              />
            </span>
            <span role="columnheader">{t('sessions.columnTitle')}</span>
            <span role="columnheader">{t('sessions.columnStatus')}</span>
            <span role="columnheader" className="dsh-cs-head-actions">{t('sessions.columnActions')}</span>
          </div>

          {loading && <div className="dsh-cs-empty">{t('sessions.loading')}</div>}

          {loadFailed && (
            <div className="dsh-cs-empty">
              <p>{t('sessions.loadFailed')}</p>
              <Button variant="outline" size="sm" onClick={() => { refresh?.() }}>{t('sessions.retry')}</Button>
            </div>
          )}

          {!loading && !loadFailed && filtered.map((row) => {
            const full = formatFull(row.updatedAt)
            const state = row.running ? 'running' : row.archived ? 'archived' : 'unarchived'
            const stateLabel = row.running
              ? t('sessions.running')
              : row.archived ? t('sessions.archived') : t('sessions.unarchived')
            return (
              <div
                className="dsh-cs-row"
                role="row"
                key={row.id}
                data-session-id={row.id}
                data-archived={row.archived ? '1' : '0'}
                data-running={row.running ? '1' : '0'}
              >
                <input
                  className="dsh-cs-row-check"
                  type="checkbox"
                  checked={selected.has(row.id)}
                  disabled={bulkArchiving}
                  aria-label={t('sessions.selectOne', { title: row.title })}
                  onChange={(event) => { toggleRow(row.id, event.target.checked) }}
                />
                <div className="dsh-cs-main" role="cell">
                  <span className="dsh-cs-title" title={row.title}>{row.title}</span>
                  <span className="dsh-cs-meta">
                    <span className="dsh-cs-workspace" title={row.cwd ?? row.workspaceTitle}>
                      {row.workspaceTitle ?? t('sessions.noWorkspace')}
                    </span>
                    <span className="dsh-cs-sep" aria-hidden="true">·</span>
                    <time
                      className="dsh-cs-date"
                      dateTime={row.updatedAt > 0 ? new Date(row.updatedAt).toISOString() : undefined}
                      title={full}
                    >
                      {formatDay(row.updatedAt)}
                    </time>
                  </span>
                </div>
                <span className={`dsh-cs-status dsh-cs-status-${state}`} role="cell">{stateLabel}</span>
                <div className="dsh-cs-actions" role="cell">
                  <button
                    type="button"
                    className="dsh-cs-link"
                    disabled={busyId === row.id || bulkArchiving}
                    onClick={() => { void toggleArchive(row) }}
                  >
                    {row.archived ? t('sessions.unarchive') : t('sessions.archive')}
                  </button>
                  <button
                    type="button"
                    className="dsh-cs-link dsh-cs-danger"
                    disabled={deleting || busyId === row.id || bulkArchiving}
                    onClick={() => { openDelete([row.id]) }}
                  >
                    {t('sessions.delete')}
                  </button>
                </div>
              </div>
            )
          })}

          {!loading && !loadFailed && filtered.length === 0 && (
            <div className="dsh-cs-empty">
              {rows.length === 0 ? t('sessions.empty') : t('sessions.noMatches')}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={closeDelete}
        title={deleteIsBatch ? t('sessions.deleteSelectedTitle') : t('delete.title')}
        description={deleteIsBatch
          ? t('sessions.deleteBatchDescription', { count: deleteTarget?.ids.length ?? 0 })
          : t('delete.description')}
        closeLabel={t('action.close')}
        footer={(
          <>
            <Button variant="outline" data-modal-autofocus disabled={deleting} onClick={closeDelete}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="outline"
              className="dsh-cs-delete-action"
              disabled={deleting}
              onClick={() => { void confirmDelete() }}
            >
              {deleting ? t('delete.pending') : t('delete.confirm')}
            </Button>
          </>
        )}
      >
        {deleteError === undefined ? undefined : <div className="dsh-cs-delete-error" role="alert">{deleteError}</div>}
      </Modal>

      <Modal
        open={archiveStop !== null}
        onClose={closeArchiveStop}
        title={t('sessions.archiveStopTitle')}
        description={archiveStop === null
          ? undefined
          : t('sessions.archiveStopDescription', { title: archiveStop.row.title })}
        closeLabel={t('action.close')}
        footer={(
          <>
            <Button variant="outline" data-modal-autofocus disabled={archiving} onClick={closeArchiveStop}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="outline"
              className="dsh-cs-delete-action"
              disabled={archiving}
              onClick={() => { void confirmStopArchive() }}
            >
              {archiving ? t('sessions.archiveStopPending') : t('sessions.archiveStopAction')}
            </Button>
          </>
        )}
      >
        <ul className="dsh-cs-activity" aria-label={t('sessions.archiveActivity')}>
          {(archiveStop?.activity ?? []).map((entry, index) => (
            <li key={`${entry.kind}-${String(index)}`}>{activityLine(t, entry)}</li>
          ))}
        </ul>
        {archiveError === undefined ? undefined : <div className="dsh-cs-delete-error" role="alert">{archiveError}</div>}
      </Modal>
    </div>
  )
}
