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
 * 5. The panel scrollport — the bar and the edge mask, stated once for the two
 *    components that draw them.
 * 6. The toggle button — one pressed state, one set of control metrics, so a
 *    toggle in a toolbar and a toggle in a settings row are the same control.
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
  //
  // `data-side` is which edge of the pane the line is drawn on. A sidebar on the
  // left wants its right edge, a sidebar on the right its left one, and a
  // stacked pair the bottom of the upper pane — so the geometry is stated twice
  // per axis rather than once, which is the price of one component serving all
  // three.
  `.${UI_PREFIX}-resize{position:absolute;z-index:2;touch-action:none}`,
  `.${UI_PREFIX}-resize::before{content:"";position:absolute;opacity:0;transition:opacity .12s ease-out}`,
  `.${UI_PREFIX}-resize::after{content:"";position:absolute}`,
  `.${UI_PREFIX}-resize:hover::before,.${UI_PREFIX}-resize[data-dragging]::before{opacity:1}`,
  // A column boundary: vertical line, horizontal hit band.
  `.${UI_PREFIX}-resize[data-axis=col]{top:0;right:-1px;bottom:0;width:1px;cursor:col-resize}`,
  `.${UI_PREFIX}-resize[data-axis=col][data-side=start]{right:auto;left:-1px}`,
  `.${UI_PREFIX}-resize[data-axis=col]::after{inset:0 -4px}`,
  `.${UI_PREFIX}-resize[data-axis=col]::before{inset:0;background:linear-gradient(to bottom,transparent,var(--dsw-alias-label-caption) 50%,transparent) center / 1px 100% no-repeat}`,
  // A row boundary: horizontal line, vertical hit band.
  `.${UI_PREFIX}-resize[data-axis=row]{right:0;bottom:-1px;left:0;height:1px;cursor:row-resize}`,
  `.${UI_PREFIX}-resize[data-axis=row][data-side=start]{bottom:auto;top:-1px}`,
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

  // 6. The toggle button and its group.
  //
  // Three sizes — 24px (`sm`), 28px (`md`) and 32px (`lg`) — rather than the
  // shell's two. A toggle is usually the one control that has to match the row
  // it sits in (a 24px sidebar button, a 28px settings row, a 32px toolbar), so
  // the size is a decision the caller makes rather than one the component takes
  // from the shell's Button. `md` is the base rule; the other two override the
  // five properties that change with height (box, padding, radius, type size and
  // line height), so nothing drifts between them.
  //
  // The metrics are stated here rather than borrowed from `Button` because the
  // pressed state has to be ours: see the note in `toggle/toggle.tsx` about
  // out-ranking the shell's own `:hover` rules from a stylesheet this package
  // does not own.
  //
  // Paint is keyed on `[aria-pressed=true]`, the attribute a screen reader reads,
  // so the visible state cannot drift from the announced one. The two fills are
  // the families DSH already paints its selected chips and filled buttons with,
  // which is what makes a theme's retint reach a toggle for free.
  //
  // Every unpressed rule is scoped to `[aria-pressed=false]` rather than merely
  // coming earlier in the sheet. A pressed toggle has a fill to keep, and a
  // hover rule that matched both states would leave that fill winning or losing
  // on source order alone — the kind of tie that survives review and breaks on
  // the next edit.
  //
  // Radius shrinks with the box, because a 12px corner on a 24px button reads as
  // a pill and a 4px corner on a 32px one reads as a chip. The three radii are
  // the shell's own steps — `radius-xs`, `radius-sm`, `radius-md` — so a toggle's
  // corner still rhymes with the panel beside it instead of introducing a
  // fourth rounding in the same view.
  // Type sizes come from the shell's own scale — 11, 12 and 13 for the three
  // heights — written as the scale's split size and line-height tokens so a
  // reader who raises the product's font size raises a toggle with it. The
  // numbers before this said 11.5, 12.5 and 13: three sizes the shell does not
  // have, which is how a control drawn beside a shell button ended up a
  // half-pixel off its neighbour's type.
  `.${UI_PREFIX}-toggle{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:none;gap:6px;height:28px;padding:0 10px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:var(--dsw-font-xxs-12-font-size,12px);line-height:var(--dsw-font-xxs-12-line-height,18px);white-space:nowrap;cursor:pointer;transition:background-color .12s ease,color .12s ease}`,
  `.${UI_PREFIX}-toggle[data-size=sm]{height:24px;padding:0 8px;border-radius:var(--dsw-radius-xs,4px);font-size:var(--dsw-font-xxxs-11-font-size,11px);line-height:var(--dsw-font-xxxs-11-line-height,14px);gap:4px}`,
  `.${UI_PREFIX}-toggle[data-size=lg]{height:32px;padding:0 12px;border-radius:var(--dsw-radius-md);font-size:var(--dsw-font-xs-13-font-size,13px);line-height:var(--dsw-font-xs-13-line-height,20px)}`,
  // An icon-only toggle is square, and the icon is the whole box: without this
  // the control keeps a labelled button's padding and reads as a wide box
  // holding a small glyph. One rule per size keeps the box a square rather than
  // a rectangle whose width was copied from the base size.
  `.${UI_PREFIX}-toggle[data-square]{width:28px;padding:0}`,
  `.${UI_PREFIX}-toggle[data-size=sm][data-square]{width:24px}`,
  `.${UI_PREFIX}-toggle[data-size=lg][data-square]{width:32px}`,
  // The glyph keeps one 16px box at every size: the three steps differ in the
  // room around the icon, not in the icon itself, so a row of toggles at
  // different sizes still draws its marks at one weight. Callers pass the glyph
  // at whatever size suits it; the box is what centres it.
  `.${UI_PREFIX}-toggle-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none}`,
  // Hover and press move the fill only: a toggle that also changed its type
  // weight would make the row twitch as the pointer crosses it.
  `@media (hover:hover){.${UI_PREFIX}-toggle[aria-pressed=false]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}}`,
  `.${UI_PREFIX}-toggle[aria-pressed=false]:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}`,
  // The hairline is an inset ring rather than a border: a border that appeared
  // on hover would move the label, and a stroke drawn inside the box stays crisp
  // at fractional device ratios.
  `.${UI_PREFIX}-toggle[data-variant=outline]{box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsw-alias-border-l3)}`,
  `@media (hover:hover){.${UI_PREFIX}-toggle[data-variant=outline][aria-pressed=false]:hover:not(:disabled){box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsw-alias-border-l4)}}`,
  // The pressed fills. `soft` is the quiet neutral press a peer in a row wants;
  // `solid` is the accent fill for the one toggle that is the row's subject.
  `.${UI_PREFIX}-toggle[aria-pressed=true]{color:var(--dsw-alias-label-primary)}`,
  `.${UI_PREFIX}-toggle[aria-pressed=true][data-active-variant=soft]{background:var(--dsw-alias-button-ghost-active-fill);box-shadow:inset 0 0 0 1px var(--dsw-alias-button-ghost-active-border)}`,
  `@media (hover:hover){.${UI_PREFIX}-toggle[aria-pressed=true][data-active-variant=soft]:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-hover);color:var(--dsw-alias-label-primary)}}`,
  `.${UI_PREFIX}-toggle[aria-pressed=true][data-active-variant=soft]:active:not(:disabled){background:var(--dsw-alias-button-ghost-active-hover)}`,
  // `box-shadow:none` is load-bearing: it clears the outline ring, so the accent
  // fill is not framed by a hairline that the variant asked for.
  `.${UI_PREFIX}-toggle[aria-pressed=true][data-active-variant=solid]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);box-shadow:none}`,
  `@media (hover:hover){.${UI_PREFIX}-toggle[aria-pressed=true][data-active-variant=solid]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover);color:var(--dsw-alias-label-primary-foreground)}}`,
  `.${UI_PREFIX}-toggle[aria-pressed=true][data-active-variant=solid]:active:not(:disabled){background:var(--dsw-alias-button-primary-hover)}`,
  // The ring the shell gives every control, at the same width and token, so a
  // keyboard reader meets one focus language across the window.
  `.${UI_PREFIX}-toggle:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}`,
  // A disabled toggle keeps whatever state it is in — a pressed one still reads
  // as pressed — so the only thing disabled changes is the pointer cue.
  `.${UI_PREFIX}-toggle:disabled{cursor:not-allowed;opacity:.4}`,

  // The group. It owns the row's direction, which is also the arrow keys' axis,
  // and in the attached shape it owns the corners and the seam between buttons.
  //
  // The gap keeps a row of glyphs reading as siblings rather than one long
  // control. Attached closes it and pulls each button back over its
  // neighbour's hairline by that hairline's own width, so the seam is one line
  // instead of two.
  `.${UI_PREFIX}-toggle-group{display:inline-flex;align-items:center;gap:4px}`,
  `.${UI_PREFIX}-toggle-group[data-orientation=vertical]{flex-direction:column;align-items:stretch}`,
  `.${UI_PREFIX}-toggle-group[data-attached]{gap:0}`,
  `.${UI_PREFIX}-toggle-group[data-attached][data-orientation=horizontal]>.${UI_PREFIX}-toggle:not(:first-child){margin-inline-start:calc(-1 * var(--dsh-hairline-width,.5px))}`,
  `.${UI_PREFIX}-toggle-group[data-attached][data-orientation=vertical]>.${UI_PREFIX}-toggle:not(:first-child){margin-block-start:calc(-1 * var(--dsh-hairline-width,.5px))}`,
  // Only the outer corners stay round: the sides that meet are squared off so
  // the buttons sit flush. The four corners are named per orientation, because
  // "the side that meets" is the inline one in a row and the block one in a
  // column.
  `.${UI_PREFIX}-toggle-group[data-attached][data-orientation=horizontal]>.${UI_PREFIX}-toggle:not(:first-child){border-start-start-radius:0;border-end-start-radius:0}`,
  `.${UI_PREFIX}-toggle-group[data-attached][data-orientation=horizontal]>.${UI_PREFIX}-toggle:not(:last-child){border-start-end-radius:0;border-end-end-radius:0}`,
  `.${UI_PREFIX}-toggle-group[data-attached][data-orientation=vertical]>.${UI_PREFIX}-toggle:not(:first-child){border-start-start-radius:0;border-start-end-radius:0}`,
  `.${UI_PREFIX}-toggle-group[data-attached][data-orientation=vertical]>.${UI_PREFIX}-toggle:not(:last-child){border-end-start-radius:0;border-end-end-radius:0}`,
  // The pressed button and the focused one are raised above their neighbours so
  // their fill and their ring are not clipped by the button drawn over them.
  `.${UI_PREFIX}-toggle-group[data-attached]>.${UI_PREFIX}-toggle[aria-pressed=true],.${UI_PREFIX}-toggle-group[data-attached]>.${UI_PREFIX}-toggle:focus-visible{position:relative;z-index:1}`,
].join('\n')
