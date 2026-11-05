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
 * Both entries are empty shells for now; functionality is added to the source
 * files, not to this config.
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
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
