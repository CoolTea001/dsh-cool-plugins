/**
 * The preview/editor switch: what the Files tab does with the open file, and the
 * two-segment control in the preview header that picks it.
 *
 * The choice belongs to the reader, not to one file, so it is saved like the
 * hidden-entries toggle: the next visit opens in the mode this one was left in.
 * `preview` draws the file the way its kind is best read — a rendered document, a
 * picture, or syntax-coloured source; `editor` keeps source and puts a caret in
 * it.
 *
 * The control is the shell's own `SegmentedTabs` (supplied by the platform — see
 * `neverBundle` in `tsdown.config.ts`, never inlined): the track, the sliding
 * indicator, the tab roles and the Left/Right/Home/End walk are the ones every
 * segmented control in the window has, so this one behaves like them instead of
 * approximating them. Only its box is this page's; the primitive is drawn at
 * settings-page size and the head it sits in is 36px tall (see the `.dsh-cf-mode`
 * rules in `styles.ts`).
 *
 * A file that cannot be edited gets no control at all. A disabled Editor segment
 * would advertise a choice the file refuses, and a lone Preview segment would
 * only restate what the pane already shows; the saved preference survives either
 * way and applies again at the next file that can honour it, so nothing is lost
 * by drawing nothing here.
 *
 * The two segments are icons, not words, which is what fits the head: the word
 * each one stands for is drawn out of sight inside its tab (`dsh-cf-sr`) rather
 * than dropped, because a tab whose only child is a decorative glyph has no
 * accessible name at all.
 */
import type { ReactNode } from 'react';
import type { Translate } from './locales.js';
/** What the page does with the open file. */
export type FilesMode = 'preview' | 'editor';
/**
 * The id of the pane a switch's tabs control, derived from the switch's own id.
 *
 * The two halves of the page sit in different modules, and a tab's `aria-controls`
 * must name the element the header is beside rather than one each half spells out
 * for itself.
 *
 * @param id - the id the page gave the switch.
 * @returns the id its pane carries.
 */
export declare function modePanelId(id: string): string;
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
     * as a preview whatever the preference says, and this is what the selected
     * segment names — so the control always describes the pane under it.
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
    /**
     * The id this switch hangs its tabs and pane on.
     *
     * Owned by the page rather than by this module, because the pane — the element
     * the tabs point at — is rendered by the page.
     */
    readonly id: string;
    /** The page's translate seat. */
    readonly t: Translate;
}
/**
 * The header's Preview/Editor switch.
 *
 * @param props - the effective mode, the picker, whether the file is editable,
 *   the id the tabs and pane share, and the copy.
 * @returns the shell's segmented control, or nothing when the file cannot be
 *   edited.
 */
export declare function ModeSwitch({ mode, onSelect, editable, id, t, }: ModeSwitchProps): ReactNode;
export {};
//# sourceMappingURL=mode.d.ts.map