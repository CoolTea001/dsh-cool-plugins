#!/usr/bin/env node
/**
 * Assemble each plugin package's `THIRD_PARTY_NOTICES.md` from the workspace copy.
 *
 * Every plugin publishes as its own npm package, so each tarball needs its own
 * notices file: a reader who installs one plugin never sees this repository, and
 * `files` cannot reach above the package directory. Six hand-maintained copies
 * drifted instead — five were byte-identical while `dsh-cool-file` alone carried
 * its Shiki section, and `dsh-cool-terminal` shipped xterm with no section at
 * all. So the workspace root now holds the one copy attributions are written in,
 * and each package's file is generated from it by that package's `prepack`.
 *
 * {@link COVERAGE} says which packages ship each section; {@link IMPORTS} reads
 * what each package actually bundles. The check fails in both directions, so a
 * newly bundled dependency cannot ship unattributed and a stale section cannot
 * outlive the dependency it describes.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root, resolved from this script rather than the caller's cwd. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The one file attributions are written in. */
const SOURCE = join(repoRoot, 'THIRD_PARTY_NOTICES.md')

/** The generated file's name inside each package. */
const TARGET = 'THIRD_PARTY_NOTICES.md'

/**
 * Which packages ship each section.
 *
 * `'*'` means every plugin; the array names the packages that bundle the
 * dependency. Keep this in step with {@link IMPORTS}.
 */
const COVERAGE = {
  plush: '*',
  lucide: '*',
  xterm: ['dsh-cool-terminal'],
  shiki: ['dsh-cool-file'],
}

/**
 * How to recognise each section's heading in `SOURCE`.
 *
 * The heading line starts the section; the section runs to the next heading.
 */
const HEADINGS = {
  plush: /^##\s+with icons Plush\b/,
  lucide: /^##\s+Lucide Icons\b/,
  xterm: /^##\s+xterm\.js\b/,
  shiki: /^##\s+Shiki\b/,
}

/**
 * How to recognise each dependency in a package, keyed by the section it needs.
 *
 * Imported code is read from the TypeScript sources rather than the built bundle:
 * a fresh clone has not built yet, and an import states the intent either way.
 * `@dsh-cool/icons` counts because that package is source-only and inlined into
 * every plugin that draws a glyph. The plugin icon is a file rather than an
 * import, so it is detected by its presence.
 */
const REQUIRES = {
  plush: dir => existsSync(join(dir, 'icon.svg')),
  lucide: dir => reads(dir, /from\s+['"]@dsh-cool\/icons(?:\/[^'"]*)?['"]/),
  xterm: dir => reads(dir, /from\s+['"]@xterm\//),
  shiki: dir => reads(dir, /from\s+['"]shiki(?:\/[^'"]*)?['"]/),
}

const SECTION_IDS = Object.keys(HEADINGS)

/** The generated file's opening paragraph. */
function preamble() {
  return [
    '# Third-party notices',
    '',
    "This package's browser bundle includes the following third-party software.",
    '',
    'Generated from the workspace `THIRD_PARTY_NOTICES.md` by',
    '`scripts/third-party-notices.mjs`; edit that file, not this one.',
    '',
    '',
  ].join('\n')
}

/** Split `SOURCE` into sections, keyed by section id, in file order. */
function readSections() {
  const sections = new Map()
  let current
  for (const line of readFileSync(SOURCE, 'utf8').split('\n')) {
    const id = SECTION_IDS.find(candidate => HEADINGS[candidate].test(line))
    if (id !== undefined) {
      current = { lines: [line] }
      sections.set(id, current)
    } else if (current !== undefined) {
      current.lines.push(line)
    }
  }
  const missing = SECTION_IDS.filter(id => !sections.has(id))
  if (missing.length > 0) throw new Error(`${SOURCE}: missing section(s): ${missing.join(', ')}`)
  const unfiled = [...sections.keys()].filter(id => !(id in COVERAGE))
  if (unfiled.length > 0) throw new Error(`${SOURCE}: no COVERAGE entry for: ${unfiled.join(', ')}`)
  // The root file annotates headings with which packages they cover; that note is
  // for a reader of the repository, so a generated copy drops it.
  return new Map([...sections].map(([id, section]) => [id, section.lines
    .map((line, index) => (index === 0 ? line.replace(/\s+—.*$/, '') : line))
    .join('\n')
    .trimEnd()]))
}

/** Every plugin package, keyed by package name. */
function readPlugins() {
  const plugins = new Map()
  for (const entry of readdirSync(join(repoRoot, 'plugins'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = join(repoRoot, 'plugins', entry.name)
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    plugins.set(manifest.name, { name: manifest.name, dir })
  }
  return plugins
}

/** The section ids a package's declared coverage says it ships, in `SOURCE` order. */
function declaredFor(name) {
  return SECTION_IDS.filter(id => COVERAGE[id] === '*' || COVERAGE[id].includes(name))
}

/** The section ids a package's source actually needs. */
function requiredFor(dir) {
  const found = new Set()
  for (const [id, requires] of Object.entries(REQUIRES)) {
    if (requires(dir)) found.add(id)
  }
  return found
}

/**
 * Whether any TypeScript source under `dir` matches `pattern`.
 *
 * @param dir - the package directory whose `src` is searched.
 * @param pattern - the import to look for.
 */
function reads(dir, pattern) {
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) {
        if (walk(path)) return true
      } else if (/\.(ts|tsx)$/.test(entry.name) && pattern.test(readFileSync(path, 'utf8'))) {
        return true
      }
    }
    return false
  }
  return walk(join(dir, 'src'))
}

/** Report coverage disagreements in both directions. */
function verify(plugins) {
  const problems = []
  for (const [name, { dir }] of plugins) {
    const declared = new Set(declaredFor(name))
    const required = requiredFor(dir)
    for (const id of required) {
      if (!declared.has(id)) problems.push(`${name}: uses ${id}, but COVERAGE omits that section`)
    }
    for (const id of declared) {
      if (!required.has(id)) problems.push(`${name}: ships the ${id} section, but no longer uses it`)
    }
  }
  for (const [id, covered] of Object.entries(COVERAGE)) {
    if (covered === '*') continue
    for (const name of covered) {
      if (!plugins.has(name)) problems.push(`${id}: COVERAGE names unknown package ${name}`)
    }
  }
  return problems
}

/** The complete text of one package's notices file. */
function render(name, sections) {
  const ids = declaredFor(name)
  if (ids.length === 0) throw new Error(`${name}: no third-party section applies`)
  return `${preamble()}${ids.map(id => sections.get(id)).join('\n\n')}\n`
}

function main(argv) {
  const check = argv.includes('--check')
  const sections = readSections()
  const plugins = readPlugins()

  const problems = verify(plugins)
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem)
    process.exitCode = 1
    return
  }

  // A `prepack` runs in its own package; from the root, every package is written.
  const only = plugins.has(basename(process.cwd())) ? basename(process.cwd()) : undefined
  const targets = only === undefined ? [...plugins.keys()] : [only]

  if (check) {
    console.log(`third-party notices: ${plugins.size} package(s) agree with ${relative(repoRoot, SOURCE)}`)
    return
  }

  for (const name of targets) {
    const { dir } = plugins.get(name)
    writeFileSync(join(dir, TARGET), render(name, sections))
  }
  console.log(`third-party notices: wrote ${targets.length} package file(s)`)
}

main(process.argv.slice(2))
