import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

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

/**
 * Two artifacts, one package.
 *
 * The Host half is plain Node ESM (`lib/index.js`). The browser half is a
 * single CommonJS file wrapped in the platform's module-loader call
 * (`lib/client.js`): the page loads it as one script and hands it the shared
 * React instance, so `react` and `react-dom` stay `require` calls instead of
 * being inlined — a second copy of React in the bundle would break hooks
 * against the shell's own renderer.
 */
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
      __DSH_CF_ICONS__: JSON.stringify(icons),
    },
    deps: {
      // Seed words the web boot answers before any bundle materializes
      // (packages/client/web/src/platform.ts): they must stay `require`
      // calls rather than being inlined.
      neverBundle: ['react', 'react-dom', '@deepseek-ai/dsh-client-ui-primitives'],
      // The syntax highlighter, by contrast, is deliberately inlined: the page
      // never resolves a package that is not one of the seeds above, so a
      // runtime `require('highlight.js')` would fail and the preview would lose
      // its colours. Naming it here keeps the inlining intentional.
      onlyBundle: ['highlight.js'],
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
