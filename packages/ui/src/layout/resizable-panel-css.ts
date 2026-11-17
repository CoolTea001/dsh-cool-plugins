/**
 * The stylesheet half of a resizable panel, generated from the same bounds.
 *
 * A drag and a stylesheet that disagreed about the narrowest sidebar would be a
 * divider that stops where the pointer does not. Every page used to restate
 * those bounds in two places — the clamp in TypeScript and three literals in a
 * rule — with a comment promising they matched. Here they cannot disagree,
 * because both are read from one {@link PanelBounds}.
 *
 * What the rule says, and why each part earns its keep:
 *
 * - `width: var(--the-property, fallback)` — the drag writes the property on the
 *   page root, and the fallback is what the first frame draws before a saved
 *   size is published, so the page never opens at zero width and jumps.
 * - `min-width` — the floor the pointer cannot cross, restated for the frames
 *   when no drag is running: a size saved in a wide window, or a page opened in
 *   a narrow one.
 * - `max-width: min(cap, 100% - neighbour's floor)` — the same two bounds the
 *   clamp applies, as CSS. It is what keeps a window narrowed *after* a drag
 *   from squeezing the neighbouring pane past its own floor.
 * - `flex: none` — a sidebar is a width the reader chose, not a share of the
 *   row; the neighbour takes every pixel left over.
 * - `min-height: 0` — the frame the page hands this box is a fixed height, and
 *   without the floor a list inside it would stretch the column instead of
 *   scrolling.
 *
 * The rule paints nothing: the seam, the surface and the page's own stacking are
 * the caller's, appended through `declarations`. A shared rule that painted a
 * surface would be the thing that covers a theme's wallpaper.
 *
 * This is the factory for a boundary measured in **pixels**. A split between
 * stacked panes is saved as a share and drawn through two `flex-grow` properties,
 * so its rule states its own geometry — the numbers it needs are a fraction of a
 * track, and `min-width` has no meaning for it.
 */

import type { PanelBounds } from './resizable-panel.js'

/** What {@link resizablePanelCss} takes. */
export interface ResizablePanelCssOptions {
  /** The custom property the size is drawn from, e.g. `--dsh-cf-side-width`. */
  readonly property: `--${string}`
  /** The same floor, cap, fallback and neighbour floor the drag clamps against. */
  readonly bounds: PanelBounds
  /**
   * Further declarations, appended verbatim.
   *
   * The seam (`border-right`), the transparency and anything page-specific
   * belong to the page: this rule is the geometry every sidebar shares.
   */
  readonly declarations?: string
}

/**
 * Build the geometry rule for one resizable panel.
 *
 * The result is one selector and one declaration block, meant to be appended to
 * the consuming plugin's own stylesheet — which is where the seam and the
 * surface live. Nothing here is inserted by this package: `insertPluginStyles`
 * owns the tag, and a second tag would be a second thing to leak.
 *
 * @param selector - the panel's own class, including the leading dot.
 * @param options - the property to draw, the shared bounds, the unit, extra declarations.
 * @returns one CSS rule.
 */
export function resizablePanelCss(selector: string, options: ResizablePanelCssOptions): string {
  const { property, bounds, declarations = '' } = options
  const ceiling = `min(${bounds.max}px,calc(100% - ${bounds.mainMin}px))`
  return `${selector}{position:relative;flex:none;display:flex;flex-direction:column;`
    + `box-sizing:border-box;min-height:0;`
    + `width:var(${property},${bounds.fallback}px);`
    + `min-width:${bounds.min}px;max-width:${ceiling};`
    + `${declarations}}`
}
