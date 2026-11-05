/**
 * The settings dialog, drawn with DSH's own Modal and Button primitives so its
 * chrome, mask, focus trap, Escape handling, and action row match the rest of
 * the product instead of being re-implemented here.
 *
 * It edits one draft of the complete settings document and writes it in one
 * request, so the prompt, the repeat days, and the batch size can never be
 * saved half-applied. The dialog owns its own failure state: a refused write
 * leaves the draft on screen so the user can retry instead of losing the text
 * they just typed.
 */
import * as React from 'react';
import type { Translate } from './locales.js';
/** The props the page hands the dialog. */
export interface SettingsDialogProps {
    /** The plugin's translate seat. */
    t: Translate;
    /** The stored settings the draft starts from. */
    settings: {
        prompt: string;
        count: number;
        days: number[];
    };
    /** Close without saving. */
    onClose: () => void;
    /** The stored result, after a successful write. */
    onSaved: (settings: {
        prompt: string;
        count: number;
        days: number[];
    }) => void;
}
/**
 * Render the settings dialog.
 * @param props - stored settings, close and save callbacks.
 * @returns the modal dialog.
 */
export declare function SettingsDialog({ t, settings, onClose, onSaved, }: SettingsDialogProps): React.ReactElement;
//# sourceMappingURL=settings.d.ts.map