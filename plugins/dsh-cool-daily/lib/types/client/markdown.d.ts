/**
 * A small Markdown renderer for the article reader.
 *
 * The articles are this plugin's own model output, and they are rendered as
 * React elements rather than injected HTML, so a model that emits a `<script>`
 * or an `onerror` attribute cannot turn into markup. Only the block and inline
 * forms the prompt actually asks for are supported: headings, paragraphs,
 * emphasis, inline code, fenced code, lists, quotes, links, and rules. Anything
 * else stays literal text, which is the safe failure for a reader.
 */
import * as React from 'react';
/**
 * Render one Markdown document.
 * @param props.text - the article body as stored on disk.
 * @returns the rendered block sequence.
 */
export declare function Markdown({ text }: {
    text: string;
}): React.ReactElement;
//# sourceMappingURL=markdown.d.ts.map