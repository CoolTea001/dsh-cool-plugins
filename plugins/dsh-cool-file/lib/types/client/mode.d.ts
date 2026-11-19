/**
 * The reader preferences and the two More menus: the file header's and the
 * workspace tree's.
 *
 * Preview/editor and wrap/no-wrap are two independent choices, so each selected
 * row carries the shell's check. The header's menu replaces a pair of icon
 * buttons that a 36px bar could not grow beside; the sidebar's does the same for
 * Refresh and the hidden-entries eye, and its one check marks the eye as on.
 *
 * Both menus draw through the shell's `Menu`, which owns the anchored card, the
 * keyboard walk, Escape, and focus return. Neither passes `compact`: the default
 * row metrics are what the rest of this page's menus use.
 */
import { type ReactNode } from 'react';
import type { Translate } from './locales.js';
/** What the page does with the open file. */
export type FilesMode = 'preview' | 'editor';
/** Read the saved mode, defaulting to the non-mutating preview. */
export declare function readMode(): FilesMode;
/** Remember the reader's preview/editor preference. */
export declare function writeMode(mode: FilesMode): void;
/** Read whether long source lines wrap, which they do by default. */
export declare function readWrap(): boolean;
/** Remember whether long source lines wrap. */
export declare function writeWrap(wrap: boolean): void;
interface FileMenuProps {
    readonly mode: FilesMode;
    readonly editable: boolean;
    readonly wrap: boolean;
    readonly canCopy: boolean;
    readonly canWrap: boolean;
    readonly copied: boolean;
    readonly onSelectMode: (mode: FilesMode) => void;
    readonly onSelectWrap: (wrap: boolean) => void;
    readonly onCopy: () => void;
    readonly t: Translate;
}
/** The header's More menu: how the pane draws the file, and copying it. */
export declare function FileMenu(props: FileMenuProps): ReactNode;
interface TreeMenuProps {
    /** Whether entries the system hides are drawn, which the check marks. */
    readonly showHidden: boolean;
    /** Whether a re-read of the root and every open branch is in flight. */
    readonly refreshing: boolean;
    readonly onRefresh: () => void;
    readonly onToggleHidden: () => void;
    readonly t: Translate;
}
/**
 * The workspace tree's More menu.
 *
 * Refresh is a command and the eye is a checked option, so the two sit either
 * side of one rule: the menu states the action once at the top and lets the
 * check below say what the tree is currently doing. Refresh is disabled while the
 * root is still being read, which is the same guard the button it replaced had.
 */
export declare function TreeMenu(props: TreeMenuProps): ReactNode;
export {};
//# sourceMappingURL=mode.d.ts.map