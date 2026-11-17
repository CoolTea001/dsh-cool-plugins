/**
 * The owner's half of a resize gesture, wired once.
 *
 * `ResizeHandle` owns the pointer: capture, one callback a frame, a click that
 * records nothing, a cancel that puts the page back. What it cannot own is what
 * a boundary *means* — whether the size is a width or a share of a track, which
 * custom property draws it, and where it is remembered. Every page that has one
 * used to write that half by hand, in the same order, and the order is the part
 * that is easy to get subtly wrong:
 *
 * - `onStart` measures the box on screen rather than reading the saved layout,
 *   because the stylesheet is what clamps a saved size to the window it is drawn
 *   in — the edge the pointer took hold of is the drawn one, not the preference
 *   behind it;
 * - `onDrag` clamps against the room available *now*, so a drag that runs into
 *   the floor of the neighbouring pane stops where the pointer does;
 * - `onCommit` draws and records the same fitted number, so what a reload
 *   restores is exactly what was on screen;
 * - `onEnd` draws the recorded layout again, which is what makes a cancelled
 *   drag leave nothing behind.
 *
 * The page root carries `data-resizing` for the length of a gesture, written
 * here rather than by the page: the attribute is a fact about the gesture, and
 * putting it in the page's state would re-render the whole page on a press and a
 * release — for a cursor. The shared stylesheet is what reads it (see
 * `UI_CSS`), and the attribute outlives a cancelled drag only if the unmount
 * cleanup fails, which is why that cleanup is not optional.
 */

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { ResizeAxis, ResizeHandleProps } from './resize-handle.js'

/**
 * One boundary's meaning, expressed as the six answers the gesture needs.
 *
 * A spec rather than a component with options: what differs between a sidebar
 * and a split is the arithmetic (a width against the page, a share against a
 * track), and arithmetic is easier to read as a handful of small functions than
 * as a mode flag.
 */
export interface GestureSpec {
  /** The page root: where `data-resizing` is written. */
  readonly root: RefObject<HTMLElement | null>
  /** Which pointer coordinate drives the gesture. */
  readonly axis: ResizeAxis
  /** Which edge of the pane the boundary sits on. */
  readonly side: 'start' | 'end'
  /** The size the page is drawing now, in CSS pixels. */
  readonly measure: () => number
  /** The room the boundary may move through, in CSS pixels. */
  readonly room: () => number
  /** Clamp a pointer-implied size to what this page can draw. */
  readonly fit: (size: number, room: number) => number
  /** Draw one fitted size. */
  readonly draw: (size: number) => void
  /** Record the size the gesture settled on. */
  readonly persist: (size: number) => void
  /** Draw the recorded layout again. */
  readonly restore: () => void
}

/**
 * Wire one boundary to a `ResizeHandle`.
 *
 * @param spec - what the boundary means on this page.
 * @returns the callbacks a `ResizeHandle` takes, plus the axis and side it should render.
 */
export function useResizeGesture(spec: GestureSpec): ResizeHandleProps {
  // The handlers are installed once per gesture and outlive the render that
  // started it, so what they call is read from here rather than closed over: a
  // re-render during a drag must not leave the gesture calling a stale closure.
  const live = useRef(spec)
  live.current = spec

  /**
   * The element this gesture marked, kept so the cleanup can unmark it.
   *
   * Read at cleanup time, `root.current` would already be null: React detaches
   * host refs before the effects that watch them clean up. The attribute would
   * then outlive the component that set it, which for a sidebar toggled shut
   * mid-drag means a page stuck wearing `col-resize`.
   */
  const marked = useRef<HTMLElement | null>(null)

  /** Mark, or unmark, the page as mid-gesture. */
  const mark = useCallback((axis: ResizeAxis | null): void => {
    const root = axis === null ? marked.current : live.current.root.current
    if (root === null) return
    if (axis === null) {
      root.removeAttribute('data-resizing')
      marked.current = null
    } else {
      root.setAttribute('data-resizing', axis)
      marked.current = root
    }
  }, [])

  const onStart = useCallback((): number => {
    mark(live.current.axis)
    return live.current.measure()
  }, [mark])

  const onDrag = useCallback((size: number): void => {
    const room = live.current.room()
    if (!(room > 0)) return
    live.current.draw(live.current.fit(size, room))
  }, [])

  const onCommit = useCallback((size: number): void => {
    mark(null)
    const room = live.current.room()
    if (!(room > 0)) return
    // Draw before recording: the last pointer frame was clamped against the room
    // at that instant, and a window that moved since would otherwise save a size
    // the page never drew.
    live.current.persist(live.current.fit(size, room))
  }, [mark])

  const onEnd = useCallback((): void => {
    mark(null)
    live.current.restore()
  }, [mark])

  // A page that unmounts mid-drag — a tab switched away, a plugin reloaded —
  // would otherwise leave the whole document wearing `col-resize` until the next
  // gesture, because the attribute lives on an element that is about to go away.
  useEffect(() => () => mark(null), [mark])

  return { axis: spec.axis, side: spec.side, onStart, onDrag, onCommit, onEnd }
}
