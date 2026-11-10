/**
 * The per-console Command autostart dialog.
 *
 * Opened from a console row's overflow menu, it edits two things that live on
 * that console's `TerminalDef`: the shell text to run, and whether it should
 * also run when DSH opens rather than waiting for the console to be shown.
 *
 * The draft is local to this component, which is mounted fresh for every
 * opening. Keeping it here means typing a command re-renders only the dialog —
 * not the sidebar, the consoles, and every xterm they hold.
 */
import * as React from 'react';
import type { Translate } from './locales.js';
interface StartupDialogProps {
    /** The saved command when the dialog opens, or an empty string. */
    readonly command: string;
    /** The saved auto-run state when the dialog opens. */
    readonly autoRun: boolean;
    /** Translator for every string this dialog renders. */
    readonly t: Translate;
    onClose: () => void;
    /** Report the edited pair; the owner persists it and closes the dialog. */
    onSave: (command: string, autoRun: boolean) => void;
}
/**
 * Render the Command autostart dialog.
 * @param props - saved values, copy, and the close/save commands.
 * @returns the modal.
 */
export declare function StartupDialog(props: StartupDialogProps): React.ReactElement;
export {};
//# sourceMappingURL=startup-dialog.d.ts.map