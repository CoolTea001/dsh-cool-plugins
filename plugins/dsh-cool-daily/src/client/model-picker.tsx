/**
 * The model picker inside the settings dialog.
 *
 * The shape is dsh-cool-git's settings picker, carried over rather than
 * approximated: the trigger repeats the dialog's field material, and the list is
 * a fixed-height popover with a search row, provider groups that fold away, and
 * the plugin's own overlay scrollbar. The platform has no `Popover` primitive,
 * so the panel is assembled from the pieces its own menus use — CSS anchor
 * positioning keeps it against the trigger, `useModalLayer` puts it on
 * the dialog's layer stack so Escape closes the list before the card and Tab
 * stays inside it, and the panel is portaled to `document.body` because the
 * dialog body is a scrollport that would clip a child.
 *
 * The field speaks the effective route — the pinned one, or DSH's default while
 * nothing is pinned — exactly as the reference does, and the list holds only
 * routes that can be saved: choosing a model is what pins it, and until a reader
 * does that this plugin goes on following DSH.
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  Menu,
  useModalLayer,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'

import { IconCheck, IconChevronRight } from '@dsh-cool/icons'
import { fetchModelEfforts } from './api.js'
import type { Translate } from './locales.js'
import type { DailyModel, ModelGroup } from '../shared/contract.js'

/** How tall the panel is: a fixed sheet keeps it from jumping while a search narrows the list. */
const PICKER_HEIGHT = 370

/** The shortest the overlay scrollbar thumb may get. */
const PICKER_THUMB_MIN = 28

/** The gap and margin the panel is placed with. */
const PICKER_GAP = 6
const PICKER_MARGIN = 12

/** The width the panel opens at, and the narrowest a narrow field may shrink it to. */
const PICKER_WIDTH_INITIAL = 320
const PICKER_WIDTH_MIN = 280

/** The layer the panel sits on, and how far above the field's own layer it starts. */
const PICKER_Z_BASE = 1000
const PICKER_Z_STEP = 10

/**
 * What a row's effort control says when the route pins no level.
 *
 * Deliberately not translated: the ids listed beside it come from the adapter
 * (`high`, `medium`, …), so the name for "no pinned level" belongs to that same
 * vocabulary rather than to either dictionary.
 */
const DEFAULT_EFFORT = 'Default'

/** The effort menu's id for "no pinned level", kept clear of the adapter's ids. */
const EFFORT_DEFAULT_ID = 'dsh-cd-effort-default'

/** The parts of the picker's placement this plugin owns. */
interface PickerLayout {
  readonly width: number
  /** Above every layer the dialog put over the page (mask and card). */
  readonly zIndex: number
  /** Below the field when there is room, above it when there is not. */
  readonly side: 'bottom' | 'top'
}

/** Join a route into one comparable key. */
function keyOf(route: DailyModel): string {
  return `${route.provider}\u0000${route.model}`
}

/** Name one route through the catalog, falling back to its raw ids. */
function labelOf(route: DailyModel, groups: readonly ModelGroup[]): string {
  const group = groups.find(entry => entry.provider === route.provider)
  const model = group?.models.find(entry => entry.id === route.model)
  return `${group?.name ?? route.provider} / ${model?.name ?? route.model}`
}

/** The props the settings dialog hands the picker. */
export interface ModelPickerProps {
  /** The plugin's translate seat. */
  t: Translate
  /** The catalog to offer. */
  groups: readonly ModelGroup[]
  /** DSH's current default selection, shown when this plugin follows it. */
  current: DailyModel | null
  /** The pinned route, or null when following the default. */
  value: DailyModel | null
  /** Whether the dialog is mid-save. */
  disabled: boolean
  /** The route the reader chose. */
  onChange: (value: DailyModel) => void
}

/**
 * Render the picker.
 * @param props - catalog, current choice, and the change callback.
 * @returns the trigger and, while open, its popover.
 */
export function ModelPicker({
  t,
  groups,
  current,
  value,
  disabled,
  onChange,
}: ModelPickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [collapsed, setCollapsed] = React.useState<readonly string[]>([])
  const [effortOpen, setEffortOpen] = React.useState<string | null>(null)
  const [effortLists, setEffortLists] = React.useState<Readonly<Record<string, readonly string[]>>>({})
  const [effortFailures, setEffortFailures] = React.useState<readonly string[]>([])
  const [effortLoading, setEffortLoading] = React.useState<readonly string[]>([])
  const [thumb, setThumb] = React.useState<{ readonly top: number; readonly height: number } | null>(null)
  const [layout, setLayout] = React.useState<PickerLayout>({
    width: PICKER_WIDTH_INITIAL,
    zIndex: PICKER_Z_BASE + PICKER_Z_STEP,
    side: 'bottom',
  })

  const fieldRef = React.useRef<HTMLButtonElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const panelId = React.useId()
  /**
   * The CSS anchor the field and the portaled panel share.
   *
   * `useId` returns a value containing colons, which an `anchor-name` value may
   * not hold, so they are dropped. One custom property carries the name into the
   * trigger's `anchor-name` and the panel's `position-anchor`; see the
   * v0.2.2-alpha.2 "CSS-anchored menus" upgrade guide for why the platform's
   * JavaScript position hook is no longer an option.
   */
  const anchorStyle: React.CSSProperties & Record<'--dsh-cd-picker-anchor', string> = {
    '--dsh-cd-picker-anchor': `--dsh-cd-picker-${panelId.replaceAll(':', '')}`,
  }
  /** Routes whose effort list has been asked for, so one row asks once. */
  const effortsAsked = React.useRef<Set<string>>(new Set())

  const close = React.useCallback((): void => {
    setOpen(false)
    setEffortOpen(null)
  }, [])

  /**
   * Place the list's own scrollbar thumb over the rows.
   *
   * The native bar is hidden because a platform scrollbar is 5px of real width
   * taken out of the rows' right edge; the thumb is drawn over the rows' padding
   * instead, so the layout is the same width whether the catalog overflows or not.
   */
  const measureThumb = React.useCallback((): void => {
    const list = listRef.current
    if (list === null) return
    const { scrollTop, scrollHeight, clientHeight } = list
    if (scrollHeight <= clientHeight + 1) {
      setThumb(currentThumb => (currentThumb === null ? currentThumb : null))
      return
    }
    const height = Math.max(PICKER_THUMB_MIN, Math.round((clientHeight / scrollHeight) * clientHeight))
    const top = Math.round((scrollTop / (scrollHeight - clientHeight)) * (clientHeight - height))
    setThumb(currentThumb => (currentThumb !== null && currentThumb.top === top && currentThumb.height === height
      ? currentThumb
      : { top, height }))
  }, [])

  // A fold, a search, or a freshly arrived catalog moves the rows without a
  // scroll event, so the thumb is re-placed after those renders too; the setter
  // only publishes when the answer changed, which ends the loop.
  React.useLayoutEffect(() => {
    if (open) measureThumb()
  })

  // What the position hook cannot know: how wide the field made the panel, how
  // much room there is on each side, and how high the dialog stacks its layers.
  React.useLayoutEffect(() => {
    if (!open) return
    const measure = (): void => {
      const trigger = fieldRef.current
      if (trigger === null) return
      const rect = trigger.getBoundingClientRect()
      const width = Math.max(PICKER_WIDTH_MIN, Math.min(rect.width, window.innerWidth - PICKER_MARGIN * 2))
      const below = window.innerHeight - rect.bottom - PICKER_GAP - PICKER_MARGIN
      const above = rect.top - PICKER_GAP - PICKER_MARGIN
      // The panel's height is fixed, so the only question is which side can hold it.
      const openUp = below < PICKER_HEIGHT && above > below
      let layer = 0
      for (let node = trigger.parentElement; node !== null && node !== document.body; node = node.parentElement) {
        const zIndex = Number(window.getComputedStyle(node).zIndex)
        if (Number.isFinite(zIndex)) layer = Math.max(layer, zIndex)
      }
      const next: PickerLayout = {
        width,
        zIndex: Math.max(layer + PICKER_Z_STEP, PICKER_Z_BASE),
        side: openUp ? 'top' : 'bottom',
      }
      setLayout(currentLayout => (
        currentLayout.width === next.width
        && currentLayout.zIndex === next.zIndex
        && currentLayout.side === next.side
          ? currentLayout
          : next
      ))
    }
    measure()
    // Scrolling the panel's own list must not change the field's side or room.
    const followScroll = (event: Event): void => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target) === true) return
      measure()
    }
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', followScroll, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', followScroll, true)
    }
  }, [open])

  // The platform's layer hook answers Escape, keeps Tab inside the open panel,
  // and returns focus when it closes. The panel's position is CSS anchor
  // positioning's job now: the trigger declares `anchor-name` and the portaled
  // panel follows it through `position-anchor`, so the browser keeps the two
  // together across scrolling and resizing. `useAnchoredPosition`, which used to
  // do that work in JavaScript, was removed from
  // `@deepseek-ai/dsh-client-ui-primitives` in this DSH version.
  useModalLayer(panelRef, open, close)

  // A click anywhere but the field or the panel closes the list.
  React.useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (fieldRef.current?.contains(target) === true) return
      if (panelRef.current?.contains(target) === true) return
      // A row's effort menu is portaled to the body, so it is outside both the
      // field and the panel by that test; its rows are the panel's own business.
      if (target instanceof Element && target.closest('[role="menu"]') !== null) return
      close()
    }
    document.addEventListener('pointerdown', dismiss)
    return () => { document.removeEventListener('pointerdown', dismiss) }
  }, [close, open])

  const needle = query.trim().toLowerCase()
  const matches = (text: string): boolean => text.toLowerCase().includes(needle)
  // A provider whose own name matches keeps every model: naming the provider is
  // looking for the group, not for one row inside it.
  const visibleGroups = needle === ''
    ? groups
    : groups
      .map(group => {
        const providerHit = matches(group.name) || matches(group.provider)
        const models = providerHit
          ? group.models
          : group.models.filter(model => matches(model.name) || matches(model.id))
        return { ...group, models }
      })
      .filter(group => group.models.length > 0)

  const known = new Set(groups.flatMap(group => group.models.map(model => keyOf({ provider: group.provider, model: model.id }))))
  // A pinned route the catalog no longer lists is still what the user saved, so
  // it keeps a row of its own instead of vanishing and looking unset.
  const stale = value !== null && !known.has(keyOf(value)) ? value : null

  const choose = (next: DailyModel): void => {
    onChange(next)
    setOpen(false)
  }

  const closeEfforts = (): void => { setEffortOpen(null) }

  /**
   * Read one row's effort list, once per model per opening.
   *
   * The list is adapter metadata resolved per model, so it is read when the
   * control is opened rather than with the catalog. A failed read stays beside
   * its row: it is not the dialog's failure, and the row must not pretend the
   * model offers no level.
   */
  const loadEfforts = (route: DailyModel): void => {
    const key = keyOf(route)
    if (effortsAsked.current.has(key)) return
    effortsAsked.current.add(key)
    setEffortLoading(current => [...current, key])
    void fetchModelEfforts(route.provider, route.model).then((result) => {
      setEffortLoading(current => current.filter(entry => entry !== key))
      if (result.ok === true) {
        setEffortLists(current => ({ ...current, [key]: result.efforts }))
        return
      }
      setEffortLists(current => ({ ...current, [key]: [] }))
      setEffortFailures(current => (current.includes(key) ? current : [...current, key]))
    })
  }

  /** Open one row's effort control, or close it when it is already open. */
  const toggleEfforts = (route: DailyModel): void => {
    const key = keyOf(route)
    if (effortOpen === key) {
      setEffortOpen(null)
      return
    }
    setEffortOpen(key)
    loadEfforts(route)
  }

  // The field speaks the effective route, like the reference: the saved one, or
  // DSH's current default while this plugin has saved none.
  const effective = value ?? current
  const triggerLabel = effective === null
    ? t('settings.modelUnknown')
    : `${labelOf(effective, groups)} / ${effective.reasoningEffort ?? DEFAULT_EFFORT}`

  const rowCheck = (chosen: boolean): React.ReactElement | null => (
    chosen ? <span className="dsh-cd-picker-row-check" aria-hidden="true"><IconCheck size={12} /></span> : null
  )

  /**
   * Draw one model row and the effort control that row owns.
   *
   * Naming a model and naming a level are two controls, like the reference: the
   * name selects the model, and the control opens the adapter's own levels in the
   * platform `Menu` — a short list of named levels is what a menu is, and its
   * portal keeps it out of the panel's scrollport. Choosing a level pins the route
   * with it, which is why the control only shows the level a chosen route stores.
   */
  const renderRow = (route: DailyModel, label: string, chosen: boolean, hint?: string): React.ReactElement => {
    const key = keyOf(route)
    const pinned = chosen && value !== null ? value.reasoningEffort ?? null : null
    const menuOpen = effortOpen === key
    const efforts = effortLists[key] ?? []
    // A saved level the adapter no longer lists is still what the route stores,
    // so it is kept beside the current ones instead of quietly disappearing.
    const orphan = pinned !== null && !efforts.includes(pinned) ? [pinned] : []

    const items: MenuEntry[] = [{ id: EFFORT_DEFAULT_ID, label: DEFAULT_EFFORT }]
    if (effortLoading.includes(key)) {
      items.push({ type: 'label', id: `${key}-loading`, text: t('settings.loading') })
    } else if (effortFailures.includes(key)) {
      items.push({ type: 'label', id: `${key}-failure`, text: t('settings.effortReadFailed') })
    }
    for (const effort of [...efforts, ...orphan]) items.push({ id: effort, label: effort })

    return (
      <div key={key} className="dsh-cd-picker-row" data-selected={chosen}>
        <button
          type="button"
          className="dsh-cd-picker-row-name"
          aria-pressed={chosen}
          onClick={() => { choose(route) }}
        >
          <span className="dsh-cd-picker-row-text">{label}</span>
          {hint !== undefined && <span className="dsh-cd-picker-row-hint">{hint}</span>}
          {rowCheck(chosen)}
        </button>
        <Menu
          open={menuOpen}
          className="dsh-cd-picker-effort-control"
          anchor={(
            <button
              type="button"
              className="dsh-cd-picker-row-effort"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`${t('settings.effort')}: ${pinned ?? DEFAULT_EFFORT}`}
              onClick={() => { toggleEfforts(route) }}
            >
              <span>{pinned ?? DEFAULT_EFFORT}</span>
              <span className="dsh-cd-picker-row-arrow" aria-hidden="true">
                <IconChevronRight size={12} />
              </span>
            </button>
          )}
          items={items}
          selectedId={pinned ?? EFFORT_DEFAULT_ID}
          onSelect={(id) => {
            closeEfforts()
            choose(id === EFFORT_DEFAULT_ID ? route : { ...route, reasoningEffort: id })
          }}
          onClose={closeEfforts}
          // The control is the row's right end, so the list opens back across the
          // model names instead of off the panel's own edge.
          align="end"
          side="bottom"
          portal
        />
      </div>
    )
  }

  return (
    <div className="dsh-cd-picker">
      <button
        ref={fieldRef}
        id={`${panelId}-field`}
        type="button"
        className="dsh-cd-picker-trigger"
        style={anchorStyle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => {
          setOpen(currentOpen => !currentOpen)
          setQuery('')
        }}
      >
        <span className="dsh-cd-picker-value">{triggerLabel}</span>
        <span className="dsh-cd-picker-chevron" data-open={open} aria-hidden="true">
          <IconChevronRight size={14} />
        </span>
      </button>

      {open && createPortal(
        <div
          id={panelId}
          ref={panelRef}
          className="dsh-cd-picker-popover"
          role="group"
          aria-label={t('settings.model')}
          data-side={layout.side}
          style={{
            ...anchorStyle,
            // The stylesheet draws the gap the side decision above measured
            // with, so PICKER_GAP stays the single source.
            '--dsh-cd-picker-gap': `${PICKER_GAP}px`,
            width: layout.width,
            height: PICKER_HEIGHT,
            zIndex: layout.zIndex,
          } as React.CSSProperties}
        >
          <div className="dsh-cd-picker-search">
            <input
              type="text"
              className="dsh-cd-picker-input"
              value={query}
              placeholder={t('settings.modelSearch')}
              aria-label={t('settings.modelSearch')}
              spellCheck={false}
              onChange={(event) => { setQuery(event.target.value) }}
            />
          </div>
          <div className="dsh-cd-picker-listwrap">
            <div className="dsh-cd-picker-list" ref={listRef} onScroll={measureThumb}>
              {stale !== null && (
                <>
                  {renderRow(stale, t('settings.modelStale'), true, labelOf(stale, groups))}
                  <div className="dsh-cd-picker-rule" role="presentation" />
                </>
              )}

              {visibleGroups.map(group => {
                // A search expands every group it matched: a folded provider would
                // hide the very rows the query found.
                const expanded = needle !== '' || !collapsed.includes(group.provider)
                return (
                  <div key={group.provider} className="dsh-cd-picker-group">
                    <div className="dsh-cd-picker-group-sticky">
                      <button
                        type="button"
                        className="dsh-cd-picker-group-head"
                        aria-expanded={expanded}
                        onClick={() => {
                          setCollapsed(currentCollapsed => currentCollapsed.includes(group.provider)
                            ? currentCollapsed.filter(entry => entry !== group.provider)
                            : [...currentCollapsed, group.provider])
                        }}
                      >
                        <span className="dsh-cd-picker-group-name">{group.name}</span>
                        <span className="dsh-cd-picker-group-arrow" data-open={expanded} aria-hidden="true">
                          <IconChevronRight size={12} />
                        </span>
                      </button>
                    </div>
                    {expanded
                      ? group.models.map(model => {
                        const route: DailyModel = { provider: group.provider, model: model.id }
                        const chosen = value !== null && keyOf(value) === keyOf(route)
                        return renderRow(route, model.name, chosen)
                      })
                      : null}
                  </div>
                )
              })}

              {visibleGroups.length === 0 && (
                <p className="dsh-cd-picker-empty">{t('settings.searchEmpty')}</p>
              )}
            </div>
            {thumb !== null && (
              <span
                className="dsh-cd-picker-thumb"
                style={{ top: thumb.top, height: thumb.height }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
