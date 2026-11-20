/**
 * The reader preference the sidebar's title bar sets: whether it lists every
 * workspace or only the ones that hold a console.
 *
 * It is a window preference rather than workspace state — it says how this
 * reader wants to see the column, not what the column contains — so it is kept
 * in localStorage beside the sidebar width (see `layout.ts`), under this
 * plugin's own key.
 *
 * Storage that refuses the write is not worth surfacing: the preference still
 * holds for as long as the page is open, which is what `read*` falling back to
 * the default already covers for the next load.
 */
/**
 * Read the preference: whether every workspace is listed.
 *
 * The default is on, and it matters more than a default usually does: with it
 * off, a workspace that holds no console draws no row at all, and the row is
 * where its own ＋ lives — so hiding empty workspaces by default would hide the
 * one control a new user needs to create their first console. The title bar's
 * `新增终端` still reaches every workspace either way, but the column should not
 * start out looking emptier than it is.
 *
 * @returns true to list every workspace; false to hide the ones with no console.
 */
export declare function readShowAll(): boolean;
/** Remember the preference. Storage that refuses the write is not surfaced. */
export declare function writeShowAll(showAll: boolean): void;
//# sourceMappingURL=sidebar-prefs.d.ts.map