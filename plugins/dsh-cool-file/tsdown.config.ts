import { readFileSync } from 'node:fs'
import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-file'

/**
 * Icons are drawn from `src/client/assets/*.svg`.
 *
 * The browser half is loaded by the platform's module loader as one JS file, so
 * a sibling asset would never be fetched at runtime. The artwork is read here at
 * build time and exposed as a `__DSH_CF_ICONS__` string map that
 * `src/client/icons.tsx` consumes. The map is keyed by asset filename stem:
 * adding an asset means adding its entry here and its component there.
 */
const icons: Record<string, string> = {
  refresh: readFileSync(new URL('./src/client/assets/refresh.svg', import.meta.url), 'utf8'),
  show: readFileSync(new URL('./src/client/assets/show.svg', import.meta.url), 'utf8'),
  hide: readFileSync(new URL('./src/client/assets/hide.svg', import.meta.url), 'utf8'),
  arrow: readFileSync(new URL('./src/client/assets/arrow.svg', import.meta.url), 'utf8'),
}

export default dshPlugin({
  packageId: PACKAGE_ID,
  // The tokenizer's grammars are the bulk of this bundle, and they are data:
  // minifying costs nothing debuggable at runtime and trims the code around
  // them.
  clientMinify: true,
  // Everything is inlined on purpose: the page never resolves a package that is
  // not a shell seed, so a runtime `require('shiki')` would fail and the preview
  // would lose its colours. The allowlist check is off because Shiki's
  // transitive packages are its implementation detail, not dependencies this
  // package should enumerate.
  quietBundledDeps: true,
  clientDefine: {
    // The icon map is built from the assets above rather than imported, so the
    // bundle carries its own artwork and fetches nothing at runtime.
    __DSH_CF_ICONS__: JSON.stringify(icons),
  },
})
