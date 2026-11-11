#!/usr/bin/env node
/**
 * Guard the one failure mode that reaches users silently.
 *
 * A plugin's browser half is served as a single built file, and the platform's
 * module loader answers only the shell-seeded table below. Any other bare
 * `require(...)` in that file — a shared workspace package that was not
 * inlined, or a third-party library declared in `dependencies` instead of
 * `devDependencies` — throws at materialization, which is to say only when a
 * user opens that panel.
 *
 * The bundle is located through each manifest's own `exports["./client"]`
 * rather than a guessed `lib/client.js` filename: the loader reads that export,
 * so checking anything else would verify a different artifact from the one that
 * ships.
 */
import { globSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

/** Workspace scopes whose packages must always be inlined into a client bundle. */
const WORKSPACE_SPECIFIERS = [/^@dsh-cool\//, /^@cooltea\//]

/**
 * The platform module table, mirrored from `PLATFORM_MODULES` in
 * `packages/client/web/src/platform.ts`. The shell answers these, so a bare
 * require of one is correct and must not be reported.
 */
const PLATFORM_SPECIFIERS = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  'zod',
  '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
])

/** Resolve the file a manifest publishes as its client half, or null. */
function clientBundleOf(manifestPath) {
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    return null
  }
  const entry = manifest?.exports?.['./client']
  const target =
    typeof entry === 'string' ? entry : typeof entry?.default === 'string' ? entry.default : null
  if (target === null) return null
  return { file: join(dirname(manifestPath), target), name: manifest?.name ?? manifestPath }
}

const manifests = ['plugins/*/package.json', 'web/*/package.json', 'package.json']
  .flatMap((pattern) => globSync(pattern))
  .filter((path) => !path.startsWith('node_modules/'))
  .sort()

const bundles = manifests.map(clientBundleOf).filter((found) => found !== null)

const missing = []
const failures = []
for (const bundle of bundles) {
  let source
  try {
    source = readFileSync(bundle.file, 'utf8')
  } catch {
    missing.push(`${bundle.name}: ${relative(process.cwd(), bundle.file)} does not exist — run the build first`)
    continue
  }
  for (const match of source.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    const specifier = match[1]
    if (specifier.startsWith('.') || specifier.startsWith('node:')) continue
    if (PLATFORM_SPECIFIERS.has(specifier)) continue
    if (WORKSPACE_SPECIFIERS.some((pattern) => pattern.test(specifier))) {
      failures.push(
        `${relative(process.cwd(), bundle.file)}: require("${specifier}") — a workspace package was not inlined; `
          + "add it to deps.alwaysBundle in that package's tsdown.config.ts",
      )
    }
  }
}

if (missing.length > 0) {
  console.error(missing.join('\n'))
  process.exit(1)
}
if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
if (bundles.length === 0) {
  console.log('no client bundles declared yet — nothing to check')
  process.exit(0)
}
console.log(`checked ${bundles.length} client bundle(s): no workspace package leaked`)
