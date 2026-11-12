# @dsh-cool/icons

A private, client-only React icon set shared by the plugins in this repository.

Every glyph is a normal `.tsx` component, so a plugin bundle inlines only the
icons it imports. There is no runtime asset fetch, no SVG loader, and no codegen
step.

## Usage

The package is a workspace-only dev dependency. It is inlined into each plugin's
client bundle by `@dsh-cool/tsdown-config`, so it must not move to
`dependencies`.

```json
{
  "devDependencies": {
    "@dsh-cool/icons": "workspace:*"
  }
}
```

```tsx
import { IconPlus, IconTrash } from '@dsh-cool/icons'

<IconPlus />
<IconTrash size={14} className="danger" />
```

Every icon accepts the same props:

| Prop | Type | Description |
| --- | --- | --- |
| `size` | `number` | Square edge in px. Defaults to `16`. |
| `className` | `string` | Extra class for the seat that owns layout. |
| `title` | `string` | Accessible name. Without it the glyph is `aria-hidden`. |

The artwork draws in `currentColor`, so the surrounding control owns the hover,
disabled, and danger colors. The `size` attribute is a presentation attribute;
a CSS rule such as `.dsh-cg-icon svg { width: 13px }` still overrides it.

## Adding an icon

1. Create `src/<name>.tsx` with a function component:

   ```tsx
   import type { ReactElement } from 'react'
   import { IconBase, type IconProps } from './icon.js'

   export function IconBookmark(props: IconProps): ReactElement {
     return (
       <IconBase {...props} viewBox="0 0 24 24">
         <path
           fill="none"
           stroke="currentColor"
           strokeLinecap="round"
           strokeLinejoin="round"
           strokeWidth="2"
           d="M6 4h12v17l-6-5l-6 5z"
         />
       </IconBase>
     )
   }
   ```

2. Re-export it from `src/index.ts`.
3. Run `pnpm --filter @dsh-cool/icons check`.

Conventions:

- 24×24 viewBox unless the artwork needs another grid (the npm mark is 128×128).
- Use `currentColor` for monochrome glyphs; brand marks may keep their own colors.
- Do not set `width`/`height`/`xmlns` on the root — `IconBase` owns those.
- Keep the artwork's own `strokeWidth`; the set is not forced to one weight.
- The `title` prop is for an accessible name. A label on the surrounding control
  is better for menu rows and icon buttons.

SVG attribute names follow JSX casing: `stroke-width` → `strokeWidth`,
`stroke-linecap` → `strokeLinecap`, `fill-rule` → `fillRule`, `class` →
`className`.

## Local icons

A plugin-specific glyph does not have to live here. Import `IconBase` and use the
same root contract:

```tsx
import { IconBase, type IconProps } from '@dsh-cool/icons'

export function IconLocal(props: IconProps) {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path d="…" fill="none" stroke="currentColor" strokeWidth="2" />
    </IconBase>
  )
}
```

## Icon catalog

The catalog is a dev-only Vite page under `catalog/`. It is not exported from the
package and is never imported by a plugin.

```bash
pnpm --filter @dsh-cool/icons dev:catalog
```

It is a display-only catalog: every icon exported by `src/index.ts` is shown with
its component name and source file name, and a single search field filters both
names. There are no size, color, or copy controls. The page uses the Mono light
theme, keeps its header pinned while scrolling, and centers each icon's component
and file names.

A static build is available with:

```bash
pnpm --filter @dsh-cool/icons build:catalog
pnpm --filter @dsh-cool/icons preview:catalog
```

## DOM injection

This package exports React components, not SVG strings. A plugin that writes
markup into shell-owned DOM (the theme palette and session archive navigation
icons are examples) should keep that string local to the plugin. If such cases
grow, render the component into the seat with `createRoot` from
`react-dom/client` instead.

## Notes

- The package is `private` and source-only. `pnpm -r publish` skips it.
- If it ever needs to be published, add a build that emits `lib/` and switch
  `exports` to the built files; the component API does not change.
- Most artwork comes from Lucide Icons; the GitHub mark is from Bootstrap
  Icons and the npm mark is from Devicon. See `THIRD_PARTY_NOTICES.md`.
- Individual icon files intentionally omit per-file source comments. Provenance
  and license texts live in `THIRD_PARTY_NOTICES.md`, which must travel with any
  distribution that inlines the artwork.
