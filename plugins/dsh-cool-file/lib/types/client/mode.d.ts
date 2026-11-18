/**
 * The preview/editor switch: what the Files tab does with the open file, and the
 * two-button control in the preview header that picks it.
 *
 * The choice belongs to the reader, not to one file, so it is saved like the
 * hidden-entries toggle: the next visit opens in the mode this one was left in.
 * `preview` draws the file the way its kind is best read — a rendered document, a
 * picture, or syntax-coloured source; `editor` keeps source and puts a caret in
 * it.
 *
 * The control is this repository's own `ToggleGroup` in its square, icon-only
 * shape: two 24px buttons carrying the eye and the pencil, the one in force
 * filled with the shell's quiet selected-chip family. A row of icon buttons is
 * what fits a 36px header whose path column has to keep the rest of the width,
 * and the group is what makes the pair one control rather than two: one tab
 * stop for the row, arrow keys that move focus between the two, Enter and Space
 * to choose — instead of two separate stops a keyboard reader has to cross.
 *
 * The pair is not a tablist, and the pane below is not a tabpanel. The two
 * buttons describe *what the pane does* with one file rather than two panels of
 * which one is hidden, so `aria-pressed` on a button is the honest state and a
 * `tab`/`tabpanel` pairing would promise a structure the page does not have.
 * That is also why the pane is named as a region of its own (see `files.tsx`):
 * nothing points at it any more, so it has to carry its own name.
 *
 * A file that cannot be edited gets no control at all. A disabled Editor button
 * would advertise a choice the file refuses, and a lone Preview button would
 * only restate what the pane already shows; the saved preference survives either
 * way and applies again at the next file that can honour it, so nothing is lost
 * by drawing nothing here.
 *
 * Pressing the pressed button does not clear the group. A file is always drawn
 * one way or the other, so "neither" is not a state this page can show — the
 * group is built `deselectable={false}` and the `null` its callback allows is
 * dropped rather than stored.
 */
import type { ReactNode } from 'react';
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
/** Props of the header's mode switch. */
interface ModeSwitchProps {
    /**
     * The mode the page is actually drawing in.
     *
     * Not necessarily the saved preference: a file that cannot be edited is drawn
     * as a preview whatever the preference says, and this is what the pressed
     * button names — so the control always describes the pane under it.
     */
    readonly mode: FilesMode;
    /** Called with the mode the reader picked. */
    readonly onSelect: (mode: FilesMode) => void;
    /**
     * Whether the open file can be edited at all.
     *
     * False for a picture: it has no source to edit, so the switch is not drawn.
     */
    readonly editable: boolean;
    /** The page's translate seat. */
    readonly t: Translate;
}
/**
 * The header's Preview/Editor switch.
 *
 * @param props - the effective mode, the picker, whether the file is editable,
 *   and the copy.
 * @returns the square icon group, or nothing when the file cannot be edited.
 */
export declare function ModeSwitch({ mode, onSelect, editable, t }: ModeSwitchProps): ReactNode;
export {};
//# sourceMappingURL=mode.d.ts.map