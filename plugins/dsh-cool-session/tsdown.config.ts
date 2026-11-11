import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dshPlugin } from '@dsh-cool/tsdown-config'

const PACKAGE_ID = 'dsh-cool-session'

/**
 * The client's icon artwork comes from `src/client/assets/*.svg`.
 *
 * The browser half is one JS file the module loader evaluates, so the SVG files
 * themselves are never fetched. They are read here and handed to the bundle as
 * the `__DSH_CS_ICONS__` string map `src/client/icons.ts` consumes, keyed by
 * filename stem.
 */
const ICON_DIR = fileURLToPath(new URL('./src/client/assets', import.meta.url))
const ICONS: Record<string, string> = {}
for (const file of readdirSync(ICON_DIR)) {
  if (file.endsWith('.svg')) ICONS[file.replace(/\.svg$/, '')] = readFileSync(join(ICON_DIR, file), 'utf8')
}
if (Object.keys(ICONS).length === 0) {
  throw new Error(`dsh-cool-session: no icon assets found in ${ICON_DIR}`)
}

export default dshPlugin({
  packageId: PACKAGE_ID,
  clientDefine: {
    // The icon map is built from the assets above rather than imported, so the
    // bundle carries its own artwork and fetches nothing at runtime.
    __DSH_CS_ICONS__: JSON.stringify(ICONS),
    // The stylesheet's ownership tag has to name the id the loader registers
    // this bundle under, so the banner and the tag read the one constant.
    __DSH_CS_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
  },
})
