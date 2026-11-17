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
 * Every bound is stated once, here, and `styles.ts` interpolates these constants
 * into the rules that enforce them at rest. A drag and a stylesheet that disagreed
 * about the narrowest sidebar would be a divider that stops where the pointer does
 * not; two numbers in two files would drift.
 *
 * A drag never renders React. The pointer writes the boundary's own custom
 * property on the page root — `--dsh-cg-side-width`, `--dsh-cg-files-grow` and
 * `--dsh-cg-history-grow` — and only the release records one layout, into the
 * page's state and localStorage together. That keeps the frame rate of a drag
 * independent of how many thousand diff rows the page happens to be drawing; DSH's
 * own transcript width handle (client-ui-conversation's `ConversationWidthControls`)
 * makes the same trade for the same reason.
 */

import {
  finiteNumber,
  fraction,
  readLayout as readStoredLayout,
  writeLayout as writeStoredLayout,
} from '@dsh-cool/ui'

/** The localStorage entry holding both boundaries, as one JSON object. */
const LAYOUT_KEY = 'dsh-cool-git.layout.v1'


/**
 * The sidebar's width until it is dragged.
 *
 * The width this page was designed at (see the toolbar rules in `styles.ts`), and
 * the width the stylesheet falls back to for the frames before the saved layout is
 * published.
 */
export const SIDE_DEFAULT = 340

/**
 * The narrowest the sidebar may be drawn.
 *
 * The toolbar sets this floor rather than the lists do: two parts of that row may
 * give ground — the branch's name first, down to the icon alone, and then the
 * Workspace's name — while Refresh beside them is fixed. Shorter than this and both
 * names are gone and that control would run over the sidebar's own edge.
 */
export const SIDE_MIN = 260

/** The widest a drag may leave the sidebar, however wide the window is. */
export const SIDE_MAX = 560

/** The narrowest the Diff pane may be drawn, whatever the sidebar asks for. */
export const DIFF_MIN = 320

/**
 * The shortest either sidebar pane may be drawn.
 *
 * A pane header is 30px and a changed-path row 26px, so this is a header and a
 * couple of rows: the point below which a pane stops being a list. Both the drag
 * and the panes' own `min-height` state it, so a window resized *after* a split was
 * dragged still keeps each pane on screen.
 */
export const PANE_MIN = 96

/**
 * Which way a boundary moves, and so which pointer coordinate drives it.
 *
 * Stated here rather than re-exported from `@dsh-cool/ui`: the package is private
 * and source-only, so a `export ... from '@dsh-cool/ui'` in this file would be
 * emitted into the published `.d.ts` and become an import no consumer can
 * resolve. The two unions are the same two words, and the shared component's
 * props are checked against them, so a drift is a compile error rather than a
 * silent mismatch.
 */
export type ResizeAxis = 'col' | 'row'

/** The two sizes the page remembers between visits. */
export interface GitLayout {
  /** The sidebar's width, in CSS pixels. */
  readonly sideWidth: number
  /** The share of the sidebar's pane track that Changed files takes, from 0 to 1. */
  readonly filesShare: number
}

/** The layout of a page nobody has resized. */
export const DEFAULT_LAYOUT: GitLayout = { sideWidth: SIDE_DEFAULT, filesShare: 0.5 }

/**
 * The stored shape, field by field.
 *
 * Read as data rather than trusted as a fact: a saved value is a preference
 * written in another window size, by another version of this page, in a browser
 * that may not give the entry back at all. Each field is checked on its own, so
 * one bad number costs one field rather than the whole layout. The reading and
 * writing themselves are `@dsh-cool/ui`'s.
 */
const FIELDS = {
  sideWidth: finiteNumber(DEFAULT_LAYOUT.sideWidth),
  filesShare: fraction(DEFAULT_LAYOUT.filesShare),
} as const

/** The saved layout, with every unusable field replaced by its default. */
export function readLayout(): GitLayout {
  return readStoredLayout(LAYOUT_KEY, FIELDS)
}

/** Record the layout. A storage that refuses the write is not worth surfacing. */
export function writeLayout(layout: GitLayout): void {
  writeStoredLayout(LAYOUT_KEY, layout)
}

/**
 * The widest the sidebar may be drawn in a page this wide.
 *
 * Two bounds at once: the width a sidebar stops being worth dragging past, and
 * what is left of the page once the Diff pane keeps its own floor. The sidebar's
 * floor wins when the window cannot hold both, so a narrow window still draws a
 * whole sidebar and leaves the Diff pane to suffer — a sidebar narrower than its
 * own toolbar would have no honest reading at all.
 *
 * @param available - the page's width, in CSS pixels.
 * @returns the widest sidebar to draw.
 */
function sideWidthCeiling(available: number): number {
  return Math.max(SIDE_MIN, Math.min(SIDE_MAX, available - DIFF_MIN))
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
 * The tallest the Changed files pane may be drawn, inside the track it shares
 * with Commit history.
 *
 * A track too short to hold both floors leaves the one pane at its floor, which is
 * the same answer the stylesheet's own `min-height` gives.
 *
 * @param track - the height the two panes share, in CSS pixels.
 * @returns the tallest the upper pane may be.
 */
function splitCeiling(track: number): number {
  return Math.max(PANE_MIN, track - PANE_MIN)
}

/**
 * Clamp a preferred Changed files height to the track it shares with Commit history.
 *
 * @param preferred - the height the pointer asks for, in CSS pixels.
 * @param track - the height the two panes share, in CSS pixels.
 * @returns the height to draw.
 */
export function clampFilesHeight(preferred: number, track: number): number {
  return Math.min(Math.max(preferred, PANE_MIN), splitCeiling(track))
}

/**
 * The share of one track a pane height means.
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
  if (!(track > 0)) return DEFAULT_LAYOUT.filesShare
  const floor = Math.min(PANE_MIN / track, 0.5)
  return Math.min(Math.max(height / track, floor), 1 - floor)
}
