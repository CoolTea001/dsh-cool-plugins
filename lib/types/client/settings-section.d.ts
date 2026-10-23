/**
 * The Sessions page of the Settings panel: list, search, filter, selection,
 * archive, and deletion.
 *
 * The list itself is not fetched here. DSH already keeps the Host-authoritative
 * Session catalog and Workspace archive set in the two client stores the shell
 * exposes to every slot (`useSessions` / `useWorkspaces`), and every archive is
 * a Workspace-controller call whose reply updates those stores. Reading them
 * directly means this page shares the sidebar's rows and running states instead
 * of maintaining a second, drifting catalog; deletion is the one operation the
 * client face does not expose, so it still crosses this package's own Host
 * route.
 *
 * Search is deliberately title-only: the row's title is the display title the
 * shell computes (durable title, then project directory name, then id), so the
 * text a reader can see in the row is exactly the text the box matches.
 */
import { type ReactElement } from 'react';
import type { ArchiveResult } from './archive.js';
import { type Translate } from './locales.js';
/** The selector-hook shape DSH hands every slot component. */
type SelectorHook = (selector: (state: any) => any) => any;
/** The section's injected share: the locale seat plus the Host-backed actions. */
export interface SessionsSectionProps {
    readonly t: Translate;
    readonly useSessions: SelectorHook;
    readonly useWorkspaces: SelectorHook;
    /** Archive or restore one Session through the Workspace controller. */
    readonly setArchived?: (sessionId: string, archived: boolean, stopActivity: boolean) => Promise<ArchiveResult>;
    /** Ask the Session catalog to refresh after a deletion. */
    readonly refresh?: () => void;
    /** Clear the shell's main view when its Session disappeared. */
    readonly onDeleted?: (sessionId: string) => void;
}
/**
 * Render the Sessions page.
 *
 * @param props - the locale seat, the two catalog hooks, and the injected actions.
 * @returns the management surface and its confirmations.
 */
export declare function SessionsSection({ t, useSessions, useWorkspaces, setArchived, refresh, onDeleted, }: SessionsSectionProps): ReactElement;
export {};
//# sourceMappingURL=settings-section.d.ts.map