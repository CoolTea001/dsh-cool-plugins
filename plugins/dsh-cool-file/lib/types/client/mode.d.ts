/**
 * The preview/editor switch: what the Files tab does with the open file, and the
 * menu in the preview header that picks it.
 *
 * The choice belongs to the reader, not to one file, so it is saved like the
 * hidden-entries toggle: the next visit opens in the mode this one was left in.
 * `preview` draws the syntax-coloured, read-only page; `editor` keeps the same
 * page and puts a caret in it.
 *
 * The list is the shell's own `Menu` rather than a popover of this page's
 * invention: its card, its row metrics, its keyboard walk, its outside-click and
 * its focus return are the ones every other dropdown in the window has, so this
 * one matches them instead of approximating them. The module is supplied by the
 * platform (see `neverBundle` in `tsdown.config.ts`), never inlined: a second
 * copy of the shell's primitives would bring a second set of styles.
 */
import { type ReactElement } from 'react';
import type { Translate } from './locales.js';
/** What the page does with the open file. */
export type FilesMode = 'preview' | 'editor';
/**
 * The saved mode; `preview` until the reader says otherwise.
 *
 * Preview is the safe default: it is what the tab did before the editor existed,
 * and it cannot change a file by being looked at.
 *
 * @returns the mode to open in.
 */
export declare function readMode(): FilesMode;
/**
 * Save the reader's choice of mode.
 *
 * @param mode - the mode now active.
 */
export declare function writeMode(mode: FilesMode): void;
/** Props of the header's mode menu. */
interface ModeMenuProps {
    /** The mode currently active. */
    readonly mode: FilesMode;
    /** Called with the mode the reader picked. */
    readonly onSelect: (mode: FilesMode) => void;
    /** The page's translate seat. */
    readonly t: Translate;
}
/**
 * The header's Preview/Editor dropdown.
 *
 * @param props - the active mode, the picker, and the copy.
 * @returns the shell menu, anchored on this page's own trigger button.
 */
export declare function ModeMenu({ mode, onSelect, t }: ModeMenuProps): ReactElement;
export {};
//# sourceMappingURL=mode.d.ts.map