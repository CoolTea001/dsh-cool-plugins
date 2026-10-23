/**
 * The code body of the preview pane: a fixed line-number gutter beside the
 * text, with the text coloured by the grammar its file name picks.
 *
 * The gutter is a sibling of the code, not part of it: the code block owns the
 * horizontal scroll while the pane owns the vertical one, so a long line slides
 * under the pointer without taking the line numbers with it, and the numbers
 * stay put while the reader scrolls down. Both columns draw the same line box —
 * same size, line height and top padding — which is what keeps number n on the
 * line it belongs to; the gutter repeats that box as plain text (`white-space:
 * pre`) rather than as one element per line, so a five-thousand-line file still
 * mounts one node per column.
 *
 * Highlighting is memoised per text and path: selecting another file replaces
 * both, while re-rendering for a resize or a tab switch costs nothing.
 */
import { type ReactElement } from 'react';
/** Props of the preview body. */
interface CodePreviewProps {
    /** The file text exactly as the Host returned it. */
    readonly text: string;
    /** The workspace path, which chooses the grammar and names the scroll region. */
    readonly path: string;
}
/**
 * Draw one file's text with line numbers and syntax colours.
 *
 * @param props - the text to draw and the path it came from.
 * @returns the two-column code body.
 */
export declare function CodePreview({ text, path }: CodePreviewProps): ReactElement;
export {};
//# sourceMappingURL=code.d.ts.map