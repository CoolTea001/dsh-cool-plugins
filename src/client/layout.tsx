/**
 * The Files page's resizable boundary, and the width it remembers.
 *
 * The page is a fixed sidebar beside an absorbing preview pane, and the reader
 * sets the sidebar's width by dragging its right edge. That width is a preference
 * for a window — not workspace state — so it is kept in localStorage under this
 * plugin's own key, the way the Terminal and Git tabs keep theirs.
 *
 * Every bound is stated once, here, and `styles.ts` interpolates these constants
 * into the rules that enforce them at rest. A drag and a stylesheet that disagreed
 * about the narrowest sidebar would be a divider that stops where the pointer does
 * not; two numbers in two files would drift.
 *
 * A drag never renders React. The pointer writes the width to the page root's own
 * custom property — `--dsh-cf-side-width` — and only the release records one
 * layout, into the page's state and localStorage together. That keeps the frame
 * rate of a drag independent of how many file rows the page happens to be
 * drawing; DSH's own transcript width handle makes the same trade for the same
 * reason.
 */

import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type ReactElement } from 'react'

/** The localStorage entry holding the sidebar width, as one JSON object. */
const LAYOUT_KEY = 'dsh-cool-file.layout.v1'

/** The sidebar's width until it is dragged. */
export const SIDE_DEFAULT = 300

/**
 * The narrowest the sidebar may be drawn.
 *
 * The header sets this floor rather than the list does: the workspace name has to
 * keep a readable run before Refresh, which is fixed, so a sidebar narrower than
 * this would ellipsize the name to nothing.
 */
export const SIDE_MIN = 220

/** The widest a drag may leave the sidebar, however wide the window is. */
export const SIDE_MAX = 560

/** The narrowest the preview pane may be drawn, whatever the sidebar asks for. */
export const PREVIEW_MIN = 320

/** The one size the page remembers between visits. */
export interface FileLayout {
  /** The sidebar's width, in CSS pixels. */
  readonly sideWidth: number
}

/** The layout of a page nobody has resized. */
const DEFAULT_LAYOUT: FileLayout = { sideWidth: SIDE_DEFAULT }

/**
 * The saved layout, with every part that is missing or unusable replaced by its
 * default.
 *
 * A saved value was written in another window size, by another version of this
 * page, in a browser that may not give the entry back at all, so it is read as
 * data rather than trusted: the width has to be a positive finite number, and
 * anything else — an unreadable entry, a JSON error, a field of the wrong shape —
 * falls back to the default.
 *
 * @returns the layout to draw, always usable.
 */
export function readLayout(): FileLayout {
  let raw: string | null
  try {
    raw = localStorage.getItem(LAYOUT_KEY)
  } catch {
    // Storage is not available to this page (a sandboxed frame, or storage off):
    // the page keeps the default layout for as long as it is open.
    return DEFAULT_LAYOUT
  }
  if (raw === null) return DEFAULT_LAYOUT

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return DEFAULT_LAYOUT
  }
  const saved = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<string, unknown>
  const { sideWidth } = saved
  return {
    sideWidth:
      typeof sideWidth === 'number' && Number.isFinite(sideWidth) && sideWidth > 0
        ? sideWidth
        : DEFAULT_LAYOUT.sideWidth,
  }
}

/**
 * Record the layout.
 *
 * A storage that refuses the write (quota, or third-party storage blocked) is not
 * worth surfacing: no workspace state is involved, and the drag holds for as long
 * as this page is open either way.
 *
 * @param layout - the layout to save.
 */
export function writeLayout(layout: FileLayout): void {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {
    /* persistence is a convenience, never a precondition */
  }
}

/**
 * The widest the sidebar may be drawn in a page this wide.
 *
 * Two bounds at once: the width a sidebar stops being worth dragging past, and
 * what is left of the page once the preview pane keeps its own floor. The
 * sidebar's floor wins when the window cannot hold both, so a narrow window still
 * draws a whole sidebar and leaves the preview to suffer — a sidebar narrower
 * than its own header would have no honest reading at all.
 *
 * @param available - the page's width, in CSS pixels.
 * @returns the widest sidebar to draw.
 */
function sideWidthCeiling(available: number): number {
  return Math.max(SIDE_MIN, Math.min(SIDE_MAX, available - PREVIEW_MIN))
}

/**
 * Clamp a preferred sidebar width to what this page can draw.
 *
 * @param preferred - the width the pointer, or the saved layout, asks for.
 * @param available - the page's width, in CSS pixels.
 * @returns the width to draw.
 */
export function clampSideWidth(preferred: number, available: number): number {
  return Math.min(Math.max(preferred, SIDE_MIN), sideWidthCeiling(available))
}

/**
 * The sidebar's right edge, dragged with the pointer.
 *
 * The gesture is the platform's own width handle (client-ui-conversation's
 * `WidthHandle`): the press captures the pointer and records where it started and
 * the width the page was drawing, each move asks the caller to draw the width the
 * pointer now implies — at most once a frame, since a pointer reports more often
 * than a page paints — and the release records that one number. A press that never
 * moved records nothing, so a click on the boundary cannot overwrite a saved width
 * with the window-clamped width it happens to be drawn at.
 *
 * The two terminal paths mean different things. `onCommit` is a new width to
 * record and draw; `onEnd` is a gesture that produced no width — a click, or a
 * pointer lost mid-drag — and the caller draws the recorded layout again, which is
 * what makes a cancelled drag leave the page exactly as it found it.
 *
 * The element sits on the boundary itself, which is a 1px line a pointer cannot be
 * asked to hold, so the stylesheet puts an invisible band around it and this
 * component owns the line in the middle.
 */
export function ResizeHandle(props: {
  /** The width the page is drawing as the gesture starts, in CSS pixels. */
  readonly onStart: () => number
  /** Draw the width the pointer now implies. Called at most once a frame. */
  readonly onDrag: (width: number) => void
  /** Record and draw the width the gesture settled on. */
  readonly onCommit: (width: number) => void
  /** The gesture is over without a width: draw the recorded layout again. */
  readonly onEnd: () => void
}): ReactElement {
  /** Whether a gesture this component started is still running. */
  const dragging = useRef(false)
  /** The pointer's X where the gesture started. */
  const origin = useRef(0)
  /** The width the page was drawing where the gesture started. */
  const start = useRef(0)
  /** The pointer's latest X. */
  const latest = useRef(0)
  /** The frame awaiting the pointer's latest coordinate, if one is. */
  const frame = useRef<number | null>(null)
  // The handlers are installed once per gesture and outlive the render that
  // started it, so what they call is read from here rather than closed over: a
  // re-render during a drag (a refresh answering, the page picking up a new
  // layout) must not leave the gesture calling a stale callback.
  const live = useRef(props)
  live.current = props

  /** The width the pointer's latest coordinate implies. */
  const implied = (): number => start.current + (latest.current - origin.current)

  const cancelFrame = (): void => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }

  /**
   * End the gesture, and either record a width or re-state the layout.
   *
   * @param element - the handle the gesture was captured on.
   * @param pointerId - the pointer to release.
   * @param moved - whether this release holds a width the pointer chose.
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
    origin.current = event.clientX
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
    latest.current = event.clientX
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      live.current.onDrag(implied())
    })
  }, [])

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    latest.current = event.clientX
    settle(event.currentTarget, event.pointerId, true)
  }, [])

  // The end that is not a release: the pointer was cancelled, or the capture was
  // taken away. Neither is a width the reader chose, so the page is put back.
  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return
    settle(event.currentTarget, event.pointerId, false)
  }, [])

  return (
    <div
      className="dsh-cf-resize"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
    />
  )
}
