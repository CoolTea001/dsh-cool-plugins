/**
 * A scroll container that dissolves its own edges where content continues.
 *
 * The reference is the terminal sidebar: a column of rows runs under a fixed
 * header and a fixed footer, and the eye needs one quiet signal that there is
 * more list above or below the fold. The signal is not a border and not a
 * shadow painted on the frame — both would be a line that is either always there
 * or always missing, and a static line over a list that fits is a lie. It is a
 * fade that appears only while the edge really hides something, so a list short
 * enough to fit keeps an unmarked first row.
 *
 * ## Why a mask and not a veil
 *
 * The sidebar's first implementation painted a gradient veil in the pane's own
 * surface colour over the rows. That only works while the pane *is* a surface:
 * plugin pages are transparent windows onto whatever the app has behind them —
 * the canvas colour, or a theme's wallpaper — so a veil is a coloured band
 * sitting on the list instead of dissolving it. A `mask-image` on the scroller
 * removes alpha from the rows themselves, and whatever is behind them shows
 * through, the same way the console is a window.
 *
 * The price of a mask is that it also fades the scrollbar, which lives inside
 * the element's own painted box. So the mask is sized to stop short of the
 * measured gutter, in both axes, which is what `--dsh-ui-panel-gutter-x/y` carry.
 *
 * ## Why one axis
 *
 * An edge shade is read as "this column continues", and a pane with shades on
 * both axes is a frame with four soft corners that says nothing in particular.
 * The axis is therefore a single choice, and `y` is the one most panes want: a
 * horizontal strip that overflows is usually better served by eliding its text
 * than by growing a second scroll gesture.
 *
 * The mask is not interpolatable between two gradients, so the switch is instant
 * rather than a fade-in — again the sidebar's finding, and the reason there is
 * no transition in the rules for it.
 */

import { forwardRef, type HTMLAttributes, type ReactElement } from 'react'
import { Scrollport, type PanelAxis, type PanelScrollDirection } from './scrollport.js'

/** What {@link PanelShadow} takes. */
export interface PanelShadowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * The axis whose edges dissolve as the content scrolls.
   *
   * `x` shades the left and right ends of a horizontal strip; `y` shades the top
   * and bottom of a column. Only one may be chosen: see the module comment.
   *
   * @default 'y'
   */
  readonly axis?: PanelAxis
  /**
   * How far the shade reaches in from each edge, in CSS pixels.
   *
   * Matching a row's height makes the dissolve read as a single row rather than
   * a band, which is what the sidebar does.
   *
   * @default 28
   */
  readonly shadeSize?: number
  /**
   * Which axes the port scrolls on.
   *
   * Ordinarily the shade's own axis; it is exposed so a pane can shade `y` while
   * also allowing a horizontal gesture, or clip the shade's axis outright.
   *
   * @default 'both'
   */
  readonly direction?: PanelScrollDirection
  /**
   * The thumb's alpha, 0..1.
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
   * @default 1
   */
  readonly hideDelay?: number
}

/**
 * Render a panel whose edges dissolve while the content continues past them.
 *
 * @param props - the shade's axis and reach, the scroll behaviour, and any
 *   attribute a `div` takes.
 * @returns the scrollport element.
 */
export const PanelShadow = forwardRef<HTMLDivElement, PanelShadowProps>(function PanelShadow(
  { axis = 'y', ...rest },
  ref,
): ReactElement {
  return <Scrollport {...rest} ref={ref} shadeAxis={axis} />
})

// The axis union is re-exported here too, so a caller that only ever draws a
// shaded panel does not have to import the scroll component for one type.
export type { PanelAxis } from './scrollport.js'
