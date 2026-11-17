/**
 * The Git page's two resizable boundaries, and the sizes they remember.
 *
 * The page is a fixed sidebar beside an absorbing Diff pane, and both of its
 * boundaries are the reader's to move: the sidebar's right edge sets its width,
 * and the divider between Changed files and Commit history sets how the column is
 * split. Each boundary is therefore one number — a width in CSS pixels, and the
 * share of the pane track that the changed-path list takes — and neither number is
 * repository state: they are a preference for a window, kept in localStorage under
 * this plugin's own key, the way the Terminal tab keeps its own.
 *
 * Both boundaries are driven by `@dsh-cool/ui`, and the bounds below are the one
 * statement of what each may be: the drag clamps against them, `styles.ts` builds
 * its rules from them, and a saved value is validated by them when it is read.
 * A drag and a stylesheet that disagreed about the narrowest sidebar would be a
 * divider that stops where the pointer does not; there is one object to change.
 *
 * The two boundaries differ in one way, and it is why they are stated separately:
 * a sidebar's width is a preference for the window ("I put it at this width"), so
 * it is saved in pixels; the split divides a track, so it is saved as a share and
 * a window that grows makes both panes longer instead of leaving one at a height
 * that no longer fits.
 */

/** The localStorage entry holding both boundaries, as one JSON object. */
export const LAYOUT_KEY = 'dsh-cool-git.layout.v1'

/**
 * The sidebar's width until it is dragged.
 *
 * The width this page was designed at (see the toolbar rules in `styles.ts`), and
 * the width the stylesheet falls back to for the frames before the saved layout is
 * published.
 */
const SIDE_DEFAULT = 340

/**
 * The narrowest the sidebar may be drawn.
 *
 * The toolbar sets this floor rather than the lists do: two parts of that row may
 * give ground — the branch's name first, down to the icon alone, and then the
 * Workspace's name — while Refresh beside them is fixed. Shorter than this and both
 * names are gone and that control would run over the sidebar's own edge.
 */
const SIDE_MIN = 260

/** The widest a drag may leave the sidebar, however wide the window is. */
const SIDE_MAX = 560

/** The narrowest the Diff pane may be drawn, whatever the sidebar asks for. */
const DIFF_MIN = 320

/**
 * The shortest either sidebar pane may be drawn.
 *
 * A pane header is 30px and a changed-path row 26px, so this is a header and a
 * couple of rows: the point below which a pane stops being a list. Both the drag
 * and the panes' own `min-height` state it, so a window resized *after* a split was
 * dragged still keeps each pane on screen.
 */
const PANE_MIN = 96

/** The sidebar's bounds: a pixel width between a floor and a cap. */
export const SIDE_BOUNDS = {
  fallback: SIDE_DEFAULT,
  min: SIDE_MIN,
  max: SIDE_MAX,
  mainMin: DIFF_MIN,
}

/**
 * The split's bounds.
 *
 * `fallback` and `max` are shares, because that is the unit that is saved;
 * `min` and `mainMin` are pane floors in pixels of the track, because that is
 * the unit the drag clamps in. The share that is saved is derived from the
 * clamped pixel height, so a track too short to hold both floors leaves one pane
 * at its floor rather than at a share that no longer fits.
 */
export const FILES_BOUNDS = {
  fallback: 0.5,
  min: PANE_MIN,
  max: 1,
  mainMin: PANE_MIN,
}

/** Where the sidebar's width is remembered. */
export const SIDE_STORE = { key: LAYOUT_KEY, field: 'sideWidth' }

/** Where the split's share is remembered. */
export const FILES_STORE = { key: LAYOUT_KEY, field: 'filesShare', unit: 'share' } as const

/**
 * The vertical run the two sidebar panes share, below the toolbar row.
 *
 * Measured from the sidebar's own bottom to the changed-path pane's top: the
 * toolbar and the split between the panes take the difference, so this is the
 * only height both panes' shares can be fractions of.
 *
 * @param column - the sidebar, which owns the track.
 * @param first - the upper pane, whose top is where the track starts.
 * @returns the track's height in CSS pixels, or 0 when either box is not mounted.
 */
export function trackHeight(
  column: { readonly current: HTMLElement | null },
  first: { readonly current: HTMLElement | null },
): number {
  const host = column.current
  const upper = first.current
  if (host === null || upper === null) return 0
  return host.getBoundingClientRect().bottom - upper.getBoundingClientRect().top
}

/**
 * The share of the track a pane height means.
 *
 * The share rather than the height is what gets saved: the CSS grows the two panes
 * by their shares, so a split dragged in a short window is still the same split
 * when the window grows, and no window change can leave one pane at a height that
 * no longer fits. A track too short to measure keeps the default split, and the
 * floors keep the answer strictly inside 0–1 whatever the track is.
 *
 * @param height - the Changed files pane's height, in CSS pixels.
 * @param track - the height the two panes share, in CSS pixels.
 * @returns the share to draw and save.
 */
export function shareOf(height: number, track: number): number {
  if (!(track > 0)) return FILES_BOUNDS.fallback
  const floor = FILES_BOUNDS.min
  const wanted = Math.min(Math.max(height, floor), Math.max(floor, track - FILES_BOUNDS.mainMin))
  return Math.min(Math.max(wanted / track, 0.0001), 0.9999)
}
