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

import type { LanguageFn } from 'highlight.js'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import clojure from 'highlight.js/lib/languages/clojure'
import cmake from 'highlight.js/lib/languages/cmake'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import dart from 'highlight.js/lib/languages/dart'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import less from 'highlight.js/lib/languages/less'
import lua from 'highlight.js/lib/languages/lua'
import makefile from 'highlight.js/lib/languages/makefile'
import markdown from 'highlight.js/lib/languages/markdown'
import perl from 'highlight.js/lib/languages/perl'
import php from 'highlight.js/lib/languages/php'
import powershell from 'highlight.js/lib/languages/powershell'
import properties from 'highlight.js/lib/languages/properties'
import protobuf from 'highlight.js/lib/languages/protobuf'
import python from 'highlight.js/lib/languages/python'
import r from 'highlight.js/lib/languages/r'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import scala from 'highlight.js/lib/languages/scala'
import scss from 'highlight.js/lib/languages/scss'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import swift from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

/**
 * One grammars table: the name a file is highlighted with, then its grammar.
 *
 * Registration happens once, at module load, into the copy of highlight.js this
 * bundle owns; no global registry is touched, so the shell's own code blocks and
 * other plugins cannot see or change it.
 */
const GRAMMARS: Readonly<Record<string, LanguageFn>> = {
  bash,
  c,
  clojure,
  cmake,
  cpp,
  csharp,
  css,
  dart,
  diff,
  dockerfile,
  go,
  graphql,
  ini,
  java,
  javascript,
  json,
  kotlin,
  less,
  lua,
  makefile,
  markdown,
  perl,
  php,
  powershell,
  properties,
  protobuf,
  python,
  r,
  ruby,
  rust,
  scala,
  scss,
  shell,
  sql,
  swift,
  typescript,
  xml,
  yaml,
}

for (const [name, grammar] of Object.entries(GRAMMARS)) hljs.registerLanguage(name, grammar)

/**
 * Language per file extension.
 *
 * An extension maps to the grammar that reads it, which is not always the name
 * the grammar was registered under: TSX, for instance, is read by the TypeScript
 * grammar, and HTML and SVG by the XML one.
 */
const BY_EXTENSION: Readonly<Record<string, string>> = {
  bash: 'bash',
  c: 'c',
  cc: 'cpp',
  cfg: 'ini',
  cjs: 'javascript',
  clj: 'clojure',
  cmake: 'cmake',
  conf: 'ini',
  cpp: 'cpp',
  cs: 'csharp',
  css: 'css',
  cxx: 'cpp',
  dart: 'dart',
  diff: 'diff',
  go: 'go',
  gql: 'graphql',
  graphql: 'graphql',
  h: 'c',
  hh: 'cpp',
  hpp: 'cpp',
  htm: 'xml',
  html: 'xml',
  hxx: 'cpp',
  ini: 'ini',
  java: 'java',
  js: 'javascript',
  json: 'json',
  json5: 'json',
  jsonc: 'json',
  jsx: 'javascript',
  ksh: 'bash',
  kt: 'kotlin',
  kts: 'kotlin',
  less: 'less',
  lua: 'lua',
  markdown: 'markdown',
  md: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  patch: 'diff',
  php: 'php',
  pl: 'perl',
  properties: 'properties',
  proto: 'protobuf',
  ps1: 'powershell',
  psm1: 'powershell',
  py: 'python',
  pyw: 'python',
  r: 'r',
  rb: 'ruby',
  rs: 'rust',
  sass: 'scss',
  scala: 'scala',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
  svg: 'xml',
  swift: 'swift',
  toml: 'ini',
  ts: 'typescript',
  tsx: 'typescript',
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
  gnumakefile: 'makefile',
  makefile: 'makefile',
}

/**
 * Largest file that is worth highlighting.
 *
 * The Host already limits a preview to a few thousand lines, but a built bundle
 * or a minified script is still hundreds of kilobytes of dense JavaScript, and
 * colouring it costs both the grammar walk and a span per token in the DOM.
 * Past this size the text keeps its line numbers and is drawn uncoloured, which
 * is the difference between a preview that opens and one that stalls the tab.
 */
const MAX_HIGHLIGHT_CHARS = 200_000

/**
 * The grammar a workspace path is highlighted with.
 *
 * @param path - the file's workspace path.
 * @returns the registered grammar name, or undefined when the path names none.
 */
function languageOf(path: string): string | undefined {
  const name = path.slice(path.lastIndexOf('/') + 1).toLowerCase()
  const byName = BY_NAME[name]
  if (byName !== undefined) return byName
  // `Dockerfile.dev` and friends are still Dockerfiles.
  if (name === 'dockerfile' || name.startsWith('dockerfile.')) return 'dockerfile'
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return undefined
  return BY_EXTENSION[name.slice(dot + 1)]
}

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
export function highlightCode(text: string, path: string): string | null {
  const language = languageOf(path)
  if (language === undefined || text.length > MAX_HIGHLIGHT_CHARS) return null
  if (hljs.getLanguage(language) === undefined) return null
  try {
    return hljs.highlight(text, { language, ignoreIllegals: true }).value
  } catch {
    // A grammar that trips on a file is not a reason to blank the preview.
    return null
  }
}
