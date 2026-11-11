import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-terminal'

/**
 * xterm's own stylesheet is inlined into the client bundle.
 *
 * The browser half is loaded by the platform's module loader from one JS file,
 * so a sibling `.css` asset would never be fetched; a build-time `define` keeps
 * the dependency's stylesheet authoritative instead of vendoring a copy into
 * `src/`.
 *
 * Resolved through `createRequire` rather than a `./node_modules/...` URL,
 * because pnpm keeps the package in the workspace store where that path does
 * not exist.
 */
const require = createRequire(import.meta.url)
const XTERM_CSS = readFileSync(require.resolve('@xterm/xterm/css/xterm.css'), 'utf8')

/**
 * The client icons come from `src/client/assets/*.svg`. The browser half is one
 * JS file, so sibling asset files would never be fetched; the artwork is read
 * here at build time and exposed as the `__DSH_CT_ICONS__` string map
 * `src/client/icons.tsx` consumes, keyed by asset filename stem.
 */
const ICON_DIR = fileURLToPath(new URL('./src/client/assets', import.meta.url))
const ICONS: Record<string, string> = {}
for (const file of readdirSync(ICON_DIR)) {
  if (file.endsWith('.svg')) ICONS[file.replace(/\.svg$/, '')] = readFileSync(join(ICON_DIR, file), 'utf8')
}
if (Object.keys(ICONS).length === 0) {
  throw new Error(`dsh-cool-terminal: no icon assets found in ${ICON_DIR}`)
}

export default dshPlugin({
  packageId: PACKAGE_ID,
  // xterm is a build-time-only devDependency: the platform's module loader knows
  // nothing about it, so it must be inlined rather than resolved at runtime.
  // Naming it explicitly keeps that true if the package is ever promoted.
  clientAlwaysBundle: ['@xterm/xterm', '@xterm/addon-fit'],
  // Bundling is deliberate here, not an oversight: silence the advisory that
  // lists dependencies pulled into the bundle.
  quietBundledDeps: true,
  clientDefine: {
    __DSH_CT_XTERM_CSS__: JSON.stringify(XTERM_CSS),
    __DSH_CT_ICONS__: JSON.stringify(ICONS),
  },
})
