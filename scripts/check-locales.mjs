#!/usr/bin/env node
/**
 * Guard every plugin's dictionaries against drift.
 *
 * A plugin's copy is split into one file per language, with `zh` as the key-set
 * source of truth: every other dictionary is typed against the union derived
 * from it, so the compiler already rejects a missing or invented key. This check
 * covers the two things the compiler cannot see:
 *
 * 1. **Placeholders.** `{count}` in English and `{quantidade}` in Portuguese
 *    both compile, and the second one silently renders as literal text because
 *    the locale service only substitutes the names it is given. Every dictionary
 *    must use exactly the placeholder set of the Chinese entry.
 * 2. **Plural pairs.** A `.one` entry without its `.other` compiles whenever both
 *    keys are listed in the union, but the caller picks between them at runtime,
 *    so a missing half shows a raw key name.
 *
 * A package whose dictionaries are still one `locales.ts` file carries no
 * `locales/` directory, and is left alone: this checks split sets only.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The languages every split dictionary set must ship. */
const REQUIRED = ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt']

/** Repository root, resolved from this script rather than the caller's cwd. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Read one dictionary file's top-level string entries. */
function parseDictionary(path) {
  const source = readFileSync(path, 'utf8')
  const start = source.indexOf('export const')
  const end = source.indexOf('} satisfies')
  if (start < 0 || end < 0) return null
  const body = source.slice(start, end)
  const entries = {}
  // Keys are quoted and values are single-quoted on the same line; a value may
  // contain escaped quotes, which the character class above admits.
  for (const match of body.matchAll(/^\s*'([^']+)':\s*'((?:[^'\\]|\\.)*)'/gmu)) {
    entries[match[1]] = match[2].replace(/\\'/gu, '\'').replace(/\\\\/gu, '\\')
  }
  return entries
}

/** The `{name}` placeholder set one template declares. */
function placeholders(template) {
  return [...template.matchAll(/\{(\w+)\}/gu)].map(match => match[1]).sort().join(',')
}

const problems = []
const checked = []

const pluginDirs = readdirSync(join(repoRoot, 'plugins'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => join(repoRoot, 'plugins', entry.name))
  .sort()

for (const pluginDir of pluginDirs) {
  const localeDir = join(pluginDir, 'src/client/locales')
  if (!existsSync(localeDir)) continue

  const name = basename(pluginDir)
  const files = new Set(readdirSync(localeDir).filter(file => file.endsWith('.ts')))
  const missing = REQUIRED.filter(id => !files.has(`${id}.ts`))
  if (missing.length > 0) {
    problems.push(`${name}: no dictionary for ${missing.join(', ')}`)
    continue
  }

  const dicts = {}
  for (const id of REQUIRED) {
    const parsed = parseDictionary(join(localeDir, `${id}.ts`))
    if (parsed === null) {
      problems.push(`${name}: ${id}.ts has no 'export const … } satisfies' body to read`)
      continue
    }
    dicts[id] = parsed
  }
  if (Object.keys(dicts).length !== REQUIRED.length) continue

  // A stray file beside the expected ids is how a renamed or misspelled locale
  // silently stops shipping: it registers under no id the shell ever selects.
  for (const file of files) {
    const id = file.slice(0, -'.ts'.length)
    if (!REQUIRED.includes(id)) problems.push(`${name}: ${file} is not one of ${REQUIRED.join(', ')}`)
  }

  const baseKeys = Object.keys(dicts.zh)
  if (baseKeys.length === 0) {
    problems.push(`${name}: zh.ts declares no entries`)
    continue
  }

  for (const id of REQUIRED) {
    const dict = dicts[id]
    const absent = baseKeys.filter(key => !(key in dict))
    const extra = Object.keys(dict).filter(key => !(key in dicts.zh))
    if (absent.length > 0) problems.push(`${name}/${id}: missing ${absent.join(', ')}`)
    if (extra.length > 0) problems.push(`${name}/${id}: unknown ${extra.join(', ')}`)
  }

  for (const key of baseKeys) {
    const want = placeholders(dicts.zh[key])
    for (const id of REQUIRED) {
      const got = placeholders(dicts[id][key] ?? '')
      if (got !== want) {
        problems.push(`${name}/${id}: "${key}" uses {${got}} where zh uses {${want}}`)
      }
    }
    // A count-bearing family must spell both branches the caller can pick.
    //
    // Only the `.one` direction is enforced: it is the half a lookup reaches
    // for a count of one, so a missing `.other` shows a raw key name. A lone
    // `.other` is not evidence of anything — dsh-cool-theme uses one as a
    // category name ("any other import failure"), with no singular beside it.
    if (key.endsWith('.one') && !(`${key.slice(0, -'.one'.length)}.other` in dicts.zh)) {
      problems.push(`${name}: "${key}" has no matching .other entry`)
    }
  }

  checked.push(`${name} (${REQUIRED.length} x ${baseKeys.length})`)
}

if (problems.length > 0) {
  console.error(`locale guard: ${problems.length} problem(s)`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`locale guard: ${checked.length} dictionary set(s) agree — ${checked.join(', ')}`)
