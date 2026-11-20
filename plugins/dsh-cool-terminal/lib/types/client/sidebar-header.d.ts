/**
 * The sidebar's title bar: the column's name, and the one menu that shapes it.
 *
 * The bar is the top seam of the terminal sidebar, above the scrolling
 * workspace list. Its menu collects what used to be scattered across the
 * column — creating a console (`New terminal`, with a workspace chooser as its
 * second level), which workspaces the list shows, whether consoles are drawn as
 * a tree or as cards, and the common-commands dialog that used to have its own
 * footer button. One entry point means the sidebar's footer can go away
 * entirely, and the list gets the whole column.
 *
 * The menu itself is the shell's `Menu`: it owns the anchored card, the child
 * card, the keyboard walk, Escape, and focus return, so this file only decides
 * what the rows are and what choosing one means. It is portaled because the
 * page root clips its overflow, which would crop an in-place card.
 *
 * Both preference groups are independent, so each pair of rows shares one
 * `selectedIds` list: the shell marks whichever row in each group is in force.
 */
import * as React from 'react';
import type { SidebarFilter } from './sidebar-prefs.js';
import type { Translate } from './locales.js';
/** One workspace the "New terminal" child card can offer. */
export interface SidebarGroupOption {
    readonly key: string;
    readonly title: string;
}
export interface SidebarHeaderProps {
    /** Translator for every string the bar and its menu render. */
    readonly t: Translate;
    /** The workspaces a console can be created in, in the column's order. */
    readonly groups: readonly SidebarGroupOption[];
    readonly filter: SidebarFilter;
    readonly onFilter: (next: SidebarFilter) => void;
    /** Create a console in one workspace and reveal it. */
    readonly onNewTerminal: (key: string) => void;
    /** Open the common-commands dialog. */
    readonly onCommands: () => void;
}
/**
 * Render the sidebar's title bar.
 *
 * @param props - the copy, the workspaces, both preferences, and the actions.
 * @returns the header element with its More menu.
 */
export declare function SidebarHeader(props: SidebarHeaderProps): React.ReactElement;
//# sourceMappingURL=sidebar-header.d.ts.map