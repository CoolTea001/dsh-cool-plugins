import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-git'

/**
 * The client icons come from `src/client/assets/*.svg`.
 *
 * The browser half is loaded by the platform's module loader as one JS file, so
 * sibling asset files would never be fetched; the artwork is read here at build
 * time and exposed as the `__DSH_CG_ICONS__` string map `src/client/icons.tsx`
 * consumes. The map is keyed by asset filename stem, so dropping a new SVG into
 * the directory (and exporting its component) is all an icon needs.
 *
 * The map is read once when this config loads, so a running `--watch` session
 * only sees a newly added SVG after it restarts; editing this file is what makes
 * `tsdown` reload the config.
 */
const ICON_DIR = fileURLToPath(new URL('./src/client/assets', import.meta.url))
const ICONS: Record<string, string> = {}
for (const file of readdirSync(ICON_DIR)) {
  if (file.endsWith('.svg')) {
    // Newlines are normalized to LF here. The SVGs are checked in with LF and
    // Git's autocrlf can hand this build CRLF; `JSON.stringify` would then embed
    // those as `\r\n` escapes, and since `lib/client.js` is committed, the
    // bundle's bytes would depend on the platform that rebuilt it.
    ICONS[file.replace(/\.svg$/, '')] = readFileSync(join(ICON_DIR, file), 'utf8').replace(/\r\n/g, '\n')
  }
}
if (Object.keys(ICONS).length === 0) {
  throw new Error(`dsh-cool-git: no icon assets found in ${ICON_DIR}`)
}

export default dshPlugin({
  packageId: PACKAGE_ID,
  clientDefine: {
    // The icon map is built from the assets above rather than imported, so the
    // bundle carries its own artwork and fetches nothing at runtime.
    __DSH_CG_ICONS__: JSON.stringify(ICONS),
    // The stylesheet's ownership tag has to name the id the loader registers
    // this bundle under, so the banner and the tag read the one constant.
    __DSH_CG_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
  },
})
