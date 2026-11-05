/**
 * Where dsh-cool-daily keeps its data.
 *
 * The same convention the other cool plugins use: `$DSH_HOME/cool-daily`, with
 * `DSH_HOME` winning and `~/.dsh` as the fallback. The articles directory is the
 * plugin's durable output — Markdown files a user can open in any editor — so it
 * is a visible directory rather than an opaque store.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

/** The harness home, resolved the way the rest of DSH resolves it. */
export function harnessHome(): string {
  const configured = process.env.DSH_HOME?.trim()
  return configured ? configured : join(homedir(), '.dsh')
}

/** Root of this plugin's data. */
export function dataRoot(): string {
  return join(harnessHome(), 'cool-daily')
}

/** The Markdown article directory. */
export function articlesDir(): string {
  return join(dataRoot(), 'articles')
}

/** The settings document. */
export function settingsPath(): string {
  return join(dataRoot(), 'settings.json')
}
