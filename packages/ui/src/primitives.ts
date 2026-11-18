/**
 * The shell's own controls, re-exported — the one place a plugin reaches them.
 *
 * `@deepseek-ai/dsh-client-ui-primitives` is answered by the page's module table
 * before any plugin bundle runs, so every plugin that draws a dialog, a menu or
 * a button is already a consumer of it. What used to differ between plugins was
 * not the module but the *description* of it: five packages each carried a
 * hand-written ambient `.d.ts` covering "the subset this plugin uses", 829 lines
 * in total, and two of those subsets already disagreed about whether `Button`
 * takes a `variant` of `'danger'` or `'toolbar'`.
 *
 * So the module stays external at runtime — `@dsh-cool/tsdown-config` keeps it in
 * `deps.neverBundle` — and this file is a typed, named re-export of exactly the
 * surface the plugins in this repository draw through. Three consequences are
 * deliberate:
 *
 * 1. **One declaration of the API.** A plate change in the shell is one edit
 *    here, not five.
 * 2. **An auditable surface.** `export {...} from` lists what a plugin may use;
 *    `export *` would silently hand every new shell export to every plugin.
 * 3. **A real type, not a hand-written one.** These are re-exports of the
 *    package's own `.d.ts`, so an argument renamed upstream is a compile error
 *    here instead of a runtime surprise.
 *
 * The risk this arrangement accepts: the practice guidance for plugin authors
 * treats these components as DSH internals that may change without notice. A
 * re-export does not change that — it concentrates it. When the shell renames a
 * prop, this file fails to typecheck, in one place, before any plugin ships.
 *
 * Keep the list to what is used. A plugin that needs something new adds it here
 * with a comment saying what it draws with it.
 */

// Controls. `Button` also re-exports the shell's own variant union, which is
// what keeps a plugin from inventing a fifth weight.
export { Button } from '@deepseek-ai/dsh-client-ui-primitives'
export type { ButtonVariant } from '@deepseek-ai/dsh-client-ui-primitives'

// Dialogs and menus. `Modal` owns the body portal, the mask, the focus walk,
// Escape and returning focus to the opener, which is why no plugin re-implements
// it; `Menu` owns the anchored list and its keyboard walk.
export { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
export { Menu, MenuItemButton } from '@deepseek-ai/dsh-client-ui-primitives'
export type { MenuEntry, MenuItem, MenuLabel, MenuSeparator } from '@deepseek-ai/dsh-client-ui-primitives'

// Fields and switches.
export { Input } from './input.js'
export type { InputProps } from './input.js'
export { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
export { SegmentedControl } from '@deepseek-ai/dsh-client-ui-primitives'
export type { SegmentedControlOption } from '@deepseek-ai/dsh-client-ui-primitives'
export { SegmentedTabs } from '@deepseek-ai/dsh-client-ui-primitives'
export type { SegmentedTab } from '@deepseek-ai/dsh-client-ui-primitives'
export { SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'
export type { SettingsFieldProps } from '@deepseek-ai/dsh-client-ui-primitives'

// Small marks.
export { Tag } from '@deepseek-ai/dsh-client-ui-primitives'
export type { TagTone } from '@deepseek-ai/dsh-client-ui-primitives'
export { Pill } from '@deepseek-ai/dsh-client-ui-primitives'
export { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
export type { TooltipSide } from '@deepseek-ai/dsh-client-ui-primitives'
export { Toast } from '@deepseek-ai/dsh-client-ui-primitives'

// Rendered media and text the shell already knows how to draw: the document
// renderer, its delegate seat (local images and links), the image lightbox.
export { MarkdownText, MarkdownDelegateProvider, useMarkdownDelegate } from '@deepseek-ai/dsh-client-ui-primitives'
export type {
  MarkdownDelegate,
  MarkdownDelegateProviderProps,
} from '@deepseek-ai/dsh-client-ui-primitives'
export { ImageLightbox } from '@deepseek-ai/dsh-client-ui-primitives'

// Behaviour the shell owns and a plugin must not re-implement: putting a panel
// on the page's one layer stack (Escape order, focus trap), dismissing on an
// outside pointer, and writing to the clipboard the way the product does.
export { useModalLayer } from '@deepseek-ai/dsh-client-ui-primitives'
export { useDismissOnOutsidePointer } from '@deepseek-ai/dsh-client-ui-primitives'
export { writeClipboard } from '@deepseek-ai/dsh-client-ui-primitives'

// Two glyphs still taken from the shell rather than the local artwork: the
// select caret the shell's own select uses, and the outline trash the native
// Session menu uses. They come through `@dsh-cool/icons/shell`, which is the
// one place a shell icon is named by name — this file re-exports the two it
// hands to plugins so a plugin still has a single import for both sets.
export {
  IconChevronDownOutlineRegular,
  IconTrashOutlineRegular,
} from '@dsh-cool/icons/shell'
