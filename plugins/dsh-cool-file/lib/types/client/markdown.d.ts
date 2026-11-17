/**
 * The Markdown pane: a workspace document drawn as a document.
 *
 * A `.md` file opened in preview mode is not source any more — it is a page. The
 * renderer that draws it is the shell's own `MarkdownText`, the same one the
 * transcript uses for an assistant's answer, so a document in this tab looks
 * exactly like the same document quoted in a conversation: the same headings,
 * the same tables, the same fenced code with its copy button, the same KaTeX.
 * Building a second Markdown renderer here would mean two answers to "what does
 * this document look like".
 *
 * Three pieces of the shell's renderer vocabulary need an owner, and this module
 * is it:
 *
 * 1. **Local images.** The renderer refuses a destination that is not absolute
 *    http(s) unless its owner vouches for one, because a rendered message must
 *    not be able to name a file on the reader's disk. Here the owner is the page
 *    already browsing that workspace, so `pathImages` turns a relative
 *    destination into the raw route's address (`raw.ts`) — which is how a
 *    document's own screenshots appear inside it.
 * 2. **Local links.** `openFile` makes a link to a sibling file a button that
 *    opens it in this tab, and `fileImages` gives a rendered image the address
 *    its lightbox needs. Both callbacks receive an already-decoded path, which
 *    is why they resolve through `resolveDecodedPath` and not the authored
 *    resolver. A link whose target this page cannot open (one that climbs out of
 *    the workspace, or names a directory) is left as plain text: a button that
 *    answers with an English Host error is worse than a word that does nothing.
 * 3. **Front matter.** A workspace Markdown file very often starts with a YAML
 *    block, and the renderer has no grammar for one: those three or four lines
 *    would become a horizontal rule followed by an accidental heading. The block
 *    is cut before rendering and shown as source above the document, so the
 *    metadata a reader may want is not silently dropped.
 *
 * The text arrives from a whole-file read (see `openFile` in `files.tsx`), so a
 * document renders in full. Two fallbacks hand it back to the source view instead
 * of rendering it: a document past the render budget, and one the Host could only
 * read part of (a renderer fed half a file can swallow the rest of a page inside
 * an unbalanced code fence). Both say why above the source.
 */
import { type ReactElement } from 'react';
import type { Translate } from './locales.js';
/** Props of the Markdown pane. */
interface MarkdownPreviewProps {
    /** The document's text, as the Host read returned it. */
    readonly text: string;
    /** The document's workspace path, which relative destinations resolve against. */
    readonly path: string;
    /** The session whose workspace holds the document, when known. */
    readonly sessionId: string | undefined;
    /**
     * Whether `text` is only the beginning of the file.
     *
     * A partial document is rendered as source rather than as a page: a truncated
     * fence or table renders as something the document never said.
     */
    readonly partial: boolean;
    /**
     * Open one workspace file in this tab, for a link the document carries.
     *
     * A destination the page cannot open is never passed here, so the callback can
     * assume the path is inside the workspace.
     */
    readonly onOpenFile: (path: string, line?: number) => void;
    /** The page's translate seat. */
    readonly t: Translate;
}
/** Whether a document is too large to render, and must be shown as source. */
export declare function isMarkdownTooLarge(text: string): boolean;
/**
 * Draw one workspace Markdown document.
 *
 * @param props - the text, its path, the workspace, and the page's copy.
 * @returns the rendered document.
 */
export declare function MarkdownPreview({ text, path, sessionId, partial, onOpenFile, t, }: MarkdownPreviewProps): ReactElement;
export {};
//# sourceMappingURL=markdown.d.ts.map