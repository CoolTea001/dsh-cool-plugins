/**
 * The plugin's icon seats.
 *
 * Every glyph comes from `@dsh-cool/icons`; these wrappers only add the shared
 * `.dsh-ct-svg` seat when a caller does not supply its own class, so existing
 * menu and toolbar layouts keep their 16px square.
 */
import * as React from 'react';
/** Props accepted by the seated icon components. */
export interface DshCtIconProps {
    /** Square edge length in px; the seat's stylesheet normally owns this. */
    size?: number;
    /** Extra class for layout placement; defaults to the shared 16px seat. */
    className?: string;
    /** Accessible name; omitted for the decorative default. */
    title?: string;
}
/** A console's leading mark. */
export declare const IconTerminal: (props: DshCtIconProps) => React.ReactElement;
/** Sidebar group marker when a Workspace is collapsed. */
export declare const IconFolderClosed: (props: DshCtIconProps) => React.ReactElement;
/** Sidebar group marker when a Workspace is expanded. */
export declare const IconFolderOpened: (props: DshCtIconProps) => React.ReactElement;
/** Row overflow trigger glyph. */
export declare const IconMore: (props: DshCtIconProps) => React.ReactElement;
/** Add a console. */
export declare const IconPlus: (props: DshCtIconProps) => React.ReactElement;
/** Rename a console. */
export declare const IconEdit: (props: DshCtIconProps) => React.ReactElement;
/** Command autostart. */
export declare const IconAutostart: (props: DshCtIconProps) => React.ReactElement;
/** Delete a console. */
export declare const IconTrash: (props: DshCtIconProps) => React.ReactElement;
/** Common-commands entry. */
export declare const IconList: (props: DshCtIconProps) => React.ReactElement;
/** Copy a command to the clipboard. */
export declare const IconCopy: (props: DshCtIconProps) => React.ReactElement;
//# sourceMappingURL=icons.d.ts.map