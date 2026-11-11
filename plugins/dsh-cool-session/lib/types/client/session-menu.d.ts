/**
 * The native Session menu's delete row and its confirmation overlay.
 *
 * The row is contributed to `sidebar.workspaces.session.menu.item` by builds
 * that have no `contextMenus` service; the client entry registers a plain-data
 * action instead wherever that service exists, because the shipped Archive row
 * is a footer action and only a footer action can follow it. Menus unmount as
 * soon as they close, so either row only records a request; the frame-wide
 * `shell.overlay` entry owns the dialog's state and the Host call. That split is
 * also what lets the dialog survive the menu's portal disappearing on click.
 *
 * Deletion is permanent, so the confirmation is the only path: it asks before
 * the Host stops running work and removes the artifacts, and disables itself
 * while that happens.
 */
import { type ReactElement } from 'react';
import type { Translate } from './locales.js';
/**
 * Open the delete confirmation for one Session.
 *
 * @param sessionId - the Session the menu row belongs to.
 */
export declare function requestDeleteSession(sessionId: string): void;
/** Dismiss the confirmation without deleting. */
export declare function clearDeleteRequest(): void;
/**
 * Stop drawing the legacy Slot row.
 *
 * The client entry installs that row when `apply` runs before `contextMenus` is
 * mounted; the service then contributes Delete as a footer action so it can
 * follow Archive. This flag keeps the two paths from drawing the row twice.
 */
export declare function retireLegacyDeleteRow(): void;
/** The menu row's owner share and the slot's menu-open hook. */
interface DeleteMenuItemProps {
    readonly sessionId: string;
    readonly useMenuOpenState: () => readonly [boolean, (open: boolean) => void];
    readonly t: Translate;
}
/**
 * The legacy delete row for builds without `contextMenus`, placed after Copy
 * Session ID and separated from the shipped group. Selecting it closes the menu
 * and raises the confirmation overlay.
 *
 * @param props - the row identity, menu hook, and locale seat.
 * @returns the menu row, or null once the menu service owns it.
 */
export declare function SessionDeleteMenuItem({ sessionId, useMenuOpenState, t, }: DeleteMenuItemProps): ReactElement | null;
/** The dialog's injected callback, supplied by the client entry. */
interface DeleteDialogProps {
    readonly t: Translate;
    /** Called after a successful deletion so the shell can clear its main view. */
    readonly onDeleted?: (sessionId: string) => void;
}
/**
 * The frame-wide confirmation entry, drawn with DSH's own `Modal` primitive so
 * its chrome, blurred mask, focus trap, and Escape handling match the rest of
 * the product instead of being re-implemented here.
 *
 * @param props - the locale seat and the post-delete callback.
 * @returns the dialog, or null while no delete is pending.
 */
export declare function SessionDeleteDialog({ t, onDeleted }: DeleteDialogProps): ReactElement | null;
export {};
//# sourceMappingURL=session-menu.d.ts.map