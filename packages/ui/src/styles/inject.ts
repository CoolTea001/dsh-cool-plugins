/**
 * Where a plugin's stylesheet enters the page, stated once.
 *
 * A plugin's browser half is one JS file evaluated by the platform's module
 * loader, so a sibling `.css` asset would never be fetched: every sheet is a
 * string, and the only question is who inserts it and who removes it.
 *
 * Two rules make that question harder than it looks.
 *
 * 1. A `<style>` tag is booked by the shell's module system. A tag that appears
 *    while some module materializes is claimed for that module, and a tag that
 *    carries no `data-plugin` at all is claimed by whichever module
 *    materializes next — then deleted with it (`removeOwnedStyles`) when that
 *    unrelated plugin is reloaded, disabled or pruned, while this page keeps
 *    rendering. That is how a plugin once lost its sheet and drew a
 *    panel-wide glyph where its icon seats should have been. The tag therefore
 *    has to name its owner, and the owner has to be the id the loader
 *    registered this bundle under.
 *
 * 2. The shell owns a styles service in some builds and not in others. When it
 *    is present, handing it the sheet is better than writing a tag by hand: the
 *    service books the ownership itself and disposes the sheet on unload. When
 *    it is absent, a hand-written tag with the same ownership record is the
 *    equivalent.
 *
 * Both halves live here rather than in each plugin because getting either
 * wrong is invisible until a user reloads a different plugin.
 */

/**
 * The stylesheet the shell's boot exposes to a client bundle, if this build has
 * one.
 *
 * Declared with `typeof` in the injector so a build without the global does not
 * throw at import time; see {@link insertPluginStyles}.
 */
declare const styles: { insert: (css: string) => () => void } | undefined

/** The shell's styles service, as much of it as a plugin may rely on. */
interface StylesService {
  /** Insert one sheet; the returned disposer removes it. */
  insert(css: string): () => void
}

/**
 * Hand one sheet to the shell's styles service.
 *
 * @param css - the sheet's text.
 * @returns its disposer, or null when this build has no service.
 */
function insertViaPlatform(css: string): (() => void) | null {
  try {
    const service = typeof styles === 'undefined' ? undefined : (styles as StylesService | undefined)
    if (service === undefined || typeof service.insert !== 'function') return null
    const dispose = service.insert(css)
    return typeof dispose === 'function' ? dispose : null
  } catch {
    // A service that throws is not a service this plugin can use; the fallback
    // below is the whole point of the return type.
    return null
  }
}

/**
 * Insert a plugin's stylesheet — the shared one included — as a single tag.
 *
 * The sheet is one tag rather than one per owner: the rule for the shared part
 * and the rule for a plugin's own part are equally owned by that plugin, and a
 * second tag would only be a second thing to leak. Callers hand in their own
 * rules and get the shared frame for free, which is what keeps two plugins from
 * shipping two subtly different empty-state or divider rules.
 *
 * Insert it from `apply()`, inside `ctx.effect`, so the disposer runs when the
 * plugin is unloaded or hot-replaced:
 *
 * ```ts
 * ctx.effect(() => insertPluginStyles(__DSH_CG_PLUGIN_ID__, GIT_CSS), 'dsh-cool-git: styles')
 * ```
 *
 * @param pluginId - the id the loader registered this bundle under; the tag's
 *   ownership record, and the value the shell books it by.
 * @param extraCss - the plugin's own rules, after the shared ones.
 * @returns a disposer removing exactly this sheet.
 */
export function insertPluginStyles(pluginId: string, extraCss?: string): () => void {
  const css = extraCss === undefined || extraCss === '' ? UI_CSS : `${UI_CSS}\n${extraCss}`
  const platformDispose = insertViaPlatform(css)
  if (platformDispose !== null) return platformDispose

  const element = document.createElement('style')
  element.setAttribute('data-plugin', pluginId)
  // The package's own name for its sheet, kept for readers of the DOM and for
  // the probes under `.tmp/`. It is a label, not the ownership record.
  element.setAttribute('data-dsh-cool-ui', pluginId)
  element.textContent = css
  document.head.appendChild(element)
  return () => {
    element.remove()
  }
}

/** The prefix every class in {@link UI_CSS} carries. */
export const UI_PREFIX = 'dsh-ui'

/**
 * The custom properties the scroll panels and {@link UI_CSS} agree on.
 *
 * They are written by `Scrollport` as inline style and read by the rules below.
 * Naming them in one place is what keeps a rule and the component that feeds it
 * from drifting apart after a rename — the same reason the class names go
 * through {@link uiClass}.
 *
 * `gutterX`/`gutterY` are the odd ones out: they are not configuration but a
 * measurement, written on every scroll pass. The edge masks need them because a
 * mask covers the scrollbar as well as the rows, and a faded thumb is a bar the
 * reader cannot see to grab.
 */
export const PANEL_VARS = {
  /** The thumb's alpha, as a CSS percentage. */
  barAlpha: '--dsh-ui-panel-bar-alpha',
  /** The bar's width. */
  barWidth: '--dsh-ui-panel-bar-width',
  /** How far an edge shade reaches in from the edge. */
  shade: '--dsh-ui-panel-shade',
  /** The measured width of the vertical scrollbar, or `0px`. */
  gutterX: '--dsh-ui-panel-gutter-x',
  /** The measured height of the horizontal scrollbar, or `0px`. */
  gutterY: '--dsh-ui-panel-gutter-y',
} as const

/**
 * Build a shared class name from a suffix.
 *
 * Callers write `uiClass('resize')` rather than `'dsh-ui-resize'`, so the
 * prefix is renamed in one place if it ever has to be.
 *
 * @param suffix - the part after the prefix, without a leading dash.
 * @returns the class name.
 */
export function uiClass(suffix: string): string {
  return `${UI_PREFIX}-${suffix}`
}

/**
 * The stylesheet rule half of the composer-seat hand-off.
 *
 * The Conversation shell keeps its composer seat mounted for every View and only
 * floats it when a View declares `data-conversation-composer-overlay`. A page
 * with no input of its own has to take the seat out, and the declarative half of
 * that lives here: the seat is hidden on every frame the shell paints, including
 * the frames before the page's mount effect has run.
 *
 * The rule is scoped by the page's own root class, which exists only while that
 * page is mounted, so the other tabs keep their composer untouched and the rule
 * disappears with the View. The imperative twin — the DOM write in
 * `useComposerSeatSuppression` — stays, deliberately redundant in the same
 * direction: it depends on nothing beyond the rendered tree.
 *
 * @param rootClass - the class the page renders on its root.
 * @returns one CSS rule, to append to the plugin's own sheet.
 */
export function composerSeatCss(rootClass: string): string {
  return `[data-conversation-scroll]:has(.${rootClass})>[data-composer-seat]{display:none}`
}

/**
 * The stylesheet rule half of the theme wallpaper's hand-off.
 *
 * `dsh-cool-theme` paints a fixed wallpaper layer behind the shell and marks the
 * document with `ct-bg-on` for as long as that layer is mounted. The theme clears
 * the shell's own canvas surfaces by name, but a plugin page that paints a
 * canvas of its own still covers the image with it. Rebinding the two canvas
 * tokens inside the page's root is what lets the image through, and it names
 * nothing about the page's parts.
 *
 * The scoping is the whole contract: a profile without the theme never matches
 * the selector, so the page draws its own opaque canvas exactly as it did
 * before. Everything raised above the canvas keeps its fill, because only these
 * two tokens are rebound.
 *
 * @param rootClass - the class the page renders on its root.
 * @returns one CSS rule, to append to the plugin's own sheet.
 */
export function wallpaperCss(rootClass: string): string {
  return `html.ct-bg-on .${rootClass}{--dsw-alias-bg-base:transparent;--dsw-alias-bg-layer-1:transparent}`
}

/**
 * The shared stylesheet.
 *
 * Every rule here is a fact more than one plugin has to state, and every color
 * is a `--dsw-*` theme token, so a rule follows the active light or dark
 * appearance — including third-party theme presets — instead of forcing a
 * palette of its own. Nothing in it paints a surface of its own: the classes are
 * applied inside a plugin's root, and the root keeps owning the canvas.
 *
 * What is here, and why each part is shared rather than copied:
 *
 * 1. The page frame — the one place a plugin gets a full-height column that
 *    paints no fill of its own, so a theme's wallpaper shows through it.
 * 2. The draggable boundary — one gesture, one hit target, one hover cue; three
 *    copies of it meant three chances for the cue to drift from the hit target.
 * 3. The scrollbar treatment — the shell's own tokens, applied the way its
 *    lists apply them.
 * 4. The wallpaper hand-off — `dsh-cool-theme` marks the document with
 *    `ct-bg-on` while it has a wallpaper mounted, and a plugin page that paints
 *    its own canvas has to clear the two tokens it paints with for the image to
 *    show through. The rule is scoped by the plugin's own root class, so a
 *    profile without the theme never matches it.
 */
export const UI_CSS = [
  // 1. The page frame.
  //
  // A full-height column, transparent by default: the shell already paints the
  // canvas behind a View, and a plugin that painted its own would cover a
  // theme's wallpaper for the whole tab. `min-height:0` at this level is what
  // lets the scroll regions inside shrink instead of stretching the page.
  `.${UI_PREFIX}-page{display:flex;flex:1 1 auto;flex-direction:column;box-sizing:border-box;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:transparent;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,sans-serif);font-size:12.5px;line-height:1.5}`,
  `.${UI_PREFIX}-page *{box-sizing:border-box}`,
  // A page that does want an opaque canvas asks for it by name, so the
  // transparent default stays a decision rather than an accident.
  `.${UI_PREFIX}-page[data-surface=canvas]{background:var(--dsw-alias-bg-base)}`,
  // The scroll region keeps its bar at the window edge instead of inside the
  // measure, which is what lets a centred column stay centred while the
  // scrollbar sits outside it.
  `.${UI_PREFIX}-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable both-edges}`,

  // 2. The draggable boundary.
  //
  // The element sits on a 1px boundary the pointer cannot be asked to hold, so
  // it covers that line and puts an invisible 8px band around itself as the hit
  // target. It takes no layout space: it is positioned on the neighbouring
  // box's own edge, so adding it moves nothing on the page.
  `.${UI_PREFIX}-resize{position:absolute;z-index:2;touch-action:none}`,
  `.${UI_PREFIX}-resize::before{content:"";position:absolute;opacity:0;transition:opacity .12s ease-out}`,
  `.${UI_PREFIX}-resize::after{content:"";position:absolute}`,
  `.${UI_PREFIX}-resize:hover::before,.${UI_PREFIX}-resize[data-dragging]::before{opacity:1}`,
  // A column boundary: vertical line, horizontal hit band.
  `.${UI_PREFIX}-resize[data-axis=col]{top:0;right:-1px;bottom:0;width:1px;cursor:col-resize}`,
  `.${UI_PREFIX}-resize[data-axis=col]::after{inset:0 -4px}`,
  `.${UI_PREFIX}-resize[data-axis=col]::before{inset:0;background:linear-gradient(to bottom,transparent,var(--dsw-alias-label-caption) 50%,transparent) center / 1px 100% no-repeat}`,
  // A row boundary: horizontal line, vertical hit band.
  `.${UI_PREFIX}-resize[data-axis=row]{right:0;bottom:-1px;left:0;height:1px;cursor:row-resize}`,
  `.${UI_PREFIX}-resize[data-axis=row]::after{inset:-4px 0}`,
  `.${UI_PREFIX}-resize[data-axis=row]::before{inset:0;background:linear-gradient(to right,transparent,var(--dsw-alias-label-caption) 50%,transparent) center / 100% 1px no-repeat}`,
  // The page root carries `data-resizing` for the length of a gesture, so the
  // cursor keeps its meaning while the pointer travels outside the boundary.
  `[data-resizing=col],[data-resizing=col] *{cursor:col-resize}`,
  `[data-resizing=row],[data-resizing=row] *{cursor:row-resize}`,

  // 3. Scrollbar treatment.
  //
  // The shell's lists hide the thumb until the pointer is over them; a pane that
  // keeps a permanent bar reads as a different kind of surface. The tokens are
  // the shell's own, so a theme that retints its scrollbars retints these too.
  `.${UI_PREFIX}-quiet-scroll{--dsh-scrollbar-thumb:transparent;--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2)}`,
  `.${UI_PREFIX}-quiet-scroll:hover{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2)}`,
  `.${UI_PREFIX}-quiet-scroll:focus-visible{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2)}`,

  // 4. The wallpaper hand-off.
  //
  // `dsh-cool-theme` paints a fixed wallpaper layer behind the shell and marks
  // the document with `ct-bg-on` for as long as that layer is mounted. A plugin
  // page that paints `bg-base` or `layer-1` covers that image; rebinding the two
  // canvas tokens inside the page root lets it through, and names nothing about
  // the page's parts. Everything raised above the canvas keeps its fill.
  `html.ct-bg-on .${UI_PREFIX}-page[data-surface=canvas]{--dsw-alias-bg-base:transparent;--dsw-alias-bg-layer-1:transparent}`,

  // 5. The panel scrollport — `PanelScroll` and `PanelShadow`, one element.
  //
  // The bar is the platform's, not ours. `scrollbar.css` in the app sets the
  // width, the pill shape and the track for every scrollport and reads
  // `--dsh-scrollbar-*` for the rest, so the rules here only ever rebind those
  // variables. A pane that styled `::-webkit-scrollbar` itself would be a
  // second bar with its own width, shape and colour, drifting from every list
  // beside it — which is exactly why `--dsh-scrollbar-width` is rebound rather
  // than the pseudo-element.
  //
  // Visibility is a colour and never a `display`: the bar keeps its box at all
  // times, so the rows do not shift when the pointer crosses the edge, and the
  // thumb is there to be grabbed the instant it is painted. `data-bar` is
  // written by the component only while the pointer, the keyboard focus or a
  // scroll gesture is using the pane, and left standing for the caller's
  // `hideDelay` afterwards.
  //
  // Alpha is `color-mix` with the platform token rather than a plain
  // `opacity`, because `opacity` on the element would also fade the pane's
  // content. `0%` therefore keeps a fully transparent thumb that still
  // occupies its width.
  `.${UI_PREFIX}-panel{position:relative;box-sizing:border-box;min-width:0;min-height:0;--dsh-ui-panel-bar-alpha:100%;--dsh-ui-panel-bar-width:5px;--dsh-scrollbar-width:var(--dsh-ui-panel-bar-width);--dsh-scrollbar-thumb:transparent;--dsh-scrollbar-thumb-hover:color-mix(in srgb,var(--dsw-alias-scrollbar-hover-l2) var(--dsh-ui-panel-bar-alpha),transparent)}`,
  `.${UI_PREFIX}-panel[data-bar=show]{--dsh-scrollbar-thumb:color-mix(in srgb,var(--dsw-alias-scrollbar-bg-l2) var(--dsh-ui-panel-bar-alpha),transparent)}`,
  // Direction is stated per axis instead of being a side effect of
  // `overflow:auto`: a vertical list that grows a horizontal bar for an
  // overflowing pixel advertises a gesture with nothing behind it.
  //
  // `none` is `clip` and not `hidden`, and the difference is the whole meaning
  // of the word: an `overflow:hidden` box is still a scroll container — a
  // `scrollTop` write moves it, and so does focusing a control below the fold,
  // which leaves the pane silently shifted under a header. `clip` creates no
  // scrollport at all, so nothing can move the content and the box needs no
  // scrollbar plumbing. The same holds for the blocked axis of `x` and `y`:
  // `hidden` there would leave a scrollable axis with no bar to show for it.
  `.${UI_PREFIX}-panel[data-scroll=none]{overflow:clip}`,
  `.${UI_PREFIX}-panel[data-scroll=both]{overflow:auto}`,
  `.${UI_PREFIX}-panel[data-scroll=x]{overflow-x:auto;overflow-y:clip}`,
  `.${UI_PREFIX}-panel[data-scroll=y]{overflow-x:clip;overflow-y:auto}`,
  // The edge shade (`PanelShadow`). It is a mask, so the rows lose alpha at the
  // end that hides content and whatever is behind the pane shows through; a veil
  // in the pane's own colour would instead be a band sitting on the list, which
  // is what breaks as soon as the page is transparent over a wallpaper.
  //
  // A mask covers the scrollbar too, so the box is split into three layers: the
  // content rectangle, which is the one that fades, and two opaque strips over
  // the measured gutters. The measured strips are `--dsh-ui-panel-gutter-x/y`,
  // written by the component on every scroll pass; when a pane has no bar they
  // are `0px` and the strip has no area. Sizing the whole mask down instead
  // hides the thumb outright, which is the failure this layering exists to
  // avoid.
  //
  // Layer order is fixed and the same for both axes — content, right gutter,
  // bottom gutter — so only the first gradient's direction changes with the
  // shade axis, and the three `mask-*` lists never fall out of step.
  `.${UI_PREFIX}-panel[data-shade]{mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000),linear-gradient(#000,#000);mask-size:calc(100% - var(--dsh-ui-panel-gutter-x,0px)) calc(100% - var(--dsh-ui-panel-gutter-y,0px)),var(--dsh-ui-panel-gutter-x,0px) 100%,100% var(--dsh-ui-panel-gutter-y,0px);mask-position:0 0,right 0,0 bottom;mask-repeat:no-repeat}`,
  `.${UI_PREFIX}-panel[data-shade=y][data-shade-start]{mask-image:linear-gradient(to bottom,#0000,#000 var(--dsh-ui-panel-shade,28px)),linear-gradient(#000,#000),linear-gradient(#000,#000)}`,
  `.${UI_PREFIX}-panel[data-shade=y][data-shade-end]{mask-image:linear-gradient(to top,#0000,#000 var(--dsh-ui-panel-shade,28px)),linear-gradient(#000,#000),linear-gradient(#000,#000)}`,
  `.${UI_PREFIX}-panel[data-shade=y][data-shade-start][data-shade-end]{mask-image:linear-gradient(to bottom,#0000,#000 var(--dsh-ui-panel-shade,28px),#000 calc(100% - var(--dsh-ui-panel-shade,28px)),#0000),linear-gradient(#000,#000),linear-gradient(#000,#000)}`,
  `.${UI_PREFIX}-panel[data-shade=x][data-shade-start]{mask-image:linear-gradient(to right,#0000,#000 var(--dsh-ui-panel-shade,28px)),linear-gradient(#000,#000),linear-gradient(#000,#000)}`,
  `.${UI_PREFIX}-panel[data-shade=x][data-shade-end]{mask-image:linear-gradient(to left,#0000,#000 var(--dsh-ui-panel-shade,28px)),linear-gradient(#000,#000),linear-gradient(#000,#000)}`,
  `.${UI_PREFIX}-panel[data-shade=x][data-shade-start][data-shade-end]{mask-image:linear-gradient(to right,#0000,#000 var(--dsh-ui-panel-shade,28px),#000 calc(100% - var(--dsh-ui-panel-shade,28px)),#0000),linear-gradient(#000,#000),linear-gradient(#000,#000)}`,
].join('\n')
