/**
 * Package-owned stylesheet for the Daily Post page.
 *
 * The sheet follows the shipped first-level pages' frame — the same centered
 * column, first-level heading, and macOS hiddenInset titlebar clearance — so
 * this panel sits beside Plugins and Automated Tasks without looking like a
 * different surface. Every color is a `--dsw-*` theme token, so the page follows
 * the active light or dark appearance, including third-party theme presets,
 * instead of forcing a palette of its own.
 */

/** Build-time define from tsdown.config.ts: the id the loader registers this bundle under. */
declare const __DSH_CD_PLUGIN_ID__: string

/** CSS rules, one selector per line. */
const PLUGIN_CSS = [
  // Sidebar glyph and its unread mark. The mark is a child of this box but the
  // slot positions it against the row (pinned to the row's right edge, centred on
  // its height), so the row's flex layout never reserves space for it — an
  // arriving article adds the pill without widening the row or moving the text.
  // `visibility` is hidden until the first measurement lands, so it is never
  // painted at a stale offset. The pill repeats the article card's "New" badge at
  // the row's smaller scale; the dot is the rail's stand-in, where there is no
  // width for a word.
  '.dsh-cd-glyph{position:relative;display:inline-flex;align-items:center;justify-content:center}',
  '.dsh-cd-mark{position:absolute;left:0;top:0;display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary);font-size:11px;font-weight:500;line-height:1;white-space:nowrap;visibility:hidden;pointer-events:none;z-index:1}',
  '.dsh-cd-mark-dot{position:absolute;left:0;top:0;display:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary);visibility:hidden;pointer-events:none;z-index:1}',
  // The page fills the main column and owns the scrolling region. It paints no
  // fill of its own: the frame (and, on a themed build, the wallpaper behind it)
  // supplies the surface, so the page sits on the same canvas as the
  // conversation instead of laying an opaque sheet over the theme background.
  '.dsh-cd-page{display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:transparent;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}',
  // The scroll region runs the full width of the panel, so its scrollbar sits at
  // the window edge; the centred column lives inside it. The mask is what draws
  // the edge fades — rows lose alpha toward whichever edge still hides content,
  // so the column reads as a window rather than as a clipped box.
  //
  // Two mask layers, not one. A mask applies to the scrollbar too, so an area
  // left outside a layer is not "left alone" but erased: a `mask-size` that
  // stopped at the scrollbar gutter hid the bar outright. The fade layer covers
  // the content column only, and a second opaque layer covers the gutter
  // (`--dsh-cd-fade-right`, written by the page's edge-fade effect) so the
  // scrollbar keeps its full height while the rows fade.
  //
  // The fade layer must be a *gradient*, never `none`: with `none` the only
  // layer left is the gutter strip, and everything outside it — the whole
  // column — is masked away. It therefore starts as an opaque fill and the
  // overflow attributes swap in the real gradients; that also keeps a short
  // list, which never sets an attribute, simply unmasked.
  '.dsh-cd-scroll-wrap{position:relative;display:flex;flex:1;flex-direction:column;min-height:0}',
  '.dsh-cd-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable both-edges;--dsh-scrollbar-width:9px;--dsh-scrollbar-thumb-border:2px;--dsh-cd-fade:linear-gradient(#000,#000);mask-image:var(--dsh-cd-fade),linear-gradient(#000,#000);mask-repeat:no-repeat;mask-position:0 0,100% 0;mask-size:calc(100% - var(--dsh-cd-fade-right,0px)) 100%,var(--dsh-cd-fade-right,0px) 100%}',
  '[data-fade-top] .dsh-cd-scroll{--dsh-cd-fade:linear-gradient(to bottom,#0000,#000 28px)}',
  '[data-fade-bottom] .dsh-cd-scroll{--dsh-cd-fade:linear-gradient(to top,#0000,#000 28px)}',
  '[data-fade-top][data-fade-bottom] .dsh-cd-scroll{--dsh-cd-fade:linear-gradient(to bottom,#0000,#000 28px,#000 calc(100% - 28px),#0000)}',
  '.dsh-cd-content{box-sizing:border-box;width:100%;max-width:860px;margin:0 auto;padding:0 clamp(20px,5vw,48px) 64px}',
  // The heading block keeps its own gutter and keeps no bottom padding: the
  // scroller below it starts the rows.
  '.dsh-cd-content-head{flex:none;padding-bottom:0}',

  // Heading row: the page name and its two actions on one line, the description
  // beneath. The top inset belongs to the row and grows under the macOS
  // hiddenInset titlebar, matching the sibling pages' clearance.
  '.dsh-cd-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding-top:32px;margin-bottom:20px}',
  "[data-platform='darwin'] .dsh-cd-head{padding-top:calc(32px + var(--dsh-frame-top-clearance,0px))}",
  '.dsh-cd-head-copy{min-width:0}',
  '.dsh-cd-title{margin:0;font-size:28px;line-height:1.3;font-weight:600;letter-spacing:-.01em}',
  '.dsh-cd-title:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px;border-radius:4px}',
  '.dsh-cd-description{margin:8px 0 0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}',
  '.dsh-cd-actions{display:flex;flex:0 0 auto;align-items:center;gap:8px}',

  // Buttons: one shape for ghost and primary, so the two header actions align on
  // the same box regardless of which surface they draw.
  '.dsh-cd-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;box-sizing:border-box;height:34px;padding:0 14px;border:.5px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1;white-space:nowrap;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,opacity .15s ease}',
  '.dsh-cd-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l4)}',
  '.dsh-cd-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  '.dsh-cd-btn:disabled{opacity:.55;cursor:default}',
  '.dsh-cd-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}',
  '.dsh-cd-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));border-color:transparent;filter:brightness(.97)}',
  '.dsh-cd-btn-primary:disabled{opacity:.6}',

  // A quiet notice strip: the automatic-generation hint and the failure notice
  // share one shape so the page has a single banner rhythm.
  '.dsh-cd-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:9px 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 78%,transparent);color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:18px}',
  '.dsh-cd-banner-error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}',
  '.dsh-cd-link{padding:0;border:none;background:none;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12.5px;white-space:nowrap;cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
  '.dsh-cd-link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:3px}',

  // Toolbar: search takes the free width, category badges wrap beneath it when
  // the row runs out of space.
  '.dsh-cd-toolbar{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-bottom:18px}',
  '.dsh-cd-search{position:relative;display:flex;flex:0 0 auto;align-items:center;width:100%;min-width:0}',
  '.dsh-cd-search-icon{position:absolute;left:11px;color:var(--dsw-alias-label-secondary);pointer-events:none}',
  '.dsh-cd-search input{box-sizing:border-box;width:100%;height:38px;padding:0 12px 0 33px;border:.5px solid var(--dsw-alias-border-l3);border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1;appearance:none}',
  '.dsh-cd-search input::placeholder{color:var(--dsw-alias-label-secondary)}',
  '.dsh-cd-search input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
  // Category filters are DSH Pills; this row only spaces them.
  '.dsh-cd-badges{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding-left:1px}',

  // The list: one full-width card per article, the category and day above the
  // title, the opening sentence beneath it.
  // The list starts a hair below the scrollport. Flush against it, the first
  // card's own edge sits exactly on the clip boundary — the scroll container has
  // no top padding — so the top of its outline is cut off and the hairline reads
  // thinner than the other three sides (and the hover ring loses its top row
  // entirely). A small gap is enough for the stroke to land inside the scroller,
  // and it doubles as breathing room under the toolbar.
  '.dsh-cd-list{display:flex;flex-direction:column;gap:10px;padding-top:8px}',
  '.dsh-cd-card{display:flex;flex-direction:column;align-items:stretch;gap:7px;box-sizing:border-box;width:100%;padding:16px 18px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s ease,box-shadow .15s ease}',
  // Hover doubles the hairline to 1px. The extra half pixel is a ring rather than
  // a border width: `box-shadow` paints outside the box, so the stroke grows
  // while the card's content box, padding, and position stay exactly where they
  // were — a 0.5px→1px border would move the text half a pixel and could rewrap
  // a line under the pointer.
  '.dsh-cd-card:hover{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 .5px var(--dsw-alias-brand-primary)}',
  '.dsh-cd-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  // Card footer: tags on the left, publication day and read state on the right.
  '.dsh-cd-card-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;margin-top:2px}',
  '.dsh-cd-card-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0}',
  '.dsh-cd-card-meta{display:inline-flex;flex:none;align-items:center;gap:8px;margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:17px;font-variant-numeric:tabular-nums}',
  // The delete control is a word, not a button: it sits after the date and only
  // raises its voice — the error token — under the pointer.
  '.dsh-cd-delete{padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;line-height:17px;cursor:pointer}',
  '.dsh-cd-delete:hover{color:var(--dsw-alias-state-error-primary)}',
  '.dsh-cd-delete:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:2px}',
  // The unread marker sits in the card's top-right corner, opposite the title.
  '.dsh-cd-card-head{display:flex;align-items:flex-start;gap:10px}',
  '.dsh-cd-new{flex:none;display:inline-flex;align-items:center;height:20px;margin-top:1px;padding:0 8px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary);font-size:11px;font-weight:500;line-height:1;white-space:nowrap}',

  '.dsh-cd-date{color:var(--dsw-alias-label-secondary);font-size:11.5px;font-variant-numeric:tabular-nums}',
  '.dsh-cd-card-title{flex:1;min-width:0;font-size:15px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}',
  '.dsh-cd-card-excerpt{display:-webkit-box;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.7;-webkit-box-orient:vertical;-webkit-line-clamp:2}',

  // Empty and status states share the centered column rhythm.
  '.dsh-cd-empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:56px 24px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent);text-align:center}',
  '.dsh-cd-empty-icon{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;margin-bottom:8px;border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-secondary)}',
  '.dsh-cd-empty-title{margin:0;font-size:14px;font-weight:500}',
  '.dsh-cd-empty-hint{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:19px}',
  '.dsh-cd-state{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px 16px;color:var(--dsw-alias-label-secondary);font-size:13px;text-align:center}',

  // The reader: back link, title, metadata, then the Markdown body on its own
  // measure inside the page column.
  '.dsh-cd-article{padding-top:32px}',
  "[data-platform='darwin'] .dsh-cd-article{padding-top:calc(32px + var(--dsh-frame-top-clearance,0px))}",
  // Back is a solid disc, not a labelled control: the arrow is the whole
  // affordance. It is opaque because it sits on the page's transparent canvas —
  // a veil here would let the wallpaper blur the glyph.
  '.dsh-cd-back{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;transition:background-color .15s ease}',
  '.dsh-cd-back:hover{background:var(--dsw-alias-bg-layer-3)}',
  '.dsh-cd-back:active{background:var(--dsw-alias-interactive-bg-active)}',
  '.dsh-cd-back:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  // Back to top: a floating disc in the reading view, shown only once the reader
  // is deep enough that the first line is no longer a glance away. It rides the
  // scroll wrapper rather than the scroller, so it stays put while the article
  // moves — and, being outside the masked scroller, its glyph never fades.
  //
  // The horizontal offset is the content column's own: on a wide window the disc
  // sits in the gutter just outside the column, so a floating control never
  // covers a line of prose; on a narrow one there is no gutter and it falls back
  // to the window's corner, the way every floating action does.
  '.dsh-cd-totop{position:absolute;right:max(24px,calc((100% - 860px) / 2 - 44px));bottom:24px;z-index:2;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-lv2);cursor:pointer;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(4px);transition:opacity .15s ease,transform .15s ease,visibility .15s ease,background-color .15s ease}',
  '[data-can-top] .dsh-cd-totop{opacity:1;visibility:visible;pointer-events:auto;transform:none}',
  '.dsh-cd-totop:hover{background:var(--dsw-alias-bg-layer-3)}',
  '.dsh-cd-totop:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',

  '.dsh-cd-article-head{margin:18px 0 22px;padding-bottom:18px;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
  '.dsh-cd-article-title{margin:0;font-size:25px;line-height:1.4;font-weight:600;letter-spacing:-.01em}',
  '.dsh-cd-article-meta{display:flex;align-items:center;gap:10px;margin-top:12px;color:var(--dsw-alias-label-secondary);font-size:12px}',
  '.dsh-cd-article-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px}',
  '.dsh-cd-md{max-width:760px;font-size:14px;line-height:1.85;overflow-wrap:anywhere}',
  '.dsh-cd-md h1,.dsh-cd-md h2,.dsh-cd-md h3,.dsh-cd-md h4{margin:26px 0 10px;line-height:1.45;font-weight:600}',
  '.dsh-cd-md h1{font-size:22px}',
  '.dsh-cd-md h2{font-size:18px}',
  '.dsh-cd-md h3{font-size:15.5px}',
  '.dsh-cd-md h4{font-size:14px}',
  '.dsh-cd-md p{margin:0 0 14px}',
  '.dsh-cd-md ul,.dsh-cd-md ol{margin:0 0 14px;padding-left:22px}',
  '.dsh-cd-md li{margin:4px 0}',
  '.dsh-cd-md blockquote{margin:0 0 14px;padding:6px 14px;border-left:3px solid var(--dsw-alias-border-l3);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 60%,transparent);color:var(--dsw-alias-label-secondary)}',
  '.dsh-cd-md blockquote p:last-child{margin-bottom:0}',
  '.dsh-cd-md code{padding:1px 5px;border-radius:4px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 85%,transparent);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}',
  '.dsh-cd-md pre{margin:0 0 16px;padding:12px 14px;overflow:auto;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,transparent)}',
  '.dsh-cd-md pre code{padding:0;border-radius:0;background:none;font-size:12.5px;line-height:1.7}',
  '.dsh-cd-md a{color:var(--dsw-alias-brand-primary);text-decoration:underline;text-underline-offset:2px}',
  '.dsh-cd-md hr{margin:26px 0;border:none;border-top:.5px solid var(--dsw-alias-border-l2)}',
  '.dsh-cd-md strong{font-weight:600}',

  // Settings dialog body: the Modal primitive owns the frame, mask, header,
  // and action row; this sheet only supplies the form controls.
  '.dsh-cd-field{display:flex;flex-direction:column;gap:6px;margin-top:18px}',
  '.dsh-cd-field:first-child{margin-top:0}',
  // The Modal primitive owns the frame; the form may still outgrow a short
  // window, so its content column scrolls while the action row stays put.
  // The Modal primitive caps its card at 380px; this form carries a prose
  // textarea and a seven-day row, so the plugin widens its own instance to
  // 1.5x while keeping the primitive's chrome, mask, and focus behavior. The
  // primitive's own class is hashed, so the plugin's class is repeated here:
  // two classes outrank its single-class width rule whatever the sheet order.
  '.dsh-cd-dialog-wide.dsh-cd-dialog-wide{width:min(570px,100%)}',
  // Only the fields scroll: the title, the description, and the action row stay
  // where they are. The negative margin lets the scrollport — and so its
  // scrollbar — run out to the card's own edge while the fields keep the dialog's
  // 24px gutter, the same arrangement the page's list uses.
  '.dsh-cd-dialog-scroll{max-height:min(52vh,470px);overflow:auto;margin:0 -24px;padding:0 24px;scrollbar-gutter:stable}',
  '.dsh-cd-field-label{display:block;font-size:13px;font-weight:500;line-height:1.5}',
  '.dsh-cd-textarea{box-sizing:border-box;width:100%;min-height:124px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.6;resize:vertical}',
  '.dsh-cd-textarea:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}',
  // The count row is DSH's own SettingsValueField, which already brings the
  // input chrome; the plugin only trims the gap above it to match the form.
  '.dsh-cd-count{margin-top:6px}',
  // The model picker, ported from dsh-cool-git: the trigger repeats the field
  // material (half-pixel border, layer fill, business token on focus), and the
  // list is a fixed-height popover with its own search row and overlay thumb.
  '.dsh-cd-picker{display:flex;flex-direction:column;min-width:0}',
  '.dsh-cd-picker-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;box-sizing:border-box;width:100%;height:36px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:34px;text-align:left;cursor:pointer}',
  '.dsh-cd-picker-trigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}',
  '.dsh-cd-picker-trigger:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary)}',
  '.dsh-cd-picker-trigger:disabled{opacity:.6;cursor:default}',
  '.dsh-cd-picker-value{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  // One glyph, two states: pointing down while the panel is closed and up while
  // it is open. The group headers turn the same asset the other way, because
  // there the mark names a row that opens under it.
  '.dsh-cd-picker-chevron{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}',
  '.dsh-cd-picker-chevron svg{display:block;width:14px;height:14px;transform:rotate(90deg);transition:transform .12s ease}',
  '.dsh-cd-picker-chevron[data-open=true] svg{transform:rotate(-90deg)}',
  // The panel is portaled to the body: the dialog body scrolls, and a panel
  // inside that scrollport would be clipped by it.
  '.dsh-cd-picker-popover{position:fixed;box-sizing:border-box;display:flex;flex-direction:column;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-module-platform);box-shadow:var(--dsw-shadow-lv3,0 12px 32px rgba(0,0,0,.18));overflow:hidden}',
  '.dsh-cd-picker-search{flex:none;display:flex;align-items:center;height:40px;padding:0 12px;border-bottom:.5px solid var(--dsw-alias-border-l4)}',
  '.dsh-cd-picker-input{box-sizing:border-box;width:100%;height:100%;padding:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}',
  '.dsh-cd-picker-input::placeholder{color:var(--dsw-alias-label-tertiary)}',
  // The list takes the rest of the fixed-height panel and scrolls inside it, so
  // a search that narrows the catalog never changes the surface's shape.
  '.dsh-cd-picker-listwrap{position:relative;flex:1 1 auto;min-height:0}',
  '.dsh-cd-picker-list{height:100%;overflow-y:auto;scrollbar-width:none}',
  '.dsh-cd-picker-list::-webkit-scrollbar{display:none}',
  '.dsh-cd-picker-thumb{position:absolute;right:2px;z-index:2;width:5px;border-radius:999px;background:var(--dsw-alias-scrollbar-bg-l2);pointer-events:none}',
  '.dsh-cd-picker-row{display:flex;align-items:center;gap:2px;min-width:0}',
  '.dsh-cd-picker-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
  '.dsh-cd-picker-row[data-selected=true]{background:var(--dsw-alias-interactive-bg-active)}',
  '.dsh-cd-picker-row-name{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;padding:7px 4px 7px 8px;border:0;border-radius:var(--dsw-radius-xs,4px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:20px;text-align:left;cursor:pointer}',
  '.dsh-cd-picker-row-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsh-cd-picker-row-hint{flex:none;min-width:0;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:11.5px;text-overflow:ellipsis;white-space:nowrap}',
  '.dsh-cd-picker-row-check{flex:none;display:inline-flex;color:var(--dsw-alias-state-business-primary)}',
  '.dsh-cd-picker-row-check svg{display:block;width:12px;height:12px}',
  // The effort control runs to the row's own edge: square on the left where it
  // meets the name, rounded on the right with the row's radius, so its hover fill
  // reads as the row's end rather than as a pill floating inside it.
  '.dsh-cd-picker-row-effort{align-self:stretch;flex:none;display:inline-flex;align-items:center;gap:4px;padding:0 10px 0 8px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;cursor:pointer}',
  'button.dsh-cd-picker-row-effort:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}',
  // The control's arrow is a fixed down chevron: the menu only ever drops below
  // the row, and it is the same size as the provider rows' arrow.
  '.dsh-cd-picker-row-arrow{display:inline-flex;align-items:center;justify-content:center}',
  '.dsh-cd-picker-row-arrow svg{display:block;width:12px;height:12px;transform:rotate(90deg)}',
  // The platform menu wraps its anchor in an inline-flex span; both take the
  // row's full height.
  '.dsh-cd-picker-effort-control{align-self:stretch}',
  // A provider header sticks to the top while its models scroll under it, so a
  // row is never read without the group it belongs to.
  '.dsh-cd-picker-group-sticky{position:sticky;top:0;z-index:1}',
  '.dsh-cd-picker-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 10px 7px 8px;border:0;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;font-weight:600;line-height:20px;text-align:left;cursor:pointer}',
  '.dsh-cd-picker-group-arrow{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}',
  '.dsh-cd-picker-group-arrow svg{display:block;width:12px;height:12px;transform:rotate(0);transition:transform .12s ease}',
  '.dsh-cd-picker-group-arrow[data-open=true] svg{transform:rotate(90deg)}',
  '.dsh-cd-picker-group-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsh-cd-picker-row-name:focus-visible,.dsh-cd-picker-row-effort:focus-visible,.dsh-cd-picker-group-head:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}',
  '.dsh-cd-picker-rule{margin:6px 4px;border-top:.5px solid var(--dsw-alias-border-l3)}',
  '.dsh-cd-picker-empty{margin:8px 8px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
  '.dsh-cd-days{display:flex;flex-wrap:wrap;gap:6px}',
  '.dsh-cd-day{width:36px;height:36px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer}',
  '.dsh-cd-day:hover{border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary)}',
  '.dsh-cd-day:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  '.dsh-cd-day-active{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}',
  '.dsh-cd-day-active:hover{border-color:transparent;color:var(--dsw-alias-label-primary-foreground)}',
  '.dsh-cd-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}',
  '.dsh-cd-dialog-narrow.dsh-cd-dialog-narrow{width:min(380px,100%)}',
  // The destructive action keeps the platform button's geometry and swaps its
  // fill for the error token; repeated classes outrank the variant's own rule.
  '.dsh-cd-btn-danger.dsh-cd-btn-danger{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-foreground)}',
  '.dsh-cd-btn-danger.dsh-cd-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 86%,#000)}',
  '.dsh-cd-dialog-error{margin:16px 0 0;padding:8px 10px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}',

  '@keyframes dsh-cd-spin{to{transform:rotate(360deg)}}',
  '.dsh-cd-spin{animation:dsh-cd-spin 1.1s linear infinite}',

  // Narrow windows stack the heading actions under the copy and let the badges
  // take their own row.
  '@media (max-width:720px){.dsh-cd-head{flex-direction:column;align-items:stretch;gap:14px}.dsh-cd-actions{justify-content:flex-end}}',
].join('')

/**
 * Mount the page's stylesheet for the plugin's lifetime.
 * @returns the disposer that removes the style element.
 */
export function insertStyles(): () => void {
  const element = document.createElement('style')
  element.setAttribute('data-plugin', __DSH_CD_PLUGIN_ID__)
  element.setAttribute('data-dsh-cool-daily', 'styles')
  element.textContent = PLUGIN_CSS
  document.head.appendChild(element)
  return () => {
    element.remove()
  }
}
