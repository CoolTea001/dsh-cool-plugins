/**
 * The one scrollport behind both panel components.
 *
 * Every plugin in this repository draws the same pane twice over, and had begun
 * to draw it differently in each place: a list whose bar arrives with the
 * pointer and leaves a moment after it, and a list whose edges dissolve where
 * the content continues. The two are one element in practice — the same div is
 * the scroller, carries the bar's colour and wears the edge mask — so the
 * mechanism lives here once, and `PanelScroll` / `PanelShadow` are two spellings
 * of it with different defaults.
 *
 * Three decisions are worth stating because each one is a bug the naive version
 * has:
 *
 * 1. **The bar's visibility is written to the DOM, not held in React state.**
 *    A scroll event fires far more often than a page paints, and the answer is
 *    one attribute — `data-bar=show` — that the shared stylesheet turns into the
 *    platform's own thumb colour. A hover that re-rendered the rows is a hover
 *    that costs a frame proportional to the list (see the terminal sidebar's
 *    edge-fade effect, which made the same choice).
 *
 * 2. **The departure delay is a timer, not a CSS transition.** The platform's
 *    bar colour is a variable the global scrollbar rules read, and a variable
 *    does not interpolate: the switch is instant either way. So the delay is
 *    the only interesting part — it is what keeps the bar from blinking out
 *    while the pointer crosses a boundary — and a plain timeout states it.
 *
 * 3. **The edge shade is a mask on the scroller, not a veil painted over it.**
 *    That is the terminal sidebar's lesson: a veil in the pane's own surface
 *    colour only works while the pane *is* a surface. Over the canvas — and over
 *    a theme's wallpaper — it is a coloured band sitting on the list. A mask
 *    dissolves the rows and lets whatever is behind them through. The one thing
 *    it must not dissolve is the scrollbar, which lives inside the element's
 *    own painted box, so the mask is sized to stop short of the measured
 *    gutter.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { PANEL_VARS, uiClass } from '../styles/inject.js'

/**
 * Which axes a panel may scroll on.
 *
 * `none` is a clip, not a scroller: content that does not fit is hidden and no
 * gesture can reach it. `both` is the default, and the one a pane should stop
 * to justify — a horizontal bar over a column of rows says a gesture exists
 * that has nothing behind it.
 */
export type PanelScrollDirection = 'none' | 'both' | 'x' | 'y'

/** One axis: the direction an edge shade runs along. */
export type PanelAxis = 'x' | 'y'

/** The bar's width when the caller does not choose one, in CSS pixels. */
const BAR_WIDTH = 6

/** How long the bar lingers after the pointer leaves, in seconds. */
const HIDE_DELAY = 1

/** How far an edge shade reaches into the pane when the caller does not say. */
const SHADE_SIZE = 28

/** The most a bar may be widened to, so a typo cannot swallow the pane. */
const BAR_WIDTH_MAX = 32

/** Whether a value is a direction this component can draw. */
function readDirection(value: PanelScrollDirection | undefined): PanelScrollDirection {
  return value === 'none' || value === 'x' || value === 'y' || value === 'both' ? value : 'both'
}

/**
 * Read a bar opacity.
 *
 * @param value - the caller's number, in 0..1.
 * @returns the value clamped into range, or fully opaque when it is not a number.
 */
function readOpacity(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1
  return Math.min(1, Math.max(0, value))
}

/**
 * Read one length in CSS pixels.
 *
 * @param value - the caller's number.
 * @param fallback - the length used when the value is missing or unusable.
 * @returns a positive length, or the fallback.
 */
function readLength(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback
  return value
}

/**
 * Read the departure delay in seconds.
 *
 * Zero is legal and means the bar leaves with the pointer; a negative or
 * non-finite value falls back to the default rather than turning a timer into an
 * immediate hide through arithmetic nobody meant.
 *
 * @param value - the caller's delay, in seconds.
 * @returns a non-negative delay in seconds.
 */
function readDelay(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return HIDE_DELAY
  return value
}

/** Set a custom property only when it would change, so a scroll frame invalidates as little as possible. */
function setVariable(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) === value) return
  element.style.setProperty(name, value)
}

/** Take every trace of the edge shade back out of the element. */
function clearShade(element: HTMLElement): void {
  element.removeAttribute('data-shade-start')
  element.removeAttribute('data-shade-end')
  element.style.removeProperty(PANEL_VARS.gutterX)
  element.style.removeProperty(PANEL_VARS.gutterY)
}

/**
 * Read the scroller and publish what the shade rules need.
 *
 * The two attributes say which ends hide content, and the two gutter variables
 * say how wide the scrollbars are, so the mask can stop short of them. Gutter
 * variables are written even when the shade axis cannot scroll, because the
 * other axis's bar may still be present.
 *
 * @param element - the scrollport.
 * @param axis - the axis the shade runs along, or null to remove it.
 * @param direction - which axes the port is allowed to scroll on.
 */
function syncShade(
  element: HTMLDivElement,
  axis: PanelAxis | null,
  direction: PanelScrollDirection,
): void {
  if (axis === null) {
    clearShade(element)
    return
  }
  setVariable(element, PANEL_VARS.gutterX, `${element.offsetWidth - element.clientWidth}px`)
  setVariable(element, PANEL_VARS.gutterY, `${element.offsetHeight - element.clientHeight}px`)

  // A pane that cannot scroll on this axis never shades it, even when its
  // content is wider than the box: `overflow-x:hidden` still reports a
  // `scrollWidth` the reader has no gesture to reach.
  const scrollable = axis === 'y'
    ? direction === 'both' || direction === 'y'
    : direction === 'both' || direction === 'x'
  const start = axis === 'y' ? element.scrollTop : element.scrollLeft
  const view = axis === 'y' ? element.clientHeight : element.clientWidth
  const total = axis === 'y' ? element.scrollHeight : element.scrollWidth
  const overflow = scrollable && total - view > 1

  // A pixel of slack on either end absorbs fractional offsets, so a pane
  // scrolled exactly to its end does not keep a shade over the last row.
  element.toggleAttribute('data-shade-start', overflow && start > 1)
  element.toggleAttribute('data-shade-end', overflow && start + view < total - 1)
}

/**
 * Show the bar while the pointer, the keyboard or a scroll gesture is using it.
 *
 * The bar is hidden at rest, which is the shell's own treatment for its lists: a
 * pane that keeps a permanent stripe reads as a different kind of surface. What
 * this adds over the shell's `:hover` rule is the delay — the bar stays for
 * `hideDelay` seconds after the last reason to show it goes away, so crossing a
 * boundary on the way to a row does not make it flicker.
 *
 * @param ref - the scrollport.
 * @param hideDelay - seconds to keep the bar after the last activity.
 */
function useBarVisibility(ref: RefObject<HTMLDivElement | null>, hideDelay: number): void {
  // The handlers are installed once and read the current delay from here, so a
  // page that re-renders with a new delay does not re-install them mid-hover.
  const delay = useRef(hideDelay)
  delay.current = hideDelay

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let hovered = false
    let focused = false

    const clear = (): void => {
      if (timer === null) return
      clearTimeout(timer)
      timer = null
    }
    const show = (): void => {
      clear()
      element.setAttribute('data-bar', 'show')
    }
    const hide = (): void => {
      clear()
      element.removeAttribute('data-bar')
    }
    /** Hide the bar once nobody is using it, after the caller's delay. */
    const settle = (): void => {
      if (hovered || focused) return
      clear()
      const milliseconds = delay.current * 1000
      if (milliseconds <= 0) {
        hide()
        return
      }
      timer = setTimeout(hide, milliseconds)
    }

    const enter = (): void => {
      hovered = true
      show()
    }
    const leave = (): void => {
      hovered = false
      settle()
    }
    const focusIn = (): void => {
      focused = true
      show()
    }
    const focusOut = (event: FocusEvent): void => {
      // Moving between two children of the panel is not leaving the panel: the
      // browser reports the old child's focusout before the new child's focusin,
      // and settling in between would arm a hide the next event has to cancel.
      const next = event.relatedTarget
      if (next instanceof Node && element.contains(next)) return
      focused = false
      settle()
    }
    const scroll = (): void => {
      // A wheel or a touch gesture can outlive the pointer's presence (momentum
      // scrolling), and a keyboard reader cannot hover at all: in both cases the
      // bar is shown for the gesture and then allowed to leave again.
      if (hovered || focused) return
      show()
      settle()
    }

    element.addEventListener('pointerenter', enter)
    element.addEventListener('pointerleave', leave)
    element.addEventListener('focusin', focusIn)
    element.addEventListener('focusout', focusOut)
    element.addEventListener('scroll', scroll, { passive: true })
    return () => {
      element.removeEventListener('pointerenter', enter)
      element.removeEventListener('pointerleave', leave)
      element.removeEventListener('focusin', focusIn)
      element.removeEventListener('focusout', focusOut)
      element.removeEventListener('scroll', scroll)
      clear()
      // A remount must not start with the previous mount's bar on screen.
      element.removeAttribute('data-bar')
    }
  }, [ref])
}

/**
 * Keep the edge shade in step with the scroller.
 *
 * Two sources are needed and neither replaces the other. `scroll` covers the
 * offset in between; `ResizeObserver` covers the box (a window resize, the
 * sidebar's first layout, a scrollbar arriving). A list that grew *without* its
 * box changing is the third case — a row was added, an empty state was replaced
 * — and it arrives as a render, so every commit re-reads too. That is the same
 * arrangement the terminal sidebar's edge fades use, and for the same reason:
 * there is no event for "the content got taller".
 *
 * @param ref - the scrollport.
 * @param axis - the axis the shade runs along, or null for a plain panel.
 * @param direction - which axes the port is allowed to scroll on.
 */
function useEdgeShade(
  ref: RefObject<HTMLDivElement | null>,
  axis: PanelAxis | null,
  direction: PanelScrollDirection,
): void {
  const latest = useRef({ axis, direction })
  latest.current = { axis, direction }

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    let frame: number | null = null
    const run = (): void => {
      frame = null
      syncShade(element, latest.current.axis, latest.current.direction)
    }
    // A scroll reports more often than a page paints; one read a frame is the
    // most the attributes can be worth.
    const schedule = (): void => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(run)
    }

    element.addEventListener('scroll', schedule, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
    observer?.observe(element)
    return () => {
      element.removeEventListener('scroll', schedule)
      if (frame !== null) window.cancelAnimationFrame(frame)
      observer?.disconnect()
      clearShade(element)
    }
  }, [ref])

  // No dependency list on purpose: this is the commit-driven half described
  // above, and the values it reads are only valid for the tree just painted.
  useLayoutEffect(() => {
    const element = ref.current
    if (element !== null) syncShade(element, axis, direction)
  })
}

/** What {@link Scrollport} takes. */
export interface ScrollportProps extends HTMLAttributes<HTMLDivElement> {
  /** Which axes the port scrolls on. Defaults to `both`. */
  readonly direction?: PanelScrollDirection
  /** The thumb's alpha, 0..1. Defaults to 1. */
  readonly barOpacity?: number
  /** The bar's width in CSS pixels. Defaults to 6. */
  readonly barWidth?: number
  /** Seconds the bar stays after the pointer leaves. Defaults to 1. */
  readonly hideDelay?: number
  /** The axis the edge shade runs along, or null/omitted for no shade. */
  readonly shadeAxis?: PanelAxis | null
  /** How far the edge shade reaches, in CSS pixels. Defaults to 28. */
  readonly shadeSize?: number
  readonly children?: ReactNode
}

/**
 * Render the shared scrollport.
 *
 * Not part of the package's public surface: a plugin picks the behaviour it
 * wants by naming `PanelScroll` or `PanelShadow`, and the props that only make
 * sense for one of them stay off the other's type.
 */
export const Scrollport = forwardRef<HTMLDivElement, ScrollportProps>(function Scrollport(
  props,
  ref,
): ReactElement {
  const {
    direction,
    barOpacity,
    barWidth,
    hideDelay,
    shadeAxis = null,
    shadeSize,
    className,
    style,
    children,
    ...rest
  } = props

  const local = useRef<HTMLDivElement | null>(null)
  useBarVisibility(local, readDelay(hideDelay))
  useEdgeShade(local, shadeAxis, readDirection(direction))

  // Two refs, one node: the effects above need the element whether or not the
  // caller asked for one, and a caller that did must still receive it.
  const attach = useCallback(
    (node: HTMLDivElement | null): void => {
      local.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref !== null) ref.current = node
    },
    [ref],
  )

  const variables = {
    [PANEL_VARS.barAlpha]: `${readOpacity(barOpacity) * 100}%`,
    [PANEL_VARS.barWidth]: `${Math.min(BAR_WIDTH_MAX, readLength(barWidth, BAR_WIDTH))}px`,
    ...(shadeAxis === null ? {} : { [PANEL_VARS.shade]: `${readLength(shadeSize, SHADE_SIZE)}px` }),
  } as CSSProperties

  return (
    <div
      {...rest}
      ref={attach}
      className={className === undefined || className === '' ? uiClass('panel') : `${uiClass('panel')} ${className}`}
      // The caller's own inline style is applied first and the panel's
      // variables after it: the variables are what the rules read, so a caller
      // that restated one would be describing a bar this component does not
      // draw. Everything else in the style object passes through untouched.
      style={{ ...style, ...variables }}
      data-scroll={readDirection(direction)}
      // `undefined` removes the attribute, which is how a plain `PanelScroll`
      // opts out of the mask entirely rather than opting in to a no-op one.
      data-shade={shadeAxis ?? undefined}
    >
      {children}
    </div>
  )
})
