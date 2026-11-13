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
 * `api.ts`), and the local state is which folders are open, which children have
 * arrived, whether the entries the system hides are drawn, which file is
 * selected, whether the reader is previewing or editing, what drafts they hold,
 * and which request is in flight.
 *
 * Two of those facts — which folders are open and which file is on screen — are
 * the shape of a workspace's browsing rather than a statement about a file, so
 * they are saved per workspace root and drawn again on the next mount (see
 * `viewstate.ts`). The shell renders one View at a time, which means switching
 * tabs unmounts this page; without that memory a return to it would start from a
 * bare root however carefully the tree had been arranged. Only paths are saved:
 * every branch and the selected file are read again from the Host, so the tree
 * that comes back is the workspace as it is now, in the shape it was left in.
 * Unsaved drafts are not saved — an edit the reader has not written to disk
 * belongs to the page holding it.
 *
 * The page reads by default and writes only when asked. It lists entries,
 * expands them, and shows the first page of a text file; the editor — reached
 * through the header's Preview/Editor menu — replaces one file's complete text
 * and nothing else. It never creates, renames or deletes, and a save quotes the
 * freshness token of the read it started from, so a file that moved on is
 * refused instead of overwritten.
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