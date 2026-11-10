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
/** The sidebar's width until it is dragged; the column's historical width. */
export declare const SIDE_DEFAULT = 256;
/**
 * The narrowest the sidebar may be drawn.
 *
 * The header must keep a readable run for a workspace name between its folder
 * glyph and the add button, and the footer button carries a four-character
 * label, so a narrower column would have to clip both to be honest.
 */
export declare const SIDE_MIN = 220;
/** The widest a drag may leave the sidebar, however wide the window is. */
export declare const SIDE_MAX = 560;
/** The narrowest the console pane may be drawn, whatever the sidebar asks for. */
export declare const MAIN_MIN = 320;
/** The one size the page remembers between visits. */
export interface SideLayout {
    /** The sidebar's width, in CSS pixels. */
    readonly sideWidth: number;
}
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
export declare function readSideLayout(): SideLayout;
/**
 * Record the layout.
 *
 * A storage that refuses the write (quota, or third-party storage blocked) is
 * not worth surfacing: no workspace state is involved, and the drag holds for
 * as long as this page is open either way.
 * @param layout - the layout to save.
 */
export declare function writeSideLayout(layout: SideLayout): void;
/**
 * Clamp a preferred sidebar width to what this page can draw.
 * @param preferred - the width the pointer, or the saved layout, asks for.
 * @param available - the page's width, in CSS pixels.
 * @returns the width to draw.
 */
export declare function clampSideWidth(preferred: number, available: number): number;
//# sourceMappingURL=layout.d.ts.map