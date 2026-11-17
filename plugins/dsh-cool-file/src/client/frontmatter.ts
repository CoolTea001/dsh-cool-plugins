/**
 * Front matter, split off a workspace Markdown document before it is rendered.
 *
 * A workspace `.md` very often starts with a YAML block, and the shell's renderer
 * has no grammar for one: those lines would become a horizontal rule followed by
 * an accidental heading, which is the one way a rendered document can look
 * broken on its first screen. The block is therefore cut here and shown as source
 * above the page, so the metadata a reader may want is neither dropped nor
 * mangled.
 *
 * A file is only parsed as a pure string — no Markdown knowledge of its own.
 */

/**
 * Split a leading front-matter block off a document.
 *
 * Only the YAML shape is recognized — `---` alone on its line, the block, then
 * `---` or `...` alone on its line — because that is the one a workspace uses and
 * the one the renderer would mangle. A document with no such block is returned
 * untouched, and an opener with no closer is treated as a horizontal rule, which
 * is what Markdown itself says it is.
 *
 * @param text - the document's text.
 * @returns the front matter (with its delimiters) and the document behind it.
 */
export function splitFrontMatter(text: string): { readonly frontMatter: string; readonly body: string } {
  const opener = /^\uFEFF?---[ \t]*\r?\n/.exec(text)
  if (opener === null) return { frontMatter: '', body: text }
  const rest = text.slice(opener[0].length)
  const closer = /^(?:---|\.\.\.)[ \t]*$/m.exec(rest)
  if (closer === null) return { frontMatter: '', body: text }
  const end = opener[0].length + closer.index + closer[0].length
  // The newline after the closing delimiter belongs to the block, not the body.
  const after = text[end] === '\r' ? end + 2 : text[end] === '\n' ? end + 1 : end
  return { frontMatter: text.slice(0, after), body: text.slice(after) }
}

