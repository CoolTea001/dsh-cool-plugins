import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
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
  },
})
