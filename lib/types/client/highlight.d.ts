/**
 * Syntax colouring for the preview pane.
 *
 * The page runs inside the shell's own bundle, so the highlighter is compiled
 * into this plugin's single client file rather than fetched at runtime. The
 * language set is therefore fixed and deliberately modest: the extensions a
 * workspace actually holds, not every grammar highlight.js ships.
 *
 * The colours are the shell's, not a theme of this plugin's: `ui-theme` already
 * defines the `--shiki-*` variables that its own code blocks use, including the
 * dark-theme counterparts, so the preview follows the active appearance and any
 * theme preset by naming those variables and drawing no palette of its own.
 *
 * Nothing here runs for a file the language table does not know: the caller
 * falls back to plain text, which is also what a very large file gets.
 */
/**
 * Highlight one preview as HTML, or decline when the file has no grammar.
 *
 * The returned markup is highlight.js's own: it escapes the text it is given,
 * which is what makes it safe to insert into the preview once. A file the table
 * does not name returns null, and the caller draws the text as text.
 *
 * @param text - the file text, as the Host returned it.
 * @param path - the file's workspace path, which picks the grammar.
 * @returns escaped highlighted HTML, or null for plain text.
 */
export declare function highlightCode(text: string, path: string): string | null;
//# sourceMappingURL=highlight.d.ts.map