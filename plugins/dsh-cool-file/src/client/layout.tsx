/**
 * The Files page's resizable sidebar, and the width it remembers.
 *
 * The page is a fixed sidebar beside an absorbing preview pane, and the reader
 * sets the sidebar's width by dragging its right edge. That width is a preference
 * for a window — not workspace state — so it is kept in localStorage under this
 * plugin's own key, the way the Terminal and Git tabs keep theirs.
 *
 * Every bound is stated once, here, and `styles.ts` builds its rule from the same
 * object, as does the drag itself (see `@dsh-cool/ui`'s `resizablePanelCss` and
 * `useResizablePanel`). A drag and a stylesheet that disagreed about the
 * narrowest sidebar would be a divider that stops where the pointer does not;
 * the object below is what makes that impossible rather than merely unlikely.
 */

/** The localStorage entry holding the sidebar width, as one JSON object. */
export const LAYOUT_KEY = 'dsh-cool-file.layout.v1'

/** The sidebar's width until it is dragged. */
const SIDE_DEFAULT = 300

/**
 * The narrowest the sidebar may be drawn.
 *
 * The header sets this floor rather than the list does: the workspace name has to
 * keep a readable run before Refresh, which is fixed, so a sidebar narrower than
 * this would ellipsize the name to nothing.
 */
const SIDE_MIN = 220

/** The widest a drag may leave the sidebar, however wide the window is. */
const SIDE_MAX = 560

/** The narrowest the preview pane may be drawn, whatever the sidebar asks for. */
const PREVIEW_MIN = 320

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
  mainMin: PREVIEW_MIN,
}

/** Where the width is remembered. A storage that refuses the write is not worth surfacing. */
export const SIDE_STORE = { key: LAYOUT_KEY }
