/**
 * A boundary the reader drags, remembered between visits — the owner's half.
 *
 * `ResizeHandle` owns the pointer: capture, one callback a frame, a click that
 * records nothing, a cancel that puts the page back. What it cannot own is what
 * a boundary *means* — whether the number is a width or a share of a track,
 * which custom property draws it, and where it is remembered. Every page that
 * had one wrote that half by hand, in the same order, and the order is the part
 * that is easy to get subtly wrong:
 *
 * - `onStart` measures the box on screen rather than reading the recorded value,
 *   because the stylesheet is what clamps a saved size to the window it is drawn
 *   in — the edge the pointer took hold of is the drawn one, not the preference
 *   behind it;
 * - `onDrag` clamps against the room available *now*, so a drag that runs into
 *   the floor of the neighbouring pane stops where the pointer does;
 * - `onCommit` draws and records the same fitted number, so what a reload
 *   restores is exactly what was on screen at the release;
 * - `onEnd` draws the recorded value again, which is what makes a cancelled drag
 *   leave nothing behind.
 *
 * The page root carries `data-resizing` for the length of a gesture, written
 * here rather than by the page: the attribute is a fact about the gesture, and
 * putting it in the page's state would re-render the whole page on a press and a
 * release — for a cursor. The shared stylesheet is what reads it (see
 * `UI_CSS`), and the unmount cleanup is not optional: without it a page that
 * goes away mid-drag leaves the whole document wearing `col-resize`.
 *
 * ## The two units
 *
 * `measure` answers in **drawn** pixels — how tall or wide the box is on screen.
 * `fit` converts that into the **recorded** unit, which is what `draw` paints and
 * `persist` saves. For a sidebar the two are the same thing (a width in pixels);
 * for a split between stacked panes they are not, because the split is saved as a
 * share of its track so that a window that grows makes both panes longer instead
 * of leaving one at a height that no longer fits. Naming the difference here is
 * what lets one hook serve both without a mode flag.
 */

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { clampSideWidth, finiteNumber, fraction, readLayout, writeLayout } from './layout-store.js'
import { useResizeGesture } from './resize-gesture.js'
import type { ResizeAxis, ResizeHandleProps } from './resize-handle.js'

/**
 * What a resizable size is allowed to be.
 *
 * `fallback` is what an unvisited page draws, `min` is the point below which the
 * pane stops being readable, `max` is where dragging further stops being worth
 * it, and `mainMin` is the floor the neighbouring pane keeps — which is why the
 * answer is clamped twice, against the cap and against the room left over.
 *
 * A split states the same four numbers in its own units: `min` is the pane's
 * floor and `mainMin` its neighbour's, both in pixels of the track, while
 * `fallback` and `max` bound the share that is saved.
 */
export interface PanelBounds {
  /** The size drawn until the reader drags it. */
  readonly fallback: number
  /** The smallest the pane may be drawn, in drawn pixels. */
  readonly min: number
  /** The largest a drag may leave it, in recorded units. */
  readonly max: number
  /** The smallest the neighbouring pane may be drawn, in drawn pixels. */
  readonly mainMin: number
}

/** Where a resizable size is remembered. */
export interface PanelStore {
  /** The `localStorage` entry, owned by the consuming plugin. */
  readonly key: string
  /**
   * The field inside that entry.
   *
   * A page may remember more than one boundary in one entry — the Git tab keeps
   * its sidebar's width beside its pane split — so the field is named rather
   * than implied. It defaults to `sideWidth`, the name every page has used since
   * before this hook existed, which is what keeps a saved layout from being
   * abandoned by the upgrade.
   *
   * @default 'sideWidth'
   */
  readonly field?: string
  /**
   * Whether the value is a share rather than a pixel size.
   *
   * A share is validated strictly inside 0–1, which is what keeps a saved `0` or
   * `1` — a pane collapsed to nothing by an older version or a hand-edited entry
   * — from leaving a pane that can never be dragged back.
   *
   * @default 'pixels'
   */
  readonly unit?: 'pixels' | 'share'
}

/** What {@link useResizablePanel} takes. */
export interface ResizablePanelOptions {
  /** The page root: `data-resizing` is written to it. */
  readonly root: RefObject<HTMLElement | null>
  /** Which pointer coordinate drives the gesture. */
  readonly axis: ResizeAxis
  /** Which edge of the pane the boundary sits on. */
  readonly side: 'start' | 'end'
  /** The floor, cap, fallback and the neighbour's floor. */
  readonly bounds: PanelBounds
  /** Where the size is remembered. Omitted, the page keeps it only while open. */
  readonly store?: PanelStore
  /** The size the page is drawing now, in drawn pixels. */
  readonly measure: () => number
  /** The room the boundary may move through, in drawn pixels. */
  readonly room: () => number
  /**
   * Convert a pointer-implied size into the recorded unit, clamped.
   *
   * For a width this is {@link clampSideWidth}; for a split it also divides by
   * the track, because what gets saved is the share.
   */
  readonly fit: (size: number, room: number) => number
  /** Paint one recorded size. Must not render React: it runs once a frame. */
  readonly draw: (size: number) => void
}

/** What {@link useResizablePanel} answers. */
export interface ResizablePanelApi {
  /** The recorded size the page is drawing, in the store's unit. */
  readonly size: number
  /** The callbacks and geometry a `ResizeHandle` needs. */
  readonly handle: ResizeHandleProps
  /** Record a size and draw it — for a caller that moves the boundary itself. */
  readonly resize: (size: number) => void
  /** Draw the recorded size again — for a caller whose neighbour changed size. */
  readonly restore: () => void
}

/**
 * Read one remembered size.
 *
 * Exported beside the hook because it is the half worth testing: a page's first
 * frame is drawn from it, and a value another version wrote has to be rejected
 * rather than trusted.
 *
 * @param store - the entry, field and unit to read.
 * @param fallback - what an unusable value becomes.
 * @returns the size to draw, always usable.
 */
export function readPanelSize(store: PanelStore | undefined, fallback: number): number {
  if (store === undefined) return fallback
  const field = store.field ?? 'sideWidth'
  const reader = store.unit === 'share' ? fraction(fallback) : finiteNumber(fallback)
  const stored = readLayout(store.key, { [field]: reader })
  return stored[field] ?? fallback
}

/**
 * Record one size, leaving every other field of the entry alone.
 *
 * One entry may hold several boundaries — the Git tab keeps its sidebar's width
 * and its pane split under one key — so a write that replaced the whole object
 * would erase its neighbours. Reading the entry back and merging is the only way
 * to keep that promise without this module owning the other fields.
 *
 * @param store - the entry and field to write.
 * @param size - the size to save.
 */
export function writePanelSize(store: PanelStore | undefined, size: number): void {
  if (store === undefined) return
  const field = store.field ?? 'sideWidth'
  let saved: Record<string, unknown> = {}
  try {
    const raw = window.localStorage.getItem(store.key)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      saved = { ...(parsed as Record<string, unknown>) }
    }
  } catch {
    // An unreadable entry is replaced rather than merged: there is nothing in it
    // worth preserving, and this field is about to be written anyway.
    saved = {}
  }
  saved[field] = size
  writeLayout(store.key, saved)
}

/**
 * Drive one resizable boundary: measure it, fit it, draw it, remember it.
 *
 * @param options - the root and pane to measure, the unit's arithmetic, the bounds and the store.
 * @returns the recorded size, and the handle that sets it.
 */
export function useResizablePanel(options: ResizablePanelOptions): ResizablePanelApi {
  const { root, axis, side, bounds, store, measure, room, fit, draw } = options
  /** The recorded size the page draws and saves. */
  const [size, setSize] = useState(() => readPanelSize(store, bounds.fallback))

  // The live mirror keeps a gesture from closing over a stale size: the handlers
  // are installed once per gesture, and a re-render during one must not leave
  // `restore` drawing the size the page had when the press happened.
  const recorded = useRef(size)
  recorded.current = size

  // Before the first paint: the stylesheet's own fallback is the default size,
  // and a saved boundary must not be drawn at the default for one frame and then
  // jump to where it was left.
  useLayoutEffect(() => {
    draw(recorded.current)
  }, [draw])

  /** Record a size: draw it, remember it, and publish it to React. */
  const record = useCallback((next: number): void => {
    draw(next)
    writePanelSize(store, next)
    recorded.current = next
    setSize(next)
  }, [draw, store])

  const handle = useResizeGesture({
    root,
    axis,
    side,
    measure,
    room,
    fit,
    draw,
    persist: record,
    restore: useCallback(() => draw(recorded.current), [draw]),
  })

  return { size, handle, resize: record, restore: handle.onEnd }
}

/**
 * The pixel arithmetic of a sidebar: clamp against the room the page has.
 *
 * Stated here rather than inline at each call site so the two callers that need
 * it — the hook's owner and the panel component — read one function.
 *
 * @param bounds - the sidebar's floor, cap and the neighbour's floor.
 * @returns a fit function for {@link useResizablePanel}.
 */
export function widthFit(bounds: PanelBounds): (size: number, room: number) => number {
  return (preferred, room) => clampSideWidth(preferred, room, bounds)
}
