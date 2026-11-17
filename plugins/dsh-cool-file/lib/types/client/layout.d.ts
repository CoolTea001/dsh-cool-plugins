/**
 * The Files page's resizable boundary, and the width it remembers.
 *
 * The page is a fixed sidebar beside an absorbing preview pane, and the reader
 * sets the sidebar's width by dragging its right edge. That width is a preference
 * for a window — not workspace state — so it is kept in localStorage under this
 * plugin's own key, the way the Terminal and Git tabs keep theirs.
 *
 * Every bound is stated once, here, and `styles.ts` interpolates these constants
 * into the rules that enforce them at rest. A drag and a stylesheet that disagreed
 * about the narrowest sidebar would be a divider that stops where the pointer does
 * not; two numbers in two files would drift.
 *
 * A drag never renders React. The pointer writes the width to the page root's own
 * custom property — `--dsh-cf-side-width` — and only the release records one
 * layout, into the page's state and localStorage together. That keeps the frame
 * rate of a drag independent of how many file rows the page happens to be
 * drawing; DSH's own transcript width handle makes the same trade for the same
 * reason.
 */
/** The sidebar's width until it is dragged. */
export declare const SIDE_DEFAULT = 300;
/**
 * The narrowest the sidebar may be drawn.
 *
 * The header sets this floor rather than the list does: the workspace name has to
 * keep a readable run before Refresh, which is fixed, so a sidebar narrower than
 * this would ellipsize the name to nothing.
 */
export declare const SIDE_MIN = 220;
/** The widest a drag may leave the sidebar, however wide the window is. */
export declare const SIDE_MAX = 560;
/** The narrowest the preview pane may be drawn, whatever the sidebar asks for. */
export declare const PREVIEW_MIN = 320;
/** The one size the page remembers between visits. */
export interface FileLayout {
    /** The sidebar's width, in CSS pixels. */
    readonly sideWidth: number;
}
/** The layout of a page nobody has resized. */
export declare const DEFAULT_LAYOUT: FileLayout;
/** The saved layout, with every unusable field replaced by its default. */
export declare function readLayout(): FileLayout;
/** Record the layout. A storage that refuses the write is not worth surfacing. */
export declare function writeLayout(layout: FileLayout): void;
/**
 * Clamp a preferred sidebar width to what this page can draw.
 *
 * @param preferred - the width the pointer, or the saved layout, asks for.
 * @param available - the page's width, in CSS pixels.
 * @returns the width to draw.
 */
export declare function clampSideWidth(preferred: number, available: number): number;
//# sourceMappingURL=layout.d.ts.map