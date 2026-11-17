/**
 * The one pointer gesture behind every resizable boundary in this repository.
 *
 * Three plugins had written it three times — the Git tab's sidebar and its
 * pane divider, the Files tab's sidebar, the Terminal tab's sidebar — and the
 * copies had begun to disagree about which axis they take and which coordinate
 * they read. What they share is not incidental: it is a set of decisions that
 * are wrong in ways a reader would only notice as a bad drag.
 *
 * The gesture is the platform's own width handle (client-ui-conversation's
 * `WidthHandle`), restated once:
 *
 * - the press captures the pointer and records where it started and the size the
 *   page was drawing;
 * - each move asks the caller to draw the size the pointer now implies — at most
 *   once a frame, since a pointer reports more often than a page paints;
 * - the release records that one number;
 * - a press that never moved records nothing, so a click on a boundary cannot
 *   overwrite a saved size with the window-clamped size it happens to be drawn
 *   at.
 *
 * A drag never renders React: the caller writes each size straight to a custom
 * property on the page root, which is what keeps the frame rate of a drag
 * independent of how many thousand rows the page happens to be drawing.
 *
 * The two terminal paths mean different things. `onCommit` is a new size to
 * record and draw; `onEnd` is a gesture that produced no size — a click, or a
 * pointer lost mid-drag — and the caller draws the recorded layout again, which
 * is what makes a cancelled drag leave the page exactly as it found it.
 *
 * The element sits on the boundary itself, which is a 1px line a pointer cannot
 * be asked to hold, so the shared stylesheet puts an invisible 8px band around
 * it and this component owns the line in the middle. The page root carries
 * `data-resizing` for the length of a gesture, so the cursor keeps its meaning
 * while the pointer travels outside the boundary.
 */

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'
import { uiClass } from '../styles/inject.js'

/**
 * Which way the boundary moves.
 *
 * `col` is a vertical boundary dragged along X (a sidebar's right edge); `row` is
 * a horizontal boundary dragged along Y (a divider between stacked panes).
 */
export type ResizeAxis = 'col' | 'row'

/** What a boundary tells its owner. */
export interface ResizeHandleProps {
  /** Which axis the boundary moves along, and so which pointer coordinate drives it. */
  readonly axis: ResizeAxis
  /** The size the page is drawing as the gesture starts, in CSS pixels. */
  readonly onStart: () => number
  /** Draw the size the pointer now implies. Called at most once a frame. */
  readonly onDrag: (size: number) => void
  /** Record and draw the size the gesture settled on. */
  readonly onCommit: (size: number) => void
  /** The gesture is over without a size: draw the recorded layout again. */
  readonly onEnd: () => void
}

/**
 * The pointer's own coordinate on one axis, in viewport pixels.
 *
 * @param axis - the boundary being dragged.
 * @param event - the pointer event.
 * @returns X for a column boundary, Y for a row boundary.
 */
function along(axis: ResizeAxis, event: ReactPointerEvent<HTMLDivElement>): number {
  return axis === 'col' ? event.clientX : event.clientY
}

/** Begin, drive and settle one drag of a boundary. */
export function ResizeHandle(props: ResizeHandleProps): ReactElement {
  /** Whether a gesture this component started is still running. */
  const dragging = useRef(false)
  /** The pointer's coordinate where the gesture started. */
  const origin = useRef(0)
  /** The size the page was drawing where the gesture started. */
  const start = useRef(0)
  /** The pointer's latest coordinate on this axis. */
  const latest = useRef(0)
  /** The frame awaiting the pointer's latest coordinate, if one is. */
  const frame = useRef<number | null>(null)
  // The handlers are installed once per gesture and outlive the render that
  // started it, so what they call is read from here rather than closed over: a
  // re-render during a drag (a refresh answering, the page picking up a new
  // layout) must not leave the gesture calling a stale callback.
  const live = useRef(props)
  live.current = props

  /** The size the pointer's latest coordinate implies. */
  const implied = (): number => start.current + (latest.current - origin.current)

  const cancelFrame = (): void => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }

  /**
   * End the gesture, and either record a size or re-state the layout.
   *
   * @param element - the handle the gesture was captured on.
   * @param pointerId - the pointer to release.
   * @param moved - whether this release holds a size the pointer chose.
   */
  const settle = (element: HTMLDivElement, pointerId: number, moved: boolean): void => {
    dragging.current = false
    element.toggleAttribute('data-dragging', false)
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
    cancelFrame()
    if (moved && latest.current !== origin.current) live.current.onCommit(implied())
    else live.current.onEnd()
  }

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    // The primary button alone: a right-click on a boundary is a context menu,
    // and a middle-click is a paste or an autoscroll, neither of them a resize.
    if (event.button !== 0) return
    // Before the capture, so the press neither starts a text selection nor hands
    // the keyboard to whatever is under the pointer.
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.toggleAttribute('data-dragging', true)
    origin.current = along(live.current.axis, event)
    latest.current = origin.current
    start.current = live.current.onStart()
    dragging.current = true
  }, [])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return
    // Capture is what keeps the moves coming once the pointer leaves this 1px
    // line — the whole point of the gesture — so a move without it belongs to
    // another pointer, or to a capture that has already been lost.
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    latest.current = along(live.current.axis, event)
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      live.current.onDrag(implied())
    })
  }, [])

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    latest.current = along(live.current.axis, event)
    settle(event.currentTarget, event.pointerId, true)
  }, [])

  // The end that is not a release: the pointer was cancelled, or the capture was
  // taken away. Neither is a size the reader chose, so the page is put back.
  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return
    settle(event.currentTarget, event.pointerId, false)
  }, [])

  return (
    <div
      className={uiClass('resize')}
      data-axis={props.axis}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
    />
  )
}
