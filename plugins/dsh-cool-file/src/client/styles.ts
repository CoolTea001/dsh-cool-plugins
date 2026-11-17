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

import { composerSeatCss, insertPluginStyles, resizablePanelCss, wallpaperCss } from '@dsh-cool/ui'
import { CODE_LINE_HEIGHT } from './code.js'

/**
 * The id the loader registers this bundle under, which is the name the sheet's
 * ownership record carries. It is the package name, stated where the sheet is
 * built rather than threaded through a build-time define, because this module's
 * only other reader of it is that record.
 */
const PACKAGE_ID = 'dsh-cool-file'
import { SIDE_BOUNDS } from './layout.js'

/** Class the Files View renders on its root; the stylesheet's only anchor. */
export const FILES_ROOT_CLASS = 'dsh-cf-root'

/** CSS rules, one selector per line. */
const FILES_CSS = [
  // 1. Shell integration.
  //
  // `[data-conversation-scroll]` is the resident scrollport and the seat is its
  // direct child. Hidden, not removed: the draft mirror and the input store keep
  // running for the Chat tab underneath.
  composerSeatCss(FILES_ROOT_CLASS),

  // 2. Page layout.
  //
  // The sidebar is a column fixed to the width the reader dragged it to, so the
  // preview keeps every remaining pixel and its own scroll position; an explicit
  // `min-height:0` at every level is what lets the two scrolling lists shrink
  // instead of stretching the page, and `flex:1 1 auto` beside the View's inline
  // `height:100%` keeps the page full-height whichever way the shell's wrapper
  // hands the body over.
  `.${FILES_ROOT_CLASS}{--dsh-cf-measure:900px;display:flex;flex:1 1 auto;flex-direction:row;box-sizing:border-box;width:100%;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,sans-serif);font-size:12.5px;line-height:1.5}`,
  `.${FILES_ROOT_CLASS} *{box-sizing:border-box}`,
  // The width is the drag's to set: one custom property the page publishes on
  // its root (see `layout.ts`), with the panel's own bounds as the rule's
  // fallback, floor and cap. Those numbers come from `SIDE_BOUNDS`, the same
  // object the drag clamps against, so the stylesheet and the pointer cannot
  // disagree about where the sidebar stops. What stays here is what only this
  // page knows: the hairline seam.
  resizablePanelCss('.dsh-cf-side', {
    property: '--dsh-cf-side-width',
    bounds: SIDE_BOUNDS,
    declarations: 'border-right:.5px solid var(--dsw-alias-border-l3);',
  }),

  // The boundary itself is `@dsh-cool/ui`'s: one element, one hit band, one
  // hover cue, shared with the Git and Terminal tabs. What stays here is what is
  // stated on this page's own root — the selection lock for a gesture. The
  // pointer leaves a 1px line at the first frame of a drag, and a crossed row
  // would otherwise highlight under it.
  `.${FILES_ROOT_CLASS}[data-resizing],.${FILES_ROOT_CLASS}[data-resizing] *{user-select:none}`,

  // 3. Sidebar chrome: one row, the workspace's name on the left and Refresh on
  //    the right.
  //
  // The tree names every folder it shows, so the header carries no path: there
  // is one workspace and one root level, and the name is what the reader needs
  // to know about the tree below it. The name is what gives ground when the
  // sidebar is narrow; Refresh keeps its seat on the right.
  // Both column heads carry the section rule themselves and share one height, so
  // the seam runs straight across the page instead of stepping down a couple of
  // pixels at the boundary.
  '.dsh-cf-side-head{flex:none;display:flex;align-items:center;gap:6px;height:36px;padding:0 6px 0 10px;border-bottom:.5px solid var(--dsw-alias-border-l3)}',
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
  // The tree's scrollport is `@dsh-cool/ui`'s `PanelScroll`: the bar belongs to
  // the pointer, and the axis is stated by the component rather than inferred
  // from an `overflow` value here. What stays is this pane's own box and inset —
  // the scroll region must keep filling the sidebar, and its rows keep the same
  // 6–10px breathing room they had. `overflow` is deliberately absent: the
  // shared rules own it, and a second declaration here would be a peer the
  // cascade could pick on the wrong side.
  '.dsh-cf-list{flex:1 1 auto;min-height:0;padding:4px 6px 10px}',
  '.dsh-cf-node{display:block}',
  '.dsh-cf-row{display:flex;align-items:center;gap:6px;width:100%;padding:4px 6px;border:0;border-radius:5px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
  '.dsh-cf-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
  '.dsh-cf-row[data-selected]{background:var(--dsw-alias-interactive-bg-active)}',
  '.dsh-cf-row[data-type=other]{cursor:default;opacity:.55}',
  '.dsh-cf-twist{flex:none;display:inline-flex;align-items:center;justify-content:center;width:12px;height:16px;color:var(--dsw-alias-label-secondary);opacity:.75}',
  '.dsh-cf-twist svg{width:12px;height:12px;transition:transform .12s ease-out}',
  '.dsh-cf-row[data-open] .dsh-cf-twist svg{transform:rotate(90deg)}',
  '.dsh-cf-children{padding-left:16px}',
  // One colour for every glyph in the tree — folders and files alike. The folder
  // is told apart by its shape and by the twist before it, not by a brand tint:
  // a coloured column of folders pulls the eye off the names it is there to
  // introduce, and the accent is what the page spends on what the reader chose
  // (the selected row, the caret, a link) rather than on the furniture.
  '.dsh-cf-row-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-secondary)}',
  '.dsh-cf-row-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  // An entry the workspace's own ignore rules leave out. It is still a row the
  // reader can open — it is on disk — so it is dimmed by one step rather than
  // struck through or hidden: the name stays legible, and the tree still says
  // which half of it the project considers its own. The icon follows the name,
  // otherwise a dimmed file would keep a full-strength glyph beside it.
  '.dsh-cf-row[data-ignored] .dsh-cf-row-name{color:var(--dsw-alias-label-secondary)}',
  '.dsh-cf-row[data-ignored] .dsh-cf-row-icon{opacity:.6}',
  '.dsh-cf-row[data-ignored][data-type=directory] .dsh-cf-row-icon{opacity:.6}',
  // A file the editor holds an unsaved draft for. The tree says so without
  // opening the file: a lost edit is the one thing this tab must not hide.
  '.dsh-cf-row-dot{flex:none;width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-warn-primary)}',

  // 5. Sidebar states: empty, loading, failure and the entry cap.
  //
  // The two notice surfaces are `layer-2` rather than `layer-1`: the wallpaper
  // rule below clears `layer-1` for this page, and a notice must stay a raised
  // card over the image instead of dissolving into it.
  '.dsh-cf-note{padding:10px 12px;color:var(--dsw-alias-label-secondary);font-size:11.5px}',
  '.dsh-cf-error{margin:8px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:11.5px;word-break:break-word}',

  // 6. The preview pane.
  '.dsh-cf-main{flex:1 1 auto;display:flex;flex-direction:column;min-width:0;min-height:0}',
  '.dsh-cf-main-head{flex:none;display:flex;align-items:center;gap:10px;height:36px;padding:0 12px;border-bottom:.5px solid var(--dsw-alias-border-l3)}',
  '.dsh-cf-file-name{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600}',
  '.dsh-cf-file-path{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);opacity:.8;font-size:11px}',
  // The selected file's line count (and size, when the read reported one). It
  // sits in the preview header, not in the tree: a size beside every row turned
  // the workspace into a table and squeezed the names.
  '.dsh-cf-file-meta{flex:none;color:var(--dsw-alias-label-secondary);opacity:.75;font-size:11px;font-variant-numeric:tabular-nums}',
  // Saving has no header state of its own: a draft is shown by the dot beside
  // its file in the tree, and the shortcut that writes it lives in the field.
  //
  // The switch is the shell's `SegmentedTabs` (see `mode.tsx`), so only its box
  // is set here: the track, the indicator's slide, the tab roles and the key walk
  // all belong to the primitive. Its own metrics are a settings page's — 34px
  // tabs in a 4px-padded track — while this head is 36px tall and the control in
  // it is two glyphs, so the tabs come down to 20px: 28px of track, which sits in
  // the head with air above and below it, as the sidebar's 24px icon buttons do.
  //
  // The track's own height is deliberately not restated: it is the tabs plus that
  // 4px padding, and the indicator's height is `track - 8px` — pinning the track
  // to a number of its own would desynchronise the sliding pill from the tab it
  // is meant to sit under. Only the tab box changes; the 4px inset the
  // primitive computes its geometry from is left exactly as it sets it.
  //
  // The doubled class lifts these rules above the primitive's own single-class
  // module selectors without `!important`, whatever order the sheets land in. The
  // head centres it vertically already; `flex:none` keeps the path column from
  // squeezing it, since this is the one control in the head that must stay whole.
  '.dsh-cf-mode.dsh-cf-mode{flex:none}',
  '.dsh-cf-mode.dsh-cf-mode [role=tab]{height:20px;padding:0 8px;font-size:11px;line-height:20px;gap:0}',
  // Selecting a tab is not a headline: the shell bolds the pick because its own
  // segmented controls sit on pages with room for it, while a 20px tab in a
  // toolbar only jitters when the weight flips.
  '.dsh-cf-mode.dsh-cf-mode [role=tab][aria-selected=true]{font-weight:500}',
  // The glyph is the segment, so it carries the hover text (`mode.tsx`); the box
  // around it only centres the icon in the tab.
  '.dsh-cf-mode.dsh-cf-mode .dsh-cf-mode-glyph{display:inline-flex;align-items:center;justify-content:center}',
  '.dsh-cf-mode.dsh-cf-mode svg{display:block;opacity:.85}',
  // The word behind each icon: out of sight, still the tab's accessible name. A
  // tab whose only child were a decorative glyph would have no name at all.
  '.dsh-cf-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}',
  // A failed save is a notice above the body, not a replacement for it: the
  // draft is still there, and the reader decides whether to reload.
  '.dsh-cf-save-error{flex:none;display:flex;align-items:center;gap:10px;margin:8px 16px 0;padding:6px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:11.5px}',
  '.dsh-cf-save-error-text{flex:1 1 auto;min-width:0}',
  '.dsh-cf-link{flex:none;padding:0;border:0;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:11.5px;text-decoration:underline;cursor:pointer}',
  // The editor is the preview with a caret in it, so the body stops being a
  // scroll container: the field inside owns both axes and the artwork follows it
  // (see `editor.tsx`). A page scrollbar beside the field's own would be a
  // second, empty one. The component reaches this through `direction="none"`
  // when editing; what stays here is the flex box that lets the field fill it.
  '.dsh-cf-body[data-editor]{display:flex}',
  // Every metric here is declared twice — once for the painted rows, once for
  // the transparent field over them — and the two must agree to the pixel, or
  // the caret drifts away from the glyph it sits on. That includes the ligature
  // setting: a form field may shape `=>` differently from a `<pre>`, and two
  // glyphs of difference on one line is enough to shift everything under them.
  `.dsh-cf-edit{flex:1 1 auto;display:flex;min-width:0;min-height:0;position:relative;overflow:hidden;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:12px;line-height:${CODE_LINE_HEIGHT}px;font-variant-ligatures:none}`,
  '.dsh-cf-edit-gutter{flex:none;position:relative;overflow:hidden;box-sizing:border-box;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);opacity:.55;user-select:none;-webkit-user-select:none;pointer-events:none}',
  '.dsh-cf-edit-numbers{margin:0;padding:12px 8px 24px;white-space:pre;font:inherit;line-height:inherit;will-change:transform}',
  '.dsh-cf-edit-pane{position:relative;flex:1 1 auto;min-width:0;overflow:hidden}',
  // The rows are clipped by the pane and slid by the field's offset; they never
  // scroll or take the pointer themselves.
  '.dsh-cf-edit-pane .dsh-cf-code{position:absolute;inset:0;box-sizing:border-box;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none}',
  '.dsh-cf-edit-pane .dsh-cf-code code{will-change:transform}',
  // The field's own glyphs are invisible: the coloured ones behind it are what
  // the reader sees. It still paints a caret, and a wash over the selection, so
  // the two marks it makes are the two a caret belongs to.
  '.dsh-cf-edit-input{position:absolute;inset:0;z-index:1;box-sizing:border-box;width:100%;height:100%;margin:0;padding:12px 16px 24px 8px;border:0;outline:0;resize:none;background:transparent;color:transparent;caret-color:var(--dsw-alias-brand-primary);font:inherit;line-height:inherit;tab-size:2;white-space:pre;overflow:auto}',
  '.dsh-cf-edit-input::selection{background:rgba(110,150,255,.26);color:transparent}',
  '.dsh-cf-edit-input::selection{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 26%,transparent)}',
  // The body is the vertical scroller; the code block inside it owns the
  // horizontal one, so a long line slides sideways under the pointer. The number
  // column is a sibling of that block, never inside it: that is what leaves the
  // numbers still while the source moves.
  //
  // The scrollport itself is `PanelScroll` (`direction="y"`), which owns the
  // axis; this rule keeps the flex box it is, and nothing else. Declaring
  // `overflow` here would compete with the component's `data-scroll` rule for no
  // gain — the two would always have to agree.
  '.dsh-cf-body{flex:1 1 auto;min-height:0}',
  // The row is the one place the code metrics are declared, and both columns
  // inherit them: the gutter and the code cannot disagree about how tall a line
  // is, because there is only one height. The file sizes its own gutter in `ch`.
  // The columns start at the top rather than stretching: a stretched code block
  // would pay for its horizontal scrollbar out of its own height and clip the
  // last row, while an auto-height one grows to keep it.
  `.dsh-cf-code-view{display:flex;align-items:flex-start;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:12px;line-height:${CODE_LINE_HEIGHT}px}`,
  // The gutter is a `<pre>` holding one number per line, right-aligned against
  // the code. It repeats the code's top and bottom padding so both columns begin
  // and end on the same line; `overflow:hidden` keeps it out of any scrolling.
  // `tabular-nums` keeps the digits one width so the right edge does not wobble,
  // and `user-select:none` keeps a copied selection free of numbers.
  '.dsh-cf-gutter{flex:none;margin:0;padding:12px 8px 24px;overflow:hidden;text-align:right;white-space:pre;font-family:inherit;font-size:inherit;line-height:inherit;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);opacity:.55;user-select:none;-webkit-user-select:none;pointer-events:none}',
  // One row, one line of source. A fixed `height` is what pins the pitch: with
  // `white-space:pre` a row never wraps, and with a fixed height it never grows,
  // so row n always sits at `12px + 19.2px * n` — the same arithmetic the nth
  // number follows in the gutter.
  '.dsh-cf-code{flex:1 1 auto;min-width:0;margin:0;padding:12px 16px 24px 8px;overflow-x:auto;overflow-y:hidden;font-family:inherit;font-size:inherit;line-height:inherit;tab-size:2;color:var(--shiki-foreground,var(--dsw-alias-label-primary))}',
  '.dsh-cf-code code{display:block;font:inherit;line-height:inherit;white-space:normal}',
  `.dsh-cf-line{display:block;height:${CODE_LINE_HEIGHT}px;white-space:pre}`,
  // Syntax colours are not styled here: the tokenizer emits the shell's
  // `--shiki-*` colours (and italic/bold/underline) inline on the spans it
  // builds (see `highlight.ts`), and only paints a token when it differs from
  // the plain foreground. The sheet therefore owns the block's font and the
  // plain foreground, and nothing else about how code is coloured.
  '.dsh-cf-truncated{flex:none;margin:8px 16px 0;padding:6px 10px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px}',
  // The image pane. A picture is drawn at its own proportions inside a
  // scrollport rather than cropped to fill the frame: a tall screenshot has to
  // stay readable, and a fixed height with `object-fit:contain` would trade that
  // for a picture the pane made up. The button around the picture is the click
  // target only — no border, no fill, no padding of its own, so the picture is
  // the whole surface, and the pane's padding is what keeps it off the edges.
  '.dsh-cf-image{display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;box-sizing:border-box;min-height:100%;padding:24px}',
  '.dsh-cf-image-open{display:block;max-width:100%;padding:0;border:0;background:transparent;cursor:zoom-in}',
  // The picture's frame is the shell's own elevation and radius, the pair the
  // lightbox opens with: a hand-picked `rgba(0,0,0,…)` shadow would be the one
  // colour on this page that a light theme and a third-party skin cannot adjust.
  '.dsh-cf-image-img{display:block;max-width:100%;height:auto;border-radius:var(--dsw-radius-lg);box-shadow:var(--dsw-elevation-prominent)}',
  // The picture fades in as it decodes; a half-painted image beside the page's
  // own chrome reads as a glitch, while the status line says what is happening.
  '.dsh-cf-image[data-state=loading] .dsh-cf-image-img{opacity:0}',
  '.dsh-cf-image-status{color:var(--dsw-alias-label-secondary);font-size:11.5px}',
  // A picture the browser could not decode is the one failure an image pane can
  // hit (a mistyped path, a file the Host refuses), so the notice carries the
  // retry beside it instead of sitting above an empty stage.
  '.dsh-cf-image-failed{display:inline-flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:11.5px}',
  // The Markdown pane. The shell's renderer brings its own typography (headings,
  // lists, tables, fences), so this rule adds only the document's margins: a page
  // reads better with a little air around it than flush against the pane edge,
  // and the measure is capped so a wide window does not stretch a paragraph to
  // two hundred characters.
  // One measure for every body, so switching files does not slide the left edge:
  // the source view's rows start at the same axis a rendered document's text does.
  '.dsh-cf-markdown{box-sizing:border-box;width:100%;max-width:var(--dsh-cf-measure);margin:0 auto;padding:20px 28px 48px}',
  // Front matter, drawn above a rendered document. It is source, so it looks like
  // the source view's own block: the same surface the notices use, the same mono
  // metrics, and no colour of its own that a theme would have to know about.
  '.dsh-cf-front-matter{margin:0 0 20px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:11.5px;line-height:1.6;overflow-x:auto}',
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
  wallpaperCss(FILES_ROOT_CLASS),
]

/**
 * Insert this plugin's stylesheet — and the shared one — once for the plugin
 * lifetime.
 *
 * The tag's ownership record, and why it matters, are `@dsh-cool/ui`'s business
 * rather than this file's: see `insertPluginStyles`. What stays here is the
 * plugin's own id, which is the name that ownership record carries.
 *
 * @returns disposer that removes exactly this sheet.
 */
export function insertFilesStyles(): () => void {
  return insertPluginStyles(PACKAGE_ID, FILES_CSS.join('\n'))
}
