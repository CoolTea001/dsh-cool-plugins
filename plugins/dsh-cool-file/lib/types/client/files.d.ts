/**
 * The Files conversation view.
 *
 * The page is the whole of the tab: a sidebar holding one workspace tree and a
 * preview pane taking every remaining pixel. The tree is expanded in place —
 * opening a folder inserts its children under its own row instead of replacing
 * the list — so the workspace keeps one continuous shape while the reader walks
 * it. Directories are read lazily: the root when the tab mounts, then one
 * directory per folder the reader opens, cached for the life of the page.
 *
 * The page owns no workspace state of its own: every answer is a plain value
 * fetched from the Host over this package's own same-origin routes (see
 * `api.ts`), and the only local state is which folders are open, which children
 * have arrived, whether the entries the system hides are drawn, which file is
 * selected, and which request is in flight.
 *
 * The page is read-only on purpose. It lists entries, expands them, and shows
 * the first page of a text file; it never writes, renames, or deletes. That
 * keeps the Host route a read and the tab safe to leave open.
 *
 * The page is full-bleed, the same way the Terminal and Git tabs are: the root
 * class gives the stylesheet a handle on this subtree, the root declares the
 * shell's composer-overlay hook (which drops the transcript width handles), and
 * the mounted View suppresses the composer seat the shell mounts for every View
 * — see `chrome.ts`.
 */
import { type ReactElement } from 'react';
import type { Translate } from './locales.js';
/**
 * Render the Files tab's body.
 *
 * @param props - the standard conversation-View props; the session id is used,
 *   and `t` is the locale seat the framework hands every entry that declares a
 *   dictionary namespace.
 * @returns the Files page element.
 */
export declare function FilesView(props: {
    readonly sessionId?: unknown;
    readonly t: Translate;
}): ReactElement;
//# sourceMappingURL=files.d.ts.map