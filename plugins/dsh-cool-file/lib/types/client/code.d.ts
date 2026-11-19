/**
 * The code body of the preview pane: a number column beside coloured source rows.
 *
 * The numbers are a column of their own, a sibling of the block that scrolls.
 * That is what keeps them still: the `<pre>` owning the horizontal scroll holds
 * the source and nothing else, so a long line slides sideways underneath the
 * pointer while its number stays on the left edge. Vertical motion needs no
 * syncing at all — the body scrolls the gutter and the rows together, because
 * they are siblings in the same scroller.
 *
 * Both columns are measured by the same rules (`styles.ts`): the same monospaced
 * font, the same 12px size and 21.6px line height, the same 12px top padding and
 * the same bottom padding. Every source row is a fixed-height block, and a number
 * is one line of the gutter's `<pre>`, so row *n* and number *n* start at the same
 * offset for every *n* — the two columns cannot accumulate a difference because
 * neither one has a height of its own to vary.
 *
 * The gutter's width follows the file: it is sized in `ch` from the digits of the
 * last line number, so a 9-line file gets a narrow column and a 100 000-line file
 * still fits its numbers without re-measuring.
 *
 * Rendering is memoised per text and path: selecting another file replaces both,
 * while re-rendering for a resize or a tab switch costs nothing. The tokenizer
 * lives in `highlight.ts`; what it returns is escaped HTML — one block per row,
 * coloured tokens inside — plus the row count the gutter needs.
 */
import { type CSSProperties, type ReactElement, type RefObject } from 'react';
/** Keep wrapped source rows and their line numbers on the same baselines. */
export declare function useWrappedRowHeights(wrap: boolean, rows: RefObject<HTMLElement | null>, gutter: RefObject<HTMLElement | null>): void;
/** Props of the preview body. */
interface CodePreviewProps {
    /** The file text exactly as the Host returned it. */
    readonly text: string;
    /** The workspace path, which chooses the grammar and names the scroll region. */
    readonly path: string;
    /** Whether a long source line continues on the next visual row. */
    readonly wrap: boolean;
    /**
     * The 1-based line to bring into view once drawn.
     *
     * A Markdown link may name one (`README.md#L24`), and opening the file at the
     * top would make the link look broken. Absent means "start at the top", which
     * is what a file opened from the tree wants.
     */
    readonly line?: number | undefined;
}
/**
 * One row's height, in pixels.
 *
 * Declared here because two things read it: the sheet, which pins every row and
 * both columns to it, and the one-off reveal below, which converts a line number
 * into a scroll offset by multiplying. A rule and a multiplication that disagreed
 * by a pixel would drift by a handful of rows over a long file.
 */
export declare const CODE_LINE_HEIGHT = 21.6;
/**
 * The number column for a file of `lineCount` rows.
 *
 * The editor draws its own number column — it has to translate the numbers by
 * the field's scroll offset, which the preview never does — but the digits, the
 * width and the pitch have to be the preview's, or the two modes would disagree
 * about where a row starts.
 *
 * @param lineCount - how many rows the file has.
 * @returns the numbers, one per line, and the width of the column.
 */
export declare function gutterBox(lineCount: number): {
    readonly text: string;
    readonly style: CSSProperties;
};
/**
 * Draw one file's text with line numbers and syntax colours.
 *
 * @param props - the text to draw and the path it came from.
 * @returns the code body.
 */
export declare function CodePreview({ text, path, wrap, line }: CodePreviewProps): ReactElement;
export {};
//# sourceMappingURL=code.d.ts.map