/**
 * A scroll container whose bar belongs to the pointer, not to the pane.
 *
 * The shell's lists already behave this way: the thumb is bound to `transparent`
 * and rebound while the pointer is inside, so the bar arrives with the pointer
 * and leaves with it. What this component adds is the leaving delay — the bar
 * stays for `hideDelay` seconds after the last reason to show it, because a
 * pointer crossing a boundary on its way to a row should not make a stripe blink
 * in and out of the pane. Since the bar is the same width hidden or shown, the
 * rows never shift as the pointer crosses the edge.
 *
 * It also owns the two geometry facts a plugin kept restating by hand:
 *
 * - **Which axes may scroll.** A vertical list that paints a horizontal bar for
 *   an overflowing pixel says a gesture exists with nothing behind it, so the
 *   axis is a decision rather than a side effect of `overflow:auto`.
 * - **How wide and how opaque the bar is.** Both are custom properties on the
 *   port, and the platform's own scrollbar rules read them, so a resized bar is
 *   still the platform's bar — same pill shape, same track, same hover token —
 *   rather than a second scrollbar drawn from `::-webkit-scrollbar` rules that
 *   would drift from every other scroller in the app.
 *
 * The visible consequence worth knowing: a caller that hides the bar to zero
 * width on a platform without custom scrollbars (Firefox) gets `scrollbar-width:
 * thin` from the platform instead, because that engine has no pixel width to
 * set. Everything else — colour, opacity, delay, direction — is engine-neutral.
 */

import { forwardRef, type HTMLAttributes, type ReactElement } from 'react'
import { Scrollport, type PanelScrollDirection } from './scrollport.js'

/** What {@link PanelScroll} takes. */
export interface PanelScrollProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * Which axes the port scrolls on.
   *
   * `none` clips instead of scrolling, which is the right answer for a pane that
   * must not move but whose content is taller than its box.
   *
   * @default 'both'
   */
  readonly direction?: PanelScrollDirection
  /**
   * The thumb's alpha, 0..1.
   *
   * Applied to the platform's thumb token rather than to the element, so a theme
   * that retints its scrollbars still reaches this pane. `0` keeps the bar's
   * box — and so the layout — while painting nothing.
   *
   * @default 1
   */
  readonly barOpacity?: number
  /**
   * The bar's width, in CSS pixels.
   *
   * @default 6
   */
  readonly barWidth?: number
  /**
   * Seconds the bar stays after the pointer leaves.
   *
   * `0` means the bar leaves with the pointer. A touch or momentum scroll shows
   * it for the gesture and then lets it go.
   *
   * @default 1
   */
  readonly hideDelay?: number
}

/**
 * Render a panel that scrolls, with a bar that follows the pointer.
 *
 * @param props - the scroll behaviour, plus any attribute a `div` takes.
 * @returns the scrollport element.
 */
export const PanelScroll = forwardRef<HTMLDivElement, PanelScrollProps>(function PanelScroll(
  props,
  ref,
): ReactElement {
  return <Scrollport {...props} ref={ref} />
})

// The direction union is re-exported next to the component that consumes it, so
// a caller importing only this file still names the type it needs.
export type { PanelScrollDirection } from './scrollport.js'
