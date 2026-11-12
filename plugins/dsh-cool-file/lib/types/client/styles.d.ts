/**
 * Package-owned stylesheet for the Files tab.
 *
 * Four jobs live here.
 *
 * 1. The Conversation shell keeps its composer seat mounted for every View, so
 *    the Files page removes it. The handle the View root declares —
 *    `data-conversation-composer-overlay` — is the shell's own opt-in and drops
 *    the transcript width handles; the seat itself is hidden by this rule and by
 *    the mounted View (`chrome.ts`), so the seat is gone on every frame the
 *    shell paints, not only after the mount effect has run. The selector is
 *    scoped by this plugin's own root class, which exists only while the Files
 *    tab is mounted: Chat, Trajectory, Terminal and Git keep their composer
 *    untouched, and the rule disappears with the View.
 *
 * 2. The page itself: a sidebar drawing the workspace as one expandable tree
 *    beside an absorbing preview pane. Every color is a `--dsw-*` theme token, so
 *    the tab follows the active light or dark appearance — including third-party
 *    theme presets — instead of forcing a palette of its own.
 *
 * 3. The draggable boundary between them: the sidebar's width is a custom
 *    property the page publishes, and the handle on its right edge lights up
 *    under the pointer. The bounds are imported from `layout.tsx` rather than
 *    restated, so the width a drag may reach and the width a rule allows cannot
 *    drift apart.
 *
 * 4. The wallpaper hand-off. `dsh-cool-theme` paints a fixed image behind the
 *    shell and marks the document with `ct-bg-on` while it is mounted; the page
 *    then rebinds the two canvas tokens it paints with, so the image shows
 *    through this tab exactly as it does through Chat and Git. Without the
 *    theme, or with its wallpaper off, the selector never matches and the tab
 *    keeps its opaque canvas.
 */
/** Class the Files View renders on its root; the stylesheet's only anchor. */
export declare const FILES_ROOT_CLASS = "dsh-cf-root";
/**
 * Insert this plugin's stylesheet once and hand back its disposer.
 *
 * @returns the function that removes the element again.
 */
export declare function insertFilesStyles(): () => void;
//# sourceMappingURL=styles.d.ts.map