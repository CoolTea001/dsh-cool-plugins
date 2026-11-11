/**
 * Syntax colouring for the preview pane, on Shiki.
 *
 * The page runs inside the shell's own bundle, so the highlighter is compiled
 * into this plugin's single client file rather than fetched at runtime. Shiki's
 * core is the fine-grained build: the grammar set is the list below, written out
 * one import per language. That list is a size decision as much as a taste one —
 * the grammars are TextMate data, not code, so they do not shrink when the
 * bundle is minified, and the C++ grammar alone is half a megabyte. The table
 * below therefore covers the languages a workspace usually holds and leaves the
 * rest to plain text: adding one back is one import plus one array entry.
 *
 * The colours are the shell's, not a theme of this plugin's: `ui-theme` defines
 * the `--shiki-*` variables that its own code blocks use, including the
 * dark-theme counterparts, so the preview names those variables and lets the
 * tokenizer emit them inline. The light and dark palettes are therefore the
 * shell's own, and a third-party skin that rebinds the variables carries the
 * preview with it.
 *
 * The tokenizer is the JavaScript RegExp engine rather than the WebAssembly
 * Oniguruma one: the plugin ships as one CommonJS file, and a `.wasm` beside it
 * would never be fetched. The engine's forgiving mode skips the rare grammar
 * pattern that JavaScript's RegExp cannot express, which costs a token colour
 * at worst and never a failed preview.
 *
 * Nothing here runs for a file the language table does not know: the caller
 * falls back to plain text, which is also what a very large file gets.
 */
/**
 * One drawn file: its rows and how many of them there are.
 *
 * The count is returned beside the markup because the number column is drawn by
 * the caller, not by these rows — the gutter needs one number per row and must
 * not guess the count from the text it was given.
 */
export interface HighlightedCode {
    /** Escaped row markup, one `.dsh-cf-line` block per line of the file. */
    readonly html: string;
    /** How many rows `html` holds, which is also how many numbers the gutter draws. */
    readonly lineCount: number;
}
/**
 * Draw one preview as HTML: coloured rows, and how many line numbers they need.
 *
 * The returned markup is this module's own: every token is escaped here, and
 * the only strings interpolated besides that text are the theme colours this
 * plugin built. A file the table does not name is drawn as plain text rather
 * than declined, so the preview always has rows for the gutter to number.
 *
 * @param text - the file text, as the Host returned it.
 * @param path - the file's workspace path, which picks the grammar.
 * @returns the escaped rows and their count.
 */
export declare function highlightCode(text: string, path: string): HighlightedCode;
//# sourceMappingURL=highlight.d.ts.map