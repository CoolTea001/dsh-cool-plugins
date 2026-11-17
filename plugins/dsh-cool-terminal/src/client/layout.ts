/**
 * The terminal tab's resizable sidebar boundary, and the width it remembers.
 *
 * The tab is a fixed sidebar beside an absorbing console pane, and the reader
 * sets the sidebar's width by dragging its right edge. That width is a
 * preference for a window — not workspace state — so it is kept in localStorage
 * under this plugin's own key, the way the console list and its selection are.
 *
 * Every bound is stated once, here, and `styles.ts` builds its rule from the same
 * object, as does the drag itself (see `@dsh-cool/ui`'s `resizablePanelCss` and
 * `useResizablePanel`). A drag and a stylesheet that disagreed about the
 * narrowest sidebar would be a divider that stops where the pointer does not;
 * the object below is what makes that impossible rather than merely unlikely.
 */

/** The localStorage entry holding the sidebar width, as one JSON object. */
export const LAYOUT_KEY = 'dsh-cool-terminal.layout.v1'

/** The sidebar's width until it is dragged; the column's historical width. */
const SIDE_DEFAULT = 256

/**
 * The narrowest the sidebar may be drawn.
 *
 * The header must keep a readable run for a workspace name between its folder
 * glyph and the add button, and the footer button carries a four-character
 * label, so a narrower column would have to clip both to be honest.
 */
const SIDE_MIN = 220

/** The widest a drag may leave the sidebar, however wide the window is. */
const SIDE_MAX = 560

/** The narrowest the console pane may be drawn, whatever the sidebar asks for. */
const MAIN_MIN = 320

/**
 * The sidebar's bounds, as the shared package wants them.
 *
 * Read by the drag (which clamps against it), by the stylesheet (which builds
 * `min-width` and `max-width` from it), and by the hook (which falls back to it
 * when nothing usable is stored).
 */
export const SIDE_BOUNDS = {
  fallback: SIDE_DEFAULT,
  min: SIDE_MIN,
  max: SIDE_MAX,
  mainMin: MAIN_MIN,
}

/** Where the width is remembered. A storage that refuses the write is not worth surfacing. */
export const SIDE_STORE = { key: LAYOUT_KEY }
