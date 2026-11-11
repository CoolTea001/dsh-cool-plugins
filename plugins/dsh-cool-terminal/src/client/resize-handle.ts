/**
 * Pointer gesture for the terminal sidebar's right edge.
 *
 * A drag does not render React: the owner writes each width to the page root,
 * and only a completed gesture records it. Pointer capture keeps events coming
 * after the pointer leaves the 1px boundary. One queued animation frame holds
 * only the latest coordinate; a release uses that coordinate directly instead
 * of waiting for a frame that would draw an obsolete width.
 */

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'

/** Coordinates and starting width for the active pointer gesture. */
interface Gesture {
  readonly pointerId: number
  readonly origin: number
  readonly start: number
  latest: number
}

export interface ResizeHandleProps {
  /** The width the page is drawing as the gesture starts, in CSS pixels. */
  readonly onStart: () => number
  /** Draw the width the pointer now implies. Called at most once a frame. */
  readonly onDrag: (width: number) => void
  /** Record and draw the width the gesture settled on. */
  readonly onCommit: (width: number) => void
  /** The gesture ended without a width: draw the recorded layout again. */
  readonly onEnd: () => void
}

/** The draggable boundary; its stylesheet supplies the wider hit target. */
export function ResizeHandle(props: ResizeHandleProps): ReactElement {
  const gesture = useRef<Gesture | null>(null)
  const frame = useRef<number | null>(null)
  // The handlers outlive the render that started a gesture. Read their current
  // callbacks so a console reconnect cannot leave a drag with stale ones.
  const live = useRef(props)
  live.current = props

  const cancelFrame = (): void => {
    if (frame.current === null) return
    cancelAnimationFrame(frame.current)
    frame.current = null
  }

  useEffect(() => cancelFrame, [])

  /** End the gesture, either committing its latest width or restoring layout. */
  const settle = (event: ReactPointerEvent<HTMLDivElement>, commit: boolean): void => {
    const active = gesture.current
    if (active === null || active.pointerId !== event.pointerId) return
    const element = event.currentTarget
    gesture.current = null
    element.toggleAttribute('data-dragging', false)
    if (element.hasPointerCapture(active.pointerId)) element.releasePointerCapture(active.pointerId)
    cancelFrame()
    if (commit && active.latest !== active.origin) {
      live.current.onCommit(active.start + active.latest - active.origin)
    } else {
      live.current.onEnd()
    }
  }

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    // A right-click opens a context menu; a middle-click pastes or autoscrolls.
    if (event.button !== 0 || gesture.current !== null) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.toggleAttribute('data-dragging', true)
    gesture.current = {
      pointerId: event.pointerId,
      origin: event.clientX,
      latest: event.clientX,
      start: live.current.onStart(),
    }
  }, [])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    const active = gesture.current
    if (active === null || active.pointerId !== event.pointerId) return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    active.latest = event.clientX
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      if (gesture.current !== active) return
      live.current.onDrag(active.start + active.latest - active.origin)
    })
  }, [])

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    const active = gesture.current
    if (active === null || active.pointerId !== event.pointerId) return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    active.latest = event.clientX
    settle(event, true)
  }, [])

  // A cancelled pointer or lost capture is not a width the user chose.
  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    settle(event, false)
  }, [])

  return createElement('div', {
    className: 'dsh-ct-resize',
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
  })
}
