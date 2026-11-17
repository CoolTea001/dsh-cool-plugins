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
export declare const LAYOUT_KEY = "dsh-cool-file.layout.v1";
/**
 * The sidebar's bounds, as the shared package wants them.
 *
 * Read by the drag (which clamps against it), by the stylesheet (which builds
 * `min-width` and `max-width` from it), and by the hook (which falls back to it
 * when nothing usable is stored).
 */
export declare const SIDE_BOUNDS: {
    fallback: number;
    min: number;
    max: number;
    mainMin: number;
};
/** Where the width is remembered. A storage that refuses the write is not worth surfacing. */
export declare const SIDE_STORE: {
    key: string;
};
//# sourceMappingURL=layout.d.ts.map