import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const PACKAGE_ID = 'dsh-cool-session'

/**
 * The client's own icon artwork comes from `src/client/assets/*.svg`.
 *
 * The browser half is one JS file the module loader evaluates, so the SVG files
 * themselves are never fetched. They are read here and handed to the bundle as
 * the `__DSH_CS_ICONS__` string map `src/client/icons.ts` consumes, keyed by
 * filename stem — the same arrangement dsh-cool-git uses.
 */
const ICON_DIR = fileURLToPath(new URL('./src/client/assets', import.meta.url))
const ICONS: Record<string, string> = {}
for (const file of readdirSync(ICON_DIR)) {
  if (file.endsWith('.svg')) ICONS[file.replace(/\.svg$/, '')] = readFileSync(join(ICON_DIR, file), 'utf8')
}
if (Object.keys(ICONS).length === 0) {
  throw new Error(`dsh-cool-session: no icon assets found in ${ICON_DIR}`)
}

export default defineConfig([
  {
    name: PACKAGE_ID,
    entry: { index: 'src/host/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
  },
  {
    name: `${PACKAGE_ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    define: {
      // The icon map is built from the assets above rather than imported, so
      // the bundle carries its own artwork and fetches nothing at runtime.
      __DSH_CS_ICONS__: JSON.stringify(ICONS),
      // The stylesheet's ownership tag has to name the id the loader registers
      // this bundle under, so the banner and the tag read the one constant.
      __DSH_CS_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
    },
    deps: {
      // Seed words the web boot answers before any bundle materializes
      // (packages/client/web/src/platform.ts): they must stay `require`
      // calls rather than being inlined.
      neverBundle: ['react', 'react-dom', '@deepseek-ai/dsh-client-ui-primitives'],
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
