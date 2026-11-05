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
  // The page fills the main column and owns the scrolling region. It paints no
  // fill of its own: the frame (and, on a themed build, the wallpaper behind it)
  // supplies the surface, so the page sits on the same canvas as the
  // conversation instead of laying an opaque sheet over the theme background.
  '.dsh-cd-page{display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:transparent;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}',
  '.dsh-cd-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable;--dsh-scrollbar-width:9px;--dsh-scrollbar-thumb-border:2px}',
  '.dsh-cd-content{box-sizing:border-box;width:100%;max-width:860px;margin:0 auto;padding:0 clamp(20px,5vw,48px) 64px}',

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
  '.dsh-cd-list{display:flex;flex-direction:column;gap:10px}',
  '.dsh-cd-card{display:flex;flex-direction:column;align-items:stretch;gap:7px;box-sizing:border-box;width:100%;padding:16px 18px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,transform .15s ease}',
  '.dsh-cd-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3);transform:translateY(-1px)}',
  '.dsh-cd-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  '.dsh-cd-card-top{display:flex;align-items:center;gap:9px}',

  '.dsh-cd-date{color:var(--dsw-alias-label-secondary);font-size:11.5px;font-variant-numeric:tabular-nums}',
  '.dsh-cd-card-title{font-size:15px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}',
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
  '.dsh-cd-back{height:30px;padding:0 10px;background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary)}',
  '.dsh-cd-back:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:transparent;color:var(--dsw-alias-label-primary)}',
  '.dsh-cd-article-head{margin:18px 0 22px;padding-bottom:18px;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
  '.dsh-cd-article-title{margin:0;font-size:25px;line-height:1.4;font-weight:600;letter-spacing:-.01em}',
  '.dsh-cd-article-meta{display:flex;align-items:center;gap:10px;margin-top:12px;color:var(--dsw-alias-label-secondary);font-size:12px}',
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
  '.dsh-cd-dialog-content{max-height:min(68vh,620px);overflow:auto}',
  '.dsh-cd-field-label{display:block;font-size:13px;font-weight:500;line-height:1.5}',
  '.dsh-cd-textarea{box-sizing:border-box;width:100%;min-height:124px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.6;resize:vertical}',
  '.dsh-cd-textarea:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}',
  // The count row is DSH's own SettingsValueField, which already brings the
  // input chrome; the plugin only trims the gap above it to match the form.
  '.dsh-cd-count{margin-top:6px}',
  '.dsh-cd-days{display:flex;flex-wrap:wrap;gap:6px}',
  '.dsh-cd-day{width:36px;height:36px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer}',
  '.dsh-cd-day:hover{border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary)}',
  '.dsh-cd-day:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  '.dsh-cd-day-active{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}',
  '.dsh-cd-day-active:hover{border-color:transparent;color:var(--dsw-alias-label-primary-foreground)}',
  '.dsh-cd-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}',
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
