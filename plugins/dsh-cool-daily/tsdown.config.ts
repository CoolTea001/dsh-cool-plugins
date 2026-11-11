import { defineConfig } from 'tsdown'

const PACKAGE_ID = 'dsh-cool-daily'

/**
 * Two halves, two bundles:
 *
 * - `src/host` runs inside the DSH Host as an ES module.
 * - `src/client` is loaded by the platform's browser module loader as a single
 *   CJS file, so it is wrapped in the loader's `load` call rather than emitted
 *   as a plain module.
 *
 * Both entries are built from the source files; this config only shapes them.
 * The client half additionally reads `assets/*.svg` as text, so the artwork is
 * already inside the published `lib/client.js` and the browser fetches nothing.
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
    // Icons are read as their own source text (see src/client/icons.tsx), which
    // keeps the published package JavaScript-only: `files` ships `lib`, and the
    // artwork is already inside it by the time the bundle is written.
    loader: { '.svg': 'text' },
    define: {
      // The stylesheet's ownership tag has to name the id the loader registers
      // this bundle under, so the banner and the tag read the one constant.
      __DSH_CD_PLUGIN_ID__: JSON.stringify(PACKAGE_ID),
    },
    deps: {
      // React and the Host UI primitives come from the browser module table:
      // inlining them would install a second copy beside the shell's.
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
