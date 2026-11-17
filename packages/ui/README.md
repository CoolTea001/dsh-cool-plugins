# @dsh-cool/ui

A private, source-only React UI package shared by the DSH plugins in this
repository. Its job is to make one thing true: every plugin page is drawn from
the same parts, so a user never meets two answers to "what does an empty state
look like" or "how wide is a centred column".

It is a workspace-only dev dependency. `@dsh-cool/tsdown-config` inlines every
`@dsh-cool/` scope into each plugin's client bundle, so it must not move to
`dependencies`: the page's module table knows nothing about it, and a runtime
`require` would throw only when a user opens that panel.

## What it does not own

No palette, no type scale, no radius. Every color a rule here names is a
`--dsw-*` theme token, so a page follows the active light or dark appearance —
including the third-party presets `dsh-cool-theme` ships. The shell's own
controls stay the shell's: they are re-exported with their real types rather than
restyled, because a restyled copy is a second control the product has to keep in
step.

## What it owns

| Layer | Export | Why it is shared |
| --- | --- | --- |
| Stylesheet | `insertPluginStyles`, `UI_CSS`, `uiClass` | One insertion path, one tag, one rule about who may remove it |
| Stylesheet | `composerSeatCss`, `wallpaperCss` | Two selectors that have to agree with the sheet they join |
| Layout | `ResizeHandle` | One pointer gesture for every resizable boundary |
| Layout | `readLayout`, `parseLayout`, `writeLayout`, `finiteNumber`, `fraction`, `clampSideWidth` | A remembered width is data, not a fact |
| Shell | `suppressComposerSeat`, `useComposerSeatSuppression` | The Conversation shell keeps a composer seat for every View |
| Markdown | `inheritFileDrag`, `refuseFileDrag` | The renderer's one required non-optional callback |
| Primitives | `Button`, `Modal`, `Input`, `Menu`, … | One declaration of the shell's API instead of one per plugin |

## Usage

```json
{
  "devDependencies": {
    "@dsh-cool/ui": "workspace:*"
  }
}
```

```ts
// src/client/index.ts
import { insertPluginStyles } from '@dsh-cool/ui'

export function apply(ctx: any): void {
  ctx.effect(() => insertPluginStyles(PACKAGE_ID, PAGE_CSS), 'dsh-cool-x: styles')
}
```

```ts
// src/client/layout.ts
import { finiteNumber, fraction, readLayout, writeLayout } from '@dsh-cool/ui'

const KEY = 'dsh-cool-x.layout.v1'
const FIELDS = { sideWidth: finiteNumber(300), filesShare: fraction(0.5) } as const

export const readSideLayout = () => readLayout(KEY, FIELDS)
export const writeSideLayout = (layout: Layout) => writeLayout(KEY, layout)
```

```tsx
// src/client/page.tsx
import { ResizeHandle, useComposerSeatSuppression, composerSeatCss } from '@dsh-cool/ui'
```

Because the package is inlined, a change here needs every consuming plugin
rebuilt before the page changes. That is the price of zero runtime coupling
between independently versioned packages.

## Conventions

- **No sentences.** A component takes text as props — labels, accessible names,
  status words. The plugin is what knows the active language.
- **No DOM writes, no `<style>` of its own, no `document.body` appends.** The
  shell's `Modal` owns portals; a plugin's `apply()` owns its sheet.
- **Controlled.** Open state, pane widths and drafts belong to the caller; a
  persistence key is passed in.
- **Tokens only.** `--dsw-alias-*`, `--dsw-radius-*`, `--dsw-focus-ring-*`. The
  only literal colors are fully transparent ones and `color-mix()` darkening.
- **No `<svg>`.** Icons come from `@dsh-cool/icons`.

`scripts/check-ui-boundary.mjs` enforces the last two, plus the two module-graph
rules: only this package may import the shell's primitives, and no published
`.d.ts` may reference a `@dsh-cool/` package.

## Adding a component

1. Add it under `src/<area>/`.
2. Export it from `src/index.ts`, with a one-line comment saying what it is for.
3. If it has rules, add them to `UI_CSS` rather than shipping a second sheet.
4. Run `pnpm --filter @dsh-cool/ui check`.

## Notes

- The package is `private` and source-only. `pnpm -r publish` skips it.
- It depends on `@deepseek-ai/dsh-client-ui-primitives` for types only, pinned to
  the version the installed DSH ships. A mismatch would describe an API the
  runtime does not have — that is how a hand-written declaration once let a
  plugin pass `anchorRef` to a `Menu` that had no such prop.
