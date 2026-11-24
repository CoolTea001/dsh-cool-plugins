/**
 * The tree's row menu — what a right-click on a file or folder offers.
 *
 * The menu is one list for both kinds of row, with the rows that only apply to
 * a folder left out where the target is a file: a file has no children, so
 * "New file" and "New folder" there would create into its parent while looking
 * like they belonged to it. The order is the order of use — rename first, since
 * that is what a right-click on a tree row is almost always for — then the two
 * creations, then the one command that leaves the browser, then the one that
 * destroys.
 *
 * Two facts decide what is drawn enabled, and both come from the Host rather
 * than being guessed here. `writable` is the session's own sandbox policy: a
 * read-only session lists its workspace and refuses every change. `reveal` is
 * whether the serving Host has a desktop file manager that can be handed a path
 * at all. A command that cannot succeed is drawn disabled rather than offered
 * and then failed, and its label says what the gesture means on this platform.
 *
 * The menu is the shell's `Menu` in its contextual mode: it opens at the
 * pointer, is portaled so the tree's own scrollport cannot crop it, keeps the
 * keyboard walk and Escape, and hands focus back to the row it was opened on.
 */
import { type ReactNode } from 'react';
import type { Translate } from './locales.js';
import type { FileEntryType } from '../shared/contract.js';
/** Everything one right-click captured, so an open menu keeps its subject. */
export interface RowTarget {
    /** The entry's workspace path. */
    readonly path: string;
    /** What the entry is, which decides whether the two creations are offered. */
    readonly type: FileEntryType;
    /** Where the pointer was, in client coordinates. */
    readonly x: number;
    /** Where the pointer was, in client coordinates. */
    readonly y: number;
    /** The row element, which takes focus back when the menu closes. */
    readonly element: HTMLElement | null;
    /**
     * Whether this is the workspace root rather than a row inside it.
     *
     * The root is a directory like any other for the two creations and for the
     * reveal, but it is not an entry the tree can rename or delete: renaming it
     * would move the workspace out from under the session, and deleting it would
     * take the workspace with it. Those two rows are therefore left out.
     */
    readonly root?: boolean;
}
/** The commands the menu can run. */
export type RowCommand = 'rename' | 'create-file' | 'create-folder' | 'reveal' | 'delete';
interface RowMenuProps {
    /** The row the menu is open on; null while it is closed. */
    readonly target: RowTarget | null;
    /** Whether the session's policy allows changes to this workspace. */
    readonly writable: boolean;
    /** Whether this Host can show a path in a desktop file manager. */
    readonly reveal: boolean;
    /** Which file manager that would be, when it said. */
    readonly fileManager: 'finder' | 'explorer' | 'directory' | undefined;
    readonly onClose: () => void;
    /** Run one command against the row the menu is open on, which closes it. */
    readonly onCommand: (command: RowCommand, target: RowTarget) => void;
    readonly t: Translate;
}
/**
 * Render the row menu for the row a right-click captured.
 *
 * @param props - the captured target, the two capability facts, and the commands.
 * @returns the anchored contextual menu.
 */
export declare function RowMenu(props: RowMenuProps): ReactNode;
export {};
//# sourceMappingURL=row-menu.d.ts.map