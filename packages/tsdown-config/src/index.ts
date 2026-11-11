/**
 * The shared build preset for every DSH plugin package in this repository.
 *
 * Two facts shape it, and both are easy to get wrong by hand:
 *
 * 1. A plugin is two bundles with two different module worlds. The Host half is
 *    an ordinary ESM module loaded by Node. The browser half is one CJS file the
 *    platform's module loader evaluates through its own `require`, wrapped in
 *    `window.__ModuleLoader__.load({ id, factory })`, where the id must equal
 *    the package name.
 *
 * 2. `react`, `react-dom`, and the seeded `@deepseek-ai/*` packages are answered
 *    by that loader, so they stay `require` calls. Everything else — including
 *    every workspace package under `@dsh-cool/` — is inlined. Leaving a
 *    workspace package as a runtime dependency produces a client bundle that
 *    throws only when a user opens that panel.
 */
import { defineConfig, type UserConfig } from 'tsdown'

/** Workspace scopes inlined into both halves rather than resolved at runtime. */
const WORKSPACE_SCOPES: RegExp[] = [/^@dsh-cool\//]

/**
 * Specifiers the browser module table answers. Mirrors `PLATFORM_MODULES` in
 * `packages/client/web/src/platform.ts` for the subset a plugin may use.
 */
const CLIENT_SEEDS = ['react', 'react-dom', '@deepseek-ai/dsh-client-ui-primitives']

/** Asset kinds tsdown can hand to the bundle as source text. */
export type ClientLoader = NonNullable<UserConfig['loader']>

/** Options a package may override per half. */
export interface DshPluginOptions {
  /**
   * Bundle id the loader registers. Defaults to the package name, which is what
   * every plugin should use: the loader resolves `<id>/client` and the bare id
   * to the same exports, so a mismatch only shows up as a missing factory.
   */
  packageId: string
  /** Client entry, default `src/client/index.ts`. */
  clientEntry?: string
  /** Host entry, default `src/host/index.ts`. */
  hostEntry?: string
  /** Additional build-time constants for the client half. */
  clientDefine?: Record<string, string>
  /**
   * Extra specifiers to keep as runtime `require` calls. Merged with the seed
   * table; a package normally needs this only for a seed it does not restate.
   */
  clientNeverBundle?: string[]
  /**
   * Extra specifiers to force into the bundle. Merged with the `@dsh-cool/`
   * workspace scopes, which are always inlined.
   */
  clientAlwaysBundle?: (string | RegExp)[]
  /**
   * Turn off the advisory that lists a package's own `devDependencies` pulled
   * into the bundle. Set it when inlining a large third-party library is the
   * deliberate choice, so the warning is not read as an oversight.
   */
  quietBundledDeps?: boolean
  /**
   * Minify the client bundle. Worth it when it carries large data (grammars).
   *
   * Only the `true` case is forwarded. Omitting the field is NOT the same as
   * passing `false`: tsdown forwards an explicit `false` to rolldown, whose
   * output then differs from the field being absent. Several plugins built
   * without it, so the preset leaves it out unless asked.
   */
  clientMinify?: boolean
  /**
   * Import a non-JS asset as its source text, for example `{ '.svg': 'text' }`.
   * The client half is a single file, so sibling assets would never be
   * fetched; the artwork has to end up inside the bundle.
   */
  clientLoader?: ClientLoader
}

/**
 * Build the two tsdown configs a DSH plugin needs.
 *
 * @param options - package identity and optional overrides.
 * @returns the configs, ready to export as the default export.
 */
export function dshPlugin(options: DshPluginOptions): UserConfig[] {
  const {
    packageId,
    clientEntry = 'src/client/index.ts',
    hostEntry = 'src/host/index.ts',
    clientDefine = {},
    clientNeverBundle = [],
    clientAlwaysBundle = [],
    quietBundledDeps = false,
    clientMinify = false,
    clientLoader,
  } = options

  return [
    {
      name: packageId,
      entry: { index: hostEntry },
      outDir: 'lib',
      format: 'esm',
      platform: 'node',
      target: 'es2024',
      fixedExtension: false,
      dts: false,
    },
    {
      name: `${packageId}/client`,
      entry: { client: clientEntry },
      outDir: 'lib',
      format: 'cjs',
      platform: 'browser',
      target: 'es2022',
      fixedExtension: false,
      dts: false,
      ...(clientMinify ? { minify: true } : {}),
      ...(clientLoader === undefined ? {} : { loader: clientLoader }),
      define: clientDefine,
      deps: {
        neverBundle: [...CLIENT_SEEDS, ...clientNeverBundle],
        alwaysBundle: [...WORKSPACE_SCOPES, ...clientAlwaysBundle],
        ...(quietBundledDeps ? { onlyBundle: false as const } : {}),
      },
      outputOptions: {
        entryFileNames: 'client.js',
        banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageId)}, factory: (require) => {`,
        footer: 'return module.exports; } });',
        intro: 'var module = { exports: {} }; var exports = module.exports;',
      },
    },
  ]
}

export { defineConfig }
