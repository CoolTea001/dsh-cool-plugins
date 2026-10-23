/**
 * Package-owned stylesheet for the Files tab.
 *
 * Four jobs live here.
 *
 * 1. The Conversation shell keeps its composer seat mounted for every View, so
 *    the Files page removes it. The handle the View root declares —
 *    `data-conversation-composer-overlay` — is the shell's own opt-in and drops
 *    the transcript width handles; the seat itself is hidden by this rule and by
 *    the mounted View (`chrome.ts`), so the seat is gone on every frame the
 *    shell paints, not only after the mount effect has run. The selector is
 *    scoped by this plugin's own root class, which exists only while the Files
 *    tab is mounted: Chat, Trajectory, Terminal and Git keep their composer
 *    untouched, and the rule disappears with the View.
 *
 * 2. The page itself: a sidebar drawing the workspace as one expandable tree
 *    beside an absorbing preview pane. Every color is a `--dsw-*` theme token, so
 *    the tab follows the active light or dark appearance — including third-party
 *    theme presets — instead of forcing a palette of its own.
 *
 * 3. The draggable boundary between them: the sidebar's width is a custom
 *    property the page publishes, and the handle on its right edge lights up
 *    under the pointer. The bounds are imported from `layout.tsx` rather than
 *    restated, so the width a drag may reach and the width a rule allows cannot
 *    drift apart.
 *
 * 4. The wallpaper hand-off. `dsh-cool-theme` paints a fixed image behind the
 *    shell and marks the document with `ct-bg-on` while it is mounted; the page
 *    then rebinds the two canvas tokens it paints with, so the image shows
 *    through this tab exactly as it does through Chat and Git. Without the
 *    theme, or with its wallpaper off, the selector never matches and the tab
 *    keeps its opaque canvas.
 */

import { PREVIEW_MIN, SIDE_DEFAULT, SIDE_MAX, SIDE_MIN } from './layout.js'

/** Class the Files View renders on its root; the stylesheet's only anchor. */
export const FILES_ROOT_CLASS = 'dsh-cf-root'

/** CSS rules, one selector per line. */
const FILES_CSS = [
  // 1. Shell integration.
  //
  // `[data-conversation-scroll]` is the resident scrollport and the seat is its
  // direct child. Hidden, not removed: the draft mirror and the input store keep
  // running for the Chat tab underneath.
  `[data-conversation-scroll]:has(.${FILES_ROOT_CLASS})>[data-composer-seat]{display:none}`,

  // 2. Page layout.
  //
  // The sidebar is a column fixed to the width the reader dragged it to, so the
  // preview keeps every remaining pixel and its own scroll position; an explicit
  // `min-height:0` at every level is what lets the two scrolling lists shrink
  // instead of stretching the page, and `flex:1 1 auto` beside the View's inline
  // `height:100%` keeps the page full-height whichever way the shell's wrapper
  // hands the body over.
  `.${FILES_ROOT_CLASS}{display:flex;flex:1 1 auto;flex-direction:row;box-sizing:border-box;width:100%;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,sans-serif);font-size:12.5px;line-height:1.5}`,
  `.${FILES_ROOT_CLASS} *{box-sizing:border-box}`,
  // The sidebar's width is the drag's to set: one custom property the page publishes
  // on its root (see `layout.ts`), with the default width as the rule's own fallback,
  // so the first frame — before a saved layout has been read — is already a whole
  // page. The floor and the cap restate the drag's bounds, which is what keeps a
  // width saved in a wide window from squeezing the preview in a narrow one.
  `.dsh-cf-side{position:relative;flex:none;display:flex;flex-direction:column;width:var(--dsh-cf-side-width,${SIDE_DEFAULT}px);min-width:${SIDE_MIN}px;max-width:min(${SIDE_MAX}px,calc(100% - ${PREVIEW_MIN}px));min-height:0;border-right:.5px solid var(--dsw-alias-border-l3)}`,

  // The boundary itself. It is the hairline the sidebar already draws (`.5px`, a
  // seam rather than a rule), with an invisible band around it as the hit target:
  // the handle element is 1px wide so that it covers that hairline, and its
  // `::after` reaches 4px either side, because half a pixel is not something a
  // pointer can be asked to hold. It takes no layout space — it is positioned on
  // the sidebar's own edge — so adding it moves nothing on the page.
  //
  // `::before` is the indicator: the line brightens on hover and stays lit for the
  // length of a drag, which is what makes a boundary read as draggable at rest.
  '.dsh-cf-resize{position:absolute;z-index:2;top:0;right:-1px;bottom:0;width:1px;cursor:col-resize;touch-action:none}',
  '.dsh-cf-resize::before{content:"";position:absolute;inset:0;opacity:0;background:linear-gradient(to bottom,transparent,var(--dsw-alias-label-secondary) 50%,transparent) center / 1px 100% no-repeat;transition:opacity .12s ease-out}',
  '.dsh-cf-resize::after{content:"";position:absolute;inset:0 -4px}',
  '.dsh-cf-resize:hover::before,.dsh-cf-resize[data-dragging]::before{opacity:1}',
  // While the boundary is being dragged the whole page takes the axis's cursor and
  // stops selecting text: the pointer leaves a 1px line at the first frame of a
  // drag, and a crossed row would otherwise highlight under it.
  `.${FILES_ROOT_CLASS}[data-resizing],.${FILES_ROOT_CLASS}[data-resizing] *{user-select:none}`,
  `.${FILES_ROOT_CLASS}[data-resizing=col],.${FILES_ROOT_CLASS}[data-resizing=col] *{cursor:col-resize}`,

  // 3. Sidebar chrome: one row, the workspace's name on the left and Refresh on
  //    the right.
  //
  // The tree names every folder it shows, so the header carries no path: there
  // is one workspace and one root level, and the name is what the reader needs
  // to know about the tree below it. The name is what gives ground when the
  // sidebar is narrow; Refresh keeps its seat on the right.
  '.dsh-cf-side-head{flex:none;display:flex;align-items:center;gap:6px;height:36px;padding:0 6px 0 10px}',
  '.dsh-cf-side-title{flex:1 1 auto;min-width:0;display:flex;align-items:center;overflow:hidden}',
  '.dsh-cf-side-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:11.5px;font-weight:600}',
  '.dsh-cf-icon-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
  '.dsh-cf-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
  '.dsh-cf-icon-btn[aria-pressed=true]{color:var(--dsw-alias-label-primary)}',
  '.dsh-cf-icon-btn:disabled{opacity:.45;cursor:default}',
  '.dsh-cf-icon-btn svg{display:block;width:14px;height:14px}',

  // 4. The tree.
  //
  // One open folder owns its children in the DOM (`.dsh-cf-children`), so each
  // branch draws its own indented block without the rows having to know their
  // depth. The arrow is the branch's own disclosure: it points right while
  // closed and turns down while open, and it keeps its 12px seat on files so
  // every name in a level starts on the same axis.
  '.dsh-cf-list{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 6px 10px;border-top:.5px solid var(--dsw-alias-border-l3)}',
  '.dsh-cf-node{display:block}',
  '.dsh-cf-row{display:flex;align-items:center;gap:6px;width:100%;padding:4px 6px;border:0;border-radius:5px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
  '.dsh-cf-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
  '.dsh-cf-row[data-selected]{background:var(--dsw-alias-interactive-bg-active)}',
  '.dsh-cf-row[data-type=other]{cursor:default;opacity:.55}',
  '.dsh-cf-twist{flex:none;display:inline-flex;align-items:center;justify-content:center;width:12px;height:16px;color:var(--dsw-alias-label-secondary);opacity:.75}',
  '.dsh-cf-twist svg{width:12px;height:12px;transition:transform .12s ease-out}',
  '.dsh-cf-row[data-open] .dsh-cf-twist svg{transform:rotate(90deg)}',
  '.dsh-cf-children{padding-left:16px}',
  '.dsh-cf-row-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-secondary)}',
  '.dsh-cf-row[data-type=directory] .dsh-cf-row-icon{color:var(--dsw-alias-brand-primary)}',
  '.dsh-cf-row-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsh-cf-row-size{flex:none;color:var(--dsw-alias-label-secondary);opacity:.75;font-size:11px;font-variant-numeric:tabular-nums}',

  // 5. Sidebar states: empty, loading, failure and the entry cap.
  //
  // The two notice surfaces are `layer-2` rather than `layer-1`: the wallpaper
  // rule below clears `layer-1` for this page, and a notice must stay a raised
  // card over the image instead of dissolving into it.
  '.dsh-cf-note{padding:10px 12px;color:var(--dsw-alias-label-secondary);font-size:11.5px}',
  '.dsh-cf-error{margin:8px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:11.5px;word-break:break-word}',

  // 6. The preview pane.
  '.dsh-cf-main{flex:1 1 auto;display:flex;flex-direction:column;min-width:0;min-height:0}',
  '.dsh-cf-main-head{flex:none;display:flex;align-items:center;gap:10px;height:34px;padding:0 12px;border-bottom:.5px solid var(--dsw-alias-border-l3)}',
  '.dsh-cf-file-name{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600}',
  '.dsh-cf-file-path{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);opacity:.8;font-size:11px}',
  '.dsh-cf-body{flex:1 1 auto;min-height:0;overflow:auto}',
  '.dsh-cf-code{margin:0;padding:12px 16px 24px;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:12px;line-height:1.6;white-space:pre;tab-size:2;color:var(--dsw-alias-label-primary)}',
  '.dsh-cf-truncated{flex:none;margin:8px 16px 0;padding:6px 10px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px}',
  '.dsh-cf-empty{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:24px;text-align:center;color:var(--dsw-alias-label-secondary)}',
  '.dsh-cf-empty-title{color:var(--dsw-alias-label-primary);font-size:13px}',
  '.dsh-cf-empty-hint{max-width:320px;font-size:11.5px}',

  // 7. Wallpaper.
  //
  // `dsh-cool-theme` paints a fixed wallpaper layer behind the shell and marks
  // the document with `ct-bg-on` for as long as that layer is mounted; without
  // the theme, or with its wallpaper switched off, the class is absent. The
  // theme clears the shell's own canvas surfaces by name — the conversation
  // root, the layout columns, the right sidebar — but a tab that paints its own
  // canvas still covers the image with it. This page paints one: `bg-base` on
  // the page root (every inner surface is transparent and inherits the cleared
  // token). Rebinding the two canvas tokens inside this root is what lets the
  // image through, and it names nothing about the page's parts.
  //
  // Everything raised above that canvas keeps its fill: the hover and selection
  // washes use the interactive tokens, and the two notice surfaces draw on
  // `layer-2`, which this rule does not touch. The scoping is the whole
  // contract — a profile without the theme never matches the selector, so the
  // tab draws its own opaque canvas exactly as it did before.
  `html.ct-bg-on .${FILES_ROOT_CLASS}{--dsw-alias-bg-base:transparent;--dsw-alias-bg-layer-1:transparent}`,
]

/**
 * Insert this plugin's stylesheet once and hand back its disposer.
 *
 * @returns the function that removes the element again.
 */
export function insertFilesStyles(): () => void {
  const element = document.createElement('style')
  // The ownership record every DSH bundle writes on the tags it injects: the
  // client module system books a `<style>` by `data-plugin`, and an unowned tag
  // that appears while some other module materializes can be claimed by it and
  // removed with that module. Naming this package keeps the sheet its own.
  element.setAttribute('data-plugin', 'dsh-cool-file')
  element.setAttribute('data-dsh-cool-file', 'styles')
  element.textContent = FILES_CSS.join('\n')
  document.head.appendChild(element)
  return () => {
    element.remove()
  }
}
