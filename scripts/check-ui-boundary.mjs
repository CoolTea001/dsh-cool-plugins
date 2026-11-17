#!/usr/bin/env node
/**
 * Guard the two rules that keep the shared UI honest.
 *
 * A plugin's browser half is answered by the page's module table, which knows
 * `react`, `react-dom`, and the `@deepseek-ai/*` seeds — and nothing else. Every
 * workspace package under `@dsh-cool/` is inlined into each plugin's bundle, so
 * importing one is only ever a build-time fact. Two failures follow from that,
 * and both are invisible until a user opens a panel:
 *
 *   1. A plugin importing the shell's primitives directly. It works, but it puts
 *      the API description back in the plugin: five hand-written ambient `.d.ts`
 *      files (829 lines) used to describe "the subset this plugin uses", and two
 *      of them already disagreed about `Button`'s variants. The declarations are
 *      gone; `@dsh-cool/ui` is the one place allowed to name that module.
 *
 *   2. A published `.d.ts` mentioning a workspace package. `@dsh-cool/ui` is
 *      private and source-only, so a declaration emitted with an
 *      `import ... from '@dsh-cool/ui'` in it is a file npm consumers cannot
 *      resolve — the package installs, then fails to typecheck for the reader.
 *      This is checked against the built output, not the source, because the
 *      source is allowed to import it: the build is what ships.
 *
 * A third check is about the house style rather than the module graph: no plugin
 * draws an ad-hoc `<svg>` and no stylesheet names a literal colour. Icons come
 * from `@dsh-cool/icons`, and colours come from `--dsw-*` tokens.
 */
import { globSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'

/** The one package allowed to import the shell's primitives module. */
const PRIMITIVES_OWNER = 'packages/ui/'

/** The module that must not be imported anywhere else. */
const PRIMITIVES_MODULE = '@deepseek-ai/dsh-client-ui-primitives'

/** Build outputs a published package ships; declarations are what consumers read. */
const PUBLISHED_TYPES = ['plugins/*/lib/types/**/*.d.ts']

/** The hand-written ambient declaration that the shared package replaced. */
const FORBIDDEN_AMBIENT = 'plugins/*/src/client/*primitives.d.ts'

const failures = []

/** Report one violation with the file that caused it. */
function fail(file, message) {
  failures.push(`${relative(process.cwd(), file)}: ${message}`)
}

// 1. Exactly one importer of the shell primitives.
for (const file of globSync('plugins/*/src/**/*.{ts,tsx}')) {
  const source = readFileSync(file, 'utf8')
  if (!source.includes(`'${PRIMITIVES_MODULE}'`) && !source.includes(`"${PRIMITIVES_MODULE}"`)) continue
  fail(
    file,
    `imports ${PRIMITIVES_MODULE} directly — import it from '@dsh-cool/ui' instead, `
      + 'so the API description stays in one place',
  )
}

// 2. No re-introduced ambient declaration of that module.
for (const file of globSync(FORBIDDEN_AMBIENT)) {
  fail(
    file,
    're-declares the shell primitives module — `@dsh-cool/ui` re-exports it with its real types',
  )
}

// 3. Published declarations must not reference a workspace package.
//
// Comments are stripped first: a doc comment that explains *why* the package is
// not imported is a good comment, not a violation.
for (const file of PUBLISHED_TYPES.flatMap((pattern) => globSync(pattern))) {
  const source = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  for (const match of source.matchAll(/(?:from|import)\s*\(?\s*['"](@dsh-cool\/[^'"]+)['"]/g)) {
    fail(
      file,
      `publishes an import of ${match[1]} — a private workspace package cannot be resolved by `
        + 'a consumer; re-export what is needed through a public type instead',
    )
  }
}

// 4. Icons come from the shared set, not from ad-hoc SVG in a plugin.
for (const file of globSync('plugins/*/src/**/*.tsx')) {
  const source = readFileSync(file, 'utf8')
  if (/<svg[\s>]/.test(source)) {
    fail(file, 'draws an inline <svg> — import the glyph from @dsh-cool/icons instead')
  }
}

// 5. Plugin stylesheets name tokens, not literal colours.
//
// Only the stylesheet modules are checked: `dsh-cool-theme` exists to *define*
// colours, so its preset and token modules are exactly where literals belong.
// Everywhere else a literal is a page that a light/dark switch cannot follow.
/**
 * Remove the argument lists in which a literal is not a hardcoded colour.
 *
 * Two constructs legitimately contain one:
 *
 * - `var(--token, fallback)` — the fallback is only painted when the token is
 *   absent, which is a degraded build rather than a themed one.
 * - `color-mix(in srgb, var(--token) 86%, #000)` — darkening a token is the one
 *   arithmetic the token set has no vocabulary for, and it still follows the
 *   theme because the other operand is the token.
 *
 * The scan tracks parens because both nest (`var()` inside `color-mix()`), which
 * a regex cannot follow.
 *
 * @param code - one line of stylesheet source.
 * @returns the line with those argument lists removed.
 */
function stripThemeRelativeCalls(code) {
  let out = ''
  let index = 0
  while (index < code.length) {
    const call = /(color-mix|var)\(/g
    call.lastIndex = index
    const found = call.exec(code)
    if (found === null) {
      out += code.slice(index)
      break
    }
    out += code.slice(index, found.index)
    // Walk to the matching close paren.
    let depth = 0
    let cursor = found.index + found[0].length - 1
    for (; cursor < code.length; cursor += 1) {
      if (code[cursor] === '(') depth += 1
      else if (code[cursor] === ')') {
        depth -= 1
        if (depth === 0) break
      }
    }
    index = cursor + 1
  }
  return out
}

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/
for (const file of globSync('plugins/*/src/client/styles.ts')) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    // The mask trick paints with `#000` at varying alpha, which is a shape rather
    // than a colour: a mask reads only alpha, so no theme can vary it.
    // Transparent gradients are drawn with `rgba(0,0,0,0)` or `#0000`, and the
    // mask trick paints `#000` at varying alpha: a mask reads only alpha, so no
    // theme can vary either. The alpha is the whole value.
    if (/mask-image|--.*fade|transparent|rgba\(0,\s*0,\s*0,\s*0\)|#0000\b/i.test(line)) return
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
    // A comment that mentions a colour while explaining a token is fine.
    const code = line.split('//')[0]
    if (!COLOUR.test(code)) return
    if (!COLOUR.test(stripThemeRelativeCalls(code))) return
    fail(file, `line ${index + 1} names a literal colour — use a --dsw-* theme token`)
  })
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('ui boundary: one primitives owner, no workspace types published, no ad-hoc icons or colours')
