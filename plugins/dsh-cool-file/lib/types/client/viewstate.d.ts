/**
 * The Files page's memory of how one workspace was being browsed.
 *
 * The shell renders exactly one conversation View at a time, so switching to
 * another tab unmounts this page, and switching back mounts a new instance of
 * it. Without a memory that mount is a cold start: a bare root, every folder
 * closed and an empty preview, however carefully the reader had arranged the
 * tree before they looked away. The shape of the browsing — which folders are
 * open, which file is on screen — is therefore kept where the next mount can
 * find it.
 *
 * Three layers, the same trade `dsh-cool-git`'s cache makes:
 *
 *   1. a module-level map, which outlives the unmount and is what makes a tab
 *      switch paint the tree the reader left at once;
 *   2. one `localStorage` entry per workspace root, which outlives a page
 *      reload and is read before the first paint;
 *   3. one `localStorage` alias per session, which is how a mount that has not
 *      asked the Host anything yet learns which workspace root to look for.
 *
 * Nothing read from disk is remembered. An entry holds paths and nothing else:
 * every restored branch and every restored file is read again from the Host, so
 * a tree that comes back is the workspace as it is now, drawn in the shape it
 * was left in. Unsaved editor drafts are deliberately not stored either — an
 * edit the reader has not saved belongs to the page that holds it.
 *
 * Keys are the workspace's absolute root, not the session's: every session in
 * one workspace browses the same directory tree, so one entry serves them all.
 * The alias is what a mount uses to find that entry before the Host has named
 * the root.
 *
 * Nothing here throws. `localStorage` may be refused (quota, a sandboxed frame,
 * a browser that will not store) and a stored entry may be damaged, hand-edited
 * or written by an earlier revision of this plugin, so every read is treated as
 * data rather than trusted and every write is allowed to fail: persistence is a
 * convenience, never a precondition.
 */
/** What one workspace remembers about how it was being browsed. */
export interface FilesViewState {
    /** The folders drawn open, by workspace path, in the order they were opened. */
    readonly expanded: readonly string[];
    /** The file on screen, or null when the preview pane held no file. */
    readonly selected: string | null;
}
/** One workspace's browsing shape, with the root it was saved under. */
export interface RestoredViewState extends FilesViewState {
    /** The absolute workspace root the shape belongs to. */
    readonly root: string;
}
/**
 * The browsing shape a session's workspace was left in, if there is one.
 *
 * The alias answers before the Host does: a session that has opened this tab
 * before names its workspace root from `localStorage`, so a reloading page finds
 * the saved shape during its first render rather than after a network round
 * trip. A session no mount has seen answers null, and that mount starts exactly
 * as it did before this memory existed.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the saved shape with its root, or null when there is none.
 */
export declare function readViewState(sessionId: string | undefined): RestoredViewState | null;
/**
 * The browsing shape one workspace root was left in, whatever session asks.
 *
 * A session that has never opened this tab has no alias yet, so
 * {@link readViewState} cannot answer for it before the Host names the
 * directory. Once the first listing does name it, this is the workspace's own
 * shape — shared by every session in that workspace, exactly as the shape is
 * keyed — and the page may adopt it if the reader has not started arranging
 * anything themselves.
 *
 * @param root - the workspace's absolute root.
 * @returns the saved shape, or null when this workspace has none.
 */
export declare function readWorkspaceViewState(root: string): FilesViewState | null;
/**
 * Remember the shape one workspace is being left in.
 *
 * Called for every change of the two facts the shape is made of, so what is
 * stored is always the tree as it was last drawn. The root is required: a page
 * that has not yet been told which directory it is browsing has nothing to
 * attribute a shape to, and writing one under a guessed key would hand another
 * workspace this one's tree.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @param root - the workspace's absolute root, as the Host named it.
 * @param state - the folders that are open and the file on screen.
 */
export declare function writeViewState(sessionId: string | undefined, root: string, state: FilesViewState): void;
//# sourceMappingURL=viewstate.d.ts.map