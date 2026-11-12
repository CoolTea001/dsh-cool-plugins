/**
 * The editor body: the preview with a caret in it.
 *
 * The coloured rows are not a page of their own. They are drawn exactly as the
 * preview draws them — same gutter, same tokens, same metrics — and a textarea
 * whose glyphs are transparent is laid over them. The reader therefore edits the
 * highlighted code in place: there is no second panel to switch to, and no mode
 * that gives up colour for the sake of a keyboard.
 *
 * The field is the only scroller. It owns both axes, because a textarea must own
 * the scroll that follows its caret; the artwork behind it is clipped by its own
 * box and translated by the field's offsets (`sync`). That is what keeps a row
 * and its number under the caret after a wheel, a drag, or a page of typing.
 *
 * The transparency is what makes the whole thing work, and it is also what it
 * costs: the visible glyphs are the painted ones, so they are redrawn on every
 * keystroke. Tokenising a large file per keystroke would stall the field, so
 * past `EDIT_HIGHLIGHT_CHARS` the rows are redrawn plain — still aligned, still
 * editable, just one colour — which the page explains above the body.
 *
 * Metrics are declared twice, in the sheet: once for the rows, once for the
 * field. They must stay identical, down to the ligature setting, or the caret
 * slowly walks away from the glyph it belongs to.
 */
import { type ReactElement } from 'react';
/** Props of the editor body. */
interface CodeEditorProps {
    /** The LF-normalized draft text. */
    readonly text: string;
    /** The workspace path, which chooses the grammar. */
    readonly path: string;
    /** Called with the complete text after any change. */
    readonly onChange: (value: string) => void;
    /** Called for ⌘S / Ctrl+S. */
    readonly onSave: () => void;
    /** Accessible name for the field: the file's workspace path. */
    readonly label: string;
}
/**
 * Largest draft that is re-tokenised on every keystroke: about 1 200 lines.
 *
 * Below it a redraw costs a few milliseconds, which no typist can feel. Above it
 * it costs tens of them, and a field that stalls under the keyboard is worse
 * than one without colours.
 */
export declare const EDIT_HIGHLIGHT_CHARS = 40000;
/**
 * Draw the editor for one file.
 *
 * @param props - the draft, its sinks, and the field's name.
 * @returns the painted rows with a transparent field over them.
 */
export declare function CodeEditor({ text, path, onChange, onSave, label }: CodeEditorProps): ReactElement;
export {};
//# sourceMappingURL=editor.d.ts.map