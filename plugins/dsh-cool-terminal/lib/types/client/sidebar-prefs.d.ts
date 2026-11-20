/**
 * The reader preference the sidebar's title bar sets: which workspaces it lists.
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
/** Which workspace groups the sidebar lists. */
export type SidebarFilter = 'all' | 'withTerminals';
/**
 * Read the saved workspace filter.
 *
 * The default lists every workspace, including one the user has not opened a
 * console in yet: the header's ＋ is the way into a fresh group, so hiding
 * empty groups by default would hide the very rows that lead there.
 */
export declare function readFilter(): SidebarFilter;
/** Remember the workspace filter. */
export declare function writeFilter(filter: SidebarFilter): void;
//# sourceMappingURL=sidebar-prefs.d.ts.map