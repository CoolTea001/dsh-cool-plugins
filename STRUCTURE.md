# Repository layout

English | [中文](STRUCTURE.zh.md)

One repository for every `dsh-cool-*` DSH plugin. Each plugin is still its own
npm package, its own version, and its own install unit — only the source lives
here.

## Directories

```
dsh-cool-plugins/
├── plugins/          one published npm package per directory
├── web/              standalone sites (private, never published)
├── packages/         shared libraries consumed by the above
├── scripts/          repository checks
├── .github/          CI workflows and release helpers
├── package.json      private root manifest, no `dsh` field
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

`plugins/*` and `web/*` and `packages/*` are three separate globs in
`pnpm-workspace.yaml` on purpose. A single `*/*` would not work: pnpm does not
recurse into a directory that has no `package.json`, so `plugins/` itself would
be matched and nothing inside it.

The root manifest is `private` and deliberately declares no `dsh` field. A root
`dsh.bundle` would make the repository root itself look like an installable
plugin.

## The two halves of a plugin

Every plugin package ships two bundles, and they have different module worlds:

| Half | Format | Loaded by | Module resolution |
|---|---|---|---|
| Host | ESM | Node | ordinary `import` |
| Client | CJS | the platform's module loader | its own `require` table |

The client half is one file, served from `lib/client.js`, wrapped as
`window.__ModuleLoader__.load({ id, factory })`. The `id` must equal the package
name.

The loader answers a fixed set of specifiers — `react`, `react-dom`, and the
seeded `@deepseek-ai/*` packages. Everything else must be inlined. That single
rule is why shared workspace packages go in `devDependencies` and carry an
`alwaysBundle` entry.

## Shared build preset

`@dsh-cool/tsdown-config` encodes both facts above, so a package does not repeat
them:

```ts
// plugins/dsh-cool-git/tsdown.config.ts
import { dshPlugin } from '@dsh-cool/tsdown-config'

export default dshPlugin({ packageId: 'dsh-cool-git' })
```

It sets the Host and Client formats, the loader banner and footer, the seed
`neverBundle` list, and `alwaysBundle` for `@dsh-cool/*`. A package with extra
build-time constants passes `clientDefine`; one that ships a client-only plugin
omits `hostEntry`.

## Shared libraries

A workspace library consumed by plugins is declared `private: true` and exports
TypeScript source:

```json
{
  "name": "@dsh-cool/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
```

Exporting source means no build-order dependency: tsdown reads the `.ts`
directly and `tsc` resolves it through the workspace link.

Consumers declare it in `devDependencies` with `workspace:*`. It is a
build-time input, not a runtime dependency, because it is compiled into `lib/`.
Declaring it in `dependencies` makes tsdown externalize it, and the resulting
`require("@dsh-cool/ui")` in the client bundle throws in the browser.

## The bundle guard

`scripts/check-client-bundles.mjs` fails the build when a client bundle still
requires a `@dsh-cool/*` package. It finds each bundle through the manifest's own
`exports["./client"]` rather than a guessed filename, so it checks the artifact
that actually ships.

This runs as part of `pnpm run check`, and again in CI. It is the only check that
catches the failure mode which otherwise appears only when a user opens a panel.

## Publishing

`pnpm -r publish` publishes only the packages whose version is not on the
registry yet. Bumping one package publishes one package.

```bash
pnpm --filter dsh-cool-git publish --access public
```

`private: true` packages are skipped automatically, so `packages/*` never needs
to be excluded by hand. The root `LICENSE` is packed into each member by pnpm.

## Installing into a profile

A package directory can be linked into a DSH profile directly, which is how the
plugins are developed locally:

```bash
dsh plugin --profile desktop add link:/Users/cooltea/Desktop/dsh-cool-plugins/plugins/dsh-cool-git
```

A linked directory is a live checkout, so `lib/` must be rebuilt after edits.
The Host half needs a restart to load new code; the browser half picks up a
rebuilt `client.js` on reload.

## Adding a plugin

1. Copy an existing `plugins/*` directory as the starting point.
2. Set `name`, `version`, and the `dsh` block in its `package.json`.
3. Write its own `cordis.patch.yml` with a unique entry id.
4. Point its `repository` at this repository with a `directory` field.
5. Run `pnpm install` and `pnpm run check`.
