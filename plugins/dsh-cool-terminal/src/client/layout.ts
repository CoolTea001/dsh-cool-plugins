/**
 * The terminal tab's resizable sidebar boundary, and the width it remembers.
 *
 * The tab is a fixed sidebar beside an absorbing console pane, and the reader
 * sets the sidebar's width by dragging its right edge. That width is a
 * preference for a window — not workspace state — so it is kept in
 * localStorage under this plugin's own key, the way the console list and its
 * selection are.
 *
 * Every bound is stated once, here, and `styles.ts` interpolates these
 * constants into the rules that enforce them at rest. A drag and a stylesheet
 * that disagreed about the narrowest sidebar would be a divider that stops
 * where the pointer does not; two numbers in two files would drift.
 *
 * A drag never renders React. The pointer writes the width to the page root's
 * own custom property — `--dsh-ct-side-width` — and only the release records
 * one layout, into the page's state and localStorage together. That keeps the
 * frame rate of a drag independent of how many console rows the sidebar
 * happens to be drawing; DSH's own transcript width handle makes the same trade
 * for the same reason.
 */

/** The localStorage entry holding the sidebar width, as one JSON object. */
const LAYOUT_KEY = 'dsh-cool-terminal.layout.v1'

/** The sidebar's width until it is dragged; the column's historical width. */
export const SIDE_DEFAULT = 256

/**
 * The narrowest the sidebar may be drawn.
 *
 * The header must keep a readable run for a workspace name between its folder
 * glyph and the add button, and the footer button carries a four-character
 * label, so a narrower column would have to clip both to be honest.
 */
export const SIDE_MIN = 220

/** The widest a drag may leave the sidebar, however wide the window is. */
export const SIDE_MAX = 560

/** The narrowest the console pane may be drawn, whatever the sidebar asks for. */
export const MAIN_MIN = 320

/** The one size the page remembers between visits. */
export interface SideLayout {
  /** The sidebar's width, in CSS pixels. */
  readonly sideWidth: number
}

/** The layout of a page nobody has resized. */
const DEFAULT_LAYOUT: SideLayout = { sideWidth: SIDE_DEFAULT }

/**
 * The saved layout, with every part that is missing or unusable replaced by its
 * default.
 *
 * A saved value was written in another window size, by another version of this
 * page, in a browser that may not give the entry back at all, so it is read as
 * data rather than trusted: the width has to be a positive finite number, and
 * anything else — an unreadable entry, a JSON error, a field of the wrong
 * shape — falls back to the default.
 * @returns the layout to draw, always usable.
 */
export function readSideLayout(): SideLayout {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(LAYOUT_KEY)
  } catch {
    // Storage is not available to this page (a sandboxed frame, or storage
    // off): the page keeps the default layout for as long as it is open.
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
 * A storage that refuses the write (quota, or third-party storage blocked) is
 * not worth surfacing: no workspace state is involved, and the drag holds for
 * as long as this page is open either way.
 * @param layout - the layout to save.
 */
export function writeSideLayout(layout: SideLayout): void {
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {
    /* persistence is a convenience, never a precondition */
  }
}

/**
 * The widest the sidebar may be drawn in a page this wide.
 *
 * Two bounds at once: the width a sidebar stops being worth dragging past, and
 * what is left of the page once the console keeps its own floor. The sidebar's
 * floor wins when the window cannot hold both, so a narrow window still draws a
 * whole sidebar and leaves the console to suffer — a sidebar narrower than its
 * own header would have no honest reading at all.
 * @param available - the page's width, in CSS pixels.
 * @returns the widest sidebar to draw.
 */
function sideWidthCeiling(available: number): number {
  return Math.min(SIDE_MAX, Math.max(SIDE_MIN, available - MAIN_MIN))
}

/**
 * Clamp a preferred sidebar width to what this page can draw.
 * @param preferred - the width the pointer, or the saved layout, asks for.
 * @param available - the page's width, in CSS pixels.
 * @returns the width to draw.
 */
export function clampSideWidth(preferred: number, available: number): number {
  return Math.min(Math.max(preferred, SIDE_MIN), sideWidthCeiling(available))
}
