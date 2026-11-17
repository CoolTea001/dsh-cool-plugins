/**
 * @dsh-cool/ui — the shared UI of the DSH plugins in this repository.
 *
 * The package exists to make one thing true: every plugin page is drawn from the
 * same parts, so a user never meets two answers to "what does an empty state look
 * like" or "how wide is a centred column". It is deliberately small, and
 * deliberately not a design system of its own.
 *
 * ## What it does not own
 *
 * No palette, no type scale, no radius. Every color a rule here names is a
 * `--dsw-*` token, so a page follows the active light or dark appearance —
 * including the third-party presets `dsh-cool-theme` ships — and a retint done
 * in the theme plugin reaches this package for free. The shell's own controls
 * stay the shell's: they are re-exported from `./primitives.js` with real types
 * rather than restyled, because a restyled copy is a second control the product
 * has to keep in step.
 *
 * ## What it does own
 *
 * 1. **The stylesheet's ownership record** — one insertion path, one tag, one
 *    rule about who may remove it. See `insertPluginStyles`.
 * 2. **The gestures and hand-offs that are wrong in ways only a user notices** —
 *    a drag's pointer capture, the composer seat's removal, a theme wallpaper
 *    showing through a page's canvas.
 * 3. **The API surface of the shell's primitives** — one declaration instead of
 *    one per plugin.
 *
 * ## How a plugin consumes it
 *
 * It is a workspace-only dev dependency, inlined into the plugin's client bundle
 * by `@dsh-cool/tsdown-config` (which inlines every `@dsh-cool/` scope), so it
 * must not move to `dependencies`: the page's module table knows nothing about
 * it, and a runtime `require` would throw only when a user opens that panel.
 *
 * ```json
 * { "devDependencies": { "@dsh-cool/ui": "workspace:*" } }
 * ```
 *
 * ```ts
 * // src/client/index.ts
 * export function apply(ctx) {
 *   ctx.effect(() => insertPluginStyles(PACKAGE_ID, PAGE_CSS), 'dsh-cool-git: styles')
 * }
 * ```
 *
 * Because it is inlined, a change here needs the consuming plugins rebuilt
 * before the page changes; that is the price of zero runtime coupling between
 * independently versioned packages.
 */

// The stylesheet: one insertion path, the shared rules, and the class-name helper.
export {
  PANEL_VARS,
  UI_CSS,
  UI_PREFIX,
  composerSeatCss,
  insertPluginStyles,
  uiClass,
  wallpaperCss,
} from './styles/inject.js'

// The shell's primitives, re-exported with the package's own types.
export * from './primitives.js'

// Layout: the one pointer gesture, the persisted layout, and the width clamp.
export { ResizeHandle } from './layout/resize-handle.js'
export type { ResizeAxis, ResizeHandleProps } from './layout/resize-handle.js'
export {
  clampSideWidth,
  finiteNumber,
  fraction,
  parseLayout,
  readLayout,
  writeLayout,
} from './layout/layout-store.js'
export type { LayoutField } from './layout/layout-store.js'

// The scroll panels: the pointer's bar, and the dissolving edge.
export { PanelScroll } from './panel/panel-scroll.js'
export type { PanelScrollProps } from './panel/panel-scroll.js'
export { PanelShadow } from './panel/panel-shadow.js'
export type { PanelShadowProps } from './panel/panel-shadow.js'
export type { PanelAxis, PanelScrollDirection } from './panel/scrollport.js'

// Shell hand-offs a full-height page owes the Conversation around it.
export { suppressComposerSeat, useComposerSeatSuppression } from './shell/composer-seat.js'

// The Markdown delegate's one required non-optional field, and how to answer it.
export { inheritFileDrag, refuseFileDrag } from './markdown-file-drag.js'
