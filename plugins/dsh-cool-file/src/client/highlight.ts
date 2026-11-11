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

import { createCssVariablesTheme, createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import bash from 'shiki/langs/bash.mjs'
import c from 'shiki/langs/c.mjs'
import cmake from 'shiki/langs/cmake.mjs'
import css from 'shiki/langs/css.mjs'
import diff from 'shiki/langs/diff.mjs'
import docker from 'shiki/langs/docker.mjs'
import go from 'shiki/langs/go.mjs'
import ini from 'shiki/langs/ini.mjs'
import java from 'shiki/langs/java.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import jsonc from 'shiki/langs/jsonc.mjs'
import kotlin from 'shiki/langs/kotlin.mjs'
import lua from 'shiki/langs/lua.mjs'
import make from 'shiki/langs/make.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import powershell from 'shiki/langs/powershell.mjs'
import python from 'shiki/langs/python.mjs'
import rust from 'shiki/langs/rust.mjs'
import scss from 'shiki/langs/scss.mjs'
import sql from 'shiki/langs/sql.mjs'
import toml from 'shiki/langs/toml.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import xml from 'shiki/langs/xml.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import type { HighlighterCore, ThemedToken, TokensResult } from 'shiki/core'

/**
 * Every grammar this bundle carries.
 *
 * One module per language rather than the package's bundle: a language the list
 * leaves out is also left out of the bundle, which is what keeps the client file
 * from carrying every grammar Shiki ships.
 */
const GRAMMARS = [
  bash,
  c,
  cmake,
  css,
  diff,
  docker,
  go,
  ini,
  java,
  javascript,
  json,
  jsonc,
  kotlin,
  lua,
  make,
  markdown,
  powershell,
  python,
  rust,
  scss,
  sql,
  toml,
  tsx,
  typescript,
  xml,
  yaml,
]

/** The theme name this plugin registers; the only one it ever names. */
const THEME = 'css-variables'

/**
 * The shell's colour variables, as a Shiki theme.
 *
 * `--shiki-*` is the prefix `ui-theme` already uses, so the tokenizer emits the
 * same variables the shell's own code blocks read. The defaults are this
 * plugin's own fallback chain: a profile without the theme rules, or a skin that
 * has not defined one of the variables, still draws readable text rather than an
 * invalid colour.
 */
const shellTheme = createCssVariablesTheme({
  name: THEME,
  variablePrefix: '--shiki-',
  fontStyle: true,
  variableDefaults: {
    foreground: 'var(--dsw-alias-label-primary)',
    background: 'transparent',
    'token-constant': 'var(--dsw-alias-label-primary)',
    'token-string': 'var(--dsw-alias-label-primary)',
    'token-string-expression': 'var(--dsw-alias-label-primary)',
    'token-comment': 'var(--dsw-alias-label-secondary)',
    'token-keyword': 'var(--dsw-alias-label-primary)',
    'token-parameter': 'var(--dsw-alias-label-primary)',
    'token-function': 'var(--dsw-alias-label-primary)',
    'token-punctuation': 'var(--dsw-alias-label-primary)',
    'token-link': 'var(--dsw-alias-link)',
  },
})

/**
 * Largest file that is worth highlighting.
 *
 * The Host already limits a preview to a few thousand lines, but a built bundle
 * or a minified script is still hundreds of kilobytes of dense JavaScript, and
 * colouring it costs both the TextMate walk and a span per token in the DOM.
 * Past this size the text keeps its line numbers and is drawn uncoloured, which
 * is the difference between a preview that opens and one that stalls the tab.
 */
const MAX_HIGHLIGHT_CHARS = 200_000

/**
 * Language per file extension, as Shiki names it.
 *
 * An extension maps to the grammar that reads it, which is not always the name
 * the file suggests: TSX has its own grammar, HTML and SVG are read by the XML
 * one, and a Vue file is honestly drawn as markup rather than guessed at. Two
 * approximations keep the bundle near a megabyte: C++ (and the headers that go
 * with it) is read by the C grammar, and Less by the SCSS one. Both still colour
 * comments, strings and keywords — what they miss is the class and mixin
 * structure their own grammars would have named.
 */
const BY_EXTENSION: Readonly<Record<string, string>> = {
  bash: 'bash',
  c: 'c',
  cc: 'c',
  cfg: 'ini',
  cjs: 'javascript',
  cjsx: 'javascript',
  cmake: 'cmake',
  conf: 'ini',
  cpp: 'c',
  css: 'css',
  cxx: 'c',
  diff: 'diff',
  dockerfile: 'docker',
  go: 'go',
  h: 'c',
  hh: 'c',
  hpp: 'c',
  htm: 'xml',
  html: 'xml',
  hxx: 'c',
  ini: 'ini',
  java: 'java',
  js: 'javascript',
  json: 'json',
  json5: 'json',
  jsonc: 'jsonc',
  jsx: 'javascript',
  ksh: 'bash',
  kt: 'kotlin',
  kts: 'kotlin',
  less: 'scss',
  lua: 'lua',
  markdown: 'markdown',
  md: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  patch: 'diff',
  properties: 'ini',
  ps1: 'powershell',
  psm1: 'powershell',
  py: 'python',
  pyw: 'python',
  rs: 'rust',
  sass: 'scss',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
  svg: 'xml',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'xml',
  xhtml: 'xml',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
}

/**
 * Whole names that carry their language instead of an extension.
 *
 * Docker and Make read a `Dockerfile` and a `Makefile` by name; CMake's entry
 * file has an extension after a dot, so it is matched here rather than split.
 */
const BY_NAME: Readonly<Record<string, string>> = {
  'cmakelists.txt': 'cmake',
  'dockerfile': 'docker',
  'gnumakefile': 'make',
  'makefile': 'make',
}

/**
 * Font style per bit of a token's style word.
 *
 * Shiki packs italic, bold and underline into one number the way the TextMate
 * themes do; the attributes are emitted inline because the token is already
 * being given a colour inline.
 */
const FONT_STYLES: readonly (readonly [number, string])[] = [
  [1, 'font-style:italic'],
  [2, 'font-weight:700'],
  [4, 'text-decoration:underline'],
]

/** The tokenizer, built once at module load and reused for every file. */
let highlighter: HighlighterCore | null | undefined

/**
 * The shared highlighter, created on first use.
 *
 * A sync build because the browser half is a CommonJS module: it cannot await a
 * top-level import, and the picker wants a string back from a render, not a
 * promise. Creation is the only step that can fail, and a failure is remembered
 * as "no highlighter" rather than retried on every file.
 *
 * @returns the highlighter, or null when it could not be created.
 */
function getHighlighter(): HighlighterCore | null {
  if (highlighter !== undefined) return highlighter
  try {
    highlighter = createHighlighterCoreSync({
      engine: createJavaScriptRegexEngine({ forgiving: true }),
      themes: [shellTheme],
      langs: GRAMMARS,
      warnings: false,
    })
  } catch {
    highlighter = null
  }
  return highlighter
}

/**
 * The grammar a workspace path is highlighted with.
 *
 * @param path - the file's workspace path.
 * @returns the registered language name, or undefined when the path names none.
 */
function languageOf(path: string): string | undefined {
  const name = path.slice(path.lastIndexOf('/') + 1).toLowerCase()
  const byName = BY_NAME[name]
  if (byName !== undefined) return byName
  // `Dockerfile.dev` and friends are still Dockerfiles.
  if (name.startsWith('dockerfile.')) return 'docker'
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return undefined
  return BY_EXTENSION[name.slice(dot + 1)]
}

/**
 * Escape text for insertion into an HTML text node.
 *
 * @param text - the raw token text.
 * @returns the same characters, safe inside an element.
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * One token's inline style, or the empty string when it needs none.
 *
 * The plain foreground is the block's own colour, so a token painted with it is
 * written as bare text: most of a file is whitespace and identifiers, and
 * wrapping those would multiply the preview's nodes for no visible difference.
 *
 * @param token - the token to style.
 * @param foreground - the block's own foreground colour.
 * @returns CSS declarations joined by `;`, without a trailing one.
 */
function styleOf(token: ThemedToken, foreground: string | undefined): string {
  const parts: string[] = []
  if (token.color !== undefined && token.color !== foreground) parts.push(`color:${token.color}`)
  if (token.bgColor !== undefined) parts.push(`background-color:${token.bgColor}`)
  const style = token.fontStyle ?? 0
  for (const [bit, declaration] of FONT_STYLES) {
    if ((style & bit) !== 0) parts.push(declaration)
  }
  return parts.join(';')
}

/**
 * One drawn file: its rows and how many of them there are.
 *
 * The count is returned beside the markup because the number column is drawn by
 * the caller, not by these rows — the gutter needs one number per row and must
 * not guess the count from the text it was given.
 */
export interface HighlightedCode {
  /** Escaped row markup, one `.dsh-cf-line` block per line of the file. */
  readonly html: string
  /** How many rows `html` holds, which is also how many numbers the gutter draws. */
  readonly lineCount: number
}

/**
 * Draw a tokenised file as HTML: one block per row, a span per coloured token.
 *
 * A row is a block element, so the rows are concatenated with no separator at
 * all: no newline is needed, and a stray one would draw an empty row of its own.
 * The block wrapper is layout only; the number for each row is drawn by the
 * gutter beside the block (see `code.tsx`), which is why the row count comes
 * back with the markup.
 *
 * @param result - the tokenizer's answer.
 * @returns the escaped rows and their count.
 */
function renderTokens(result: TokensResult): HighlightedCode {
  const tokenLines = result.tokens.length === 0 ? [[]] : result.tokens
  const rows: string[] = []
  for (const tokens of tokenLines) {
    const parts: string[] = []
    for (const token of tokens) {
      const style = styleOf(token, result.fg)
      const content = escapeHtml(token.content)
      parts.push(style === '' ? content : `<span style="${style}">${content}</span>`)
    }
    rows.push(`<span class="dsh-cf-line">${parts.join('')}</span>`)
  }
  return { html: rows.join(''), lineCount: tokenLines.length }
}

/**
 * The same rows, without a grammar: every line escaped and nothing coloured.
 *
 * An unknown extension, an oversized file and a file the tokenizer trips on all
 * land here, which is what keeps the preview a reader — the lines still carry
 * their numbers, they just wear the plain foreground.
 *
 * @param text - the file text, as the Host returned it.
 * @returns the escaped rows and their count.
 */
function renderPlain(text: string): HighlightedCode {
  // A CRLF file's text is split on the break, not on the `\n` alone: a lone CR
  // left in a row would be normalized to a newline by the HTML parser and draw
  // an extra, empty row.
  const lines = text.split(/\r\n|\r|\n/)
  const rows: string[] = []
  for (const line of lines) rows.push(`<span class="dsh-cf-line">${escapeHtml(line)}</span>`)
  return { html: rows.join(''), lineCount: lines.length }
}

/**
 * The same rows, uncoloured, for a caller that cannot afford the tokenizer.
 *
 * The editor re-draws its rows on every keystroke, so for a file past the budget
 * it pays for the plain path rather than a grammar: the caret still lands on the
 * glyph it belongs to, the rows just wear one colour.
 *
 * @param text - the file text, as the Host returned it.
 * @returns the escaped rows and their count.
 */
export function plainCode(text: string): HighlightedCode {
  return renderPlain(text)
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
export function highlightCode(text: string, path: string): HighlightedCode {
  const language = languageOf(path)
  if (language === undefined || text.length > MAX_HIGHLIGHT_CHARS) return renderPlain(text)
  const engine = getHighlighter()
  if (engine === null) return renderPlain(text)
  try {
    return renderTokens(engine.codeToTokens(text, { lang: language, theme: THEME }))
  } catch {
    // A grammar that trips on a file is not a reason to blank the preview.
    return renderPlain(text)
  }
}
