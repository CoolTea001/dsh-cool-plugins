/**
 * Package-owned stylesheet for the plugin's three surfaces.
 *
 * The native Session menu row and both confirmations are drawn by DSH's own
 * primitives, so this sheet only adds the danger tint on the legacy menu row and
 * on the dialogs' confirm action, the inline refusal blocks, and the Settings
 * page's own controls and table. (Where the menu service carries Delete, its
 * `danger` flag supplies the red row instead.) The section follows the shipped
 * sections' heading and row rhythm. Every color is a `--dsw-*` theme token, so
 * every surface follows the active light or dark appearance — including
 * third-party theme presets — instead of forcing a palette of its own.
 */

/** Build-time define from tsdown.config.ts: the id the loader registers this bundle under. */
declare const __DSH_CS_PLUGIN_ID__: string

/** CSS rules, one selector per line. */
const PLUGIN_CSS = [
  // The legacy menu row uses the same red action token as the dangerous button.
  '.dsh-cs-menu-delete-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-error-primary)}',
  '.dsh-cs-menu-delete-label{color:var(--dsw-alias-state-error-primary)}',

  // The dialog's confirm action is an outline button whose label carries the
  // danger tint, matching the product's other destructive confirmations.
  '.dsh-cs-delete-action:not(:disabled){color:var(--dsw-alias-state-error-primary)}',

  // A refusal stays inside the dialog, under the description, and keeps the
  // service's own diagnostic text readable when it follows the sentence.
  '.dsh-cs-delete-error{padding:8px 9px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:var(--dsw-radius-sm,6px);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);font-size:11.5px;line-height:1.55;white-space:pre-wrap}',

  // The Settings page reuses the shipped sections' content measure and rhythm:
  // an 18px heading, a tertiary intro, then the management table.
  // The page fills the settings options column so only the list scrolls: the
  // heading, toolbar, and bulk bar stay put and the table body owns the
  // remaining height.
  '.dsh-cs-settings{display:flex;flex-direction:column;box-sizing:border-box;height:100%;min-height:0;gap:12px;max-width:760px;color:var(--dsw-alias-label-primary)}',
  '.dsh-cs-settings-heading{margin:0;font-size:18px;font-weight:600;line-height:26px}',
  '.dsh-cs-settings-description{margin:2px 0 0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}',

  // Toolbar: the search box takes the free width; the two filters are the
  // product's Menu anchored to buttons with the same 32px border-box height, so
  // all three controls line up exactly.
  '.dsh-cs-toolbar{display:flex;align-items:center;gap:8px;min-width:0}',
  '.dsh-cs-search{flex:1;min-width:120px;box-sizing:border-box}',
  '.dsh-cs-filter-wrap{flex:none;min-width:0}',
  '.dsh-cs-filter{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;height:32px;max-width:180px;padding:0 8px 0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}',
  '.dsh-cs-filter:hover{border-color:var(--dsw-alias-border-l3)}',
  '.dsh-cs-filter:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
  // The label takes the free width so the caret stays on the control's trailing
  // edge, as it did in the native select, instead of hugging the text.
  '.dsh-cs-filter-label{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
  // Fixed widths keep the toolbar from reflowing when a longer workspace or
  // status label is picked; the labels ellipsize instead.
  '.dsh-cs-filter-workspace{width:150px}',
  '.dsh-cs-filter-archive{width:120px}',
  '.dsh-cs-caret{display:inline-flex;flex:none;align-items:center;justify-content:center;margin-left:auto;color:var(--dsw-alias-label-tertiary)}',
  '.dsh-cs-caret svg{display:block;width:12px;height:12px}',
  // The workspace card is wider than its trigger so a full workspace name fits
  // without making the toolbar itself wider.
  '.dsh-cs-menu.dsh-cs-menu{min-width:180px;max-width:280px}',

  // The selection row is its own line above the table card: the count on the
  // left, the bulk actions on the right only once something is selected. Its
  // fixed 22px height keeps the table from moving when those actions appear.
  '.dsh-cs-selection-bar{display:flex;align-items:center;gap:10px;min-height:22px}',
  '.dsh-cs-selection-count{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
  '.dsh-cs-bulk-actions{display:flex;align-items:center;gap:2px;margin-left:auto}',
  '.dsh-cs-head-check{display:flex;align-items:center;justify-content:center}',
  '.dsh-cs-row-check{justify-self:center}',
  '.dsh-cs-head-check input,.dsh-cs-row-check{margin:0;accent-color:var(--dsw-alias-state-business-primary);cursor:pointer}',
  '.dsh-cs-head-check input:disabled,.dsh-cs-row-check:disabled{cursor:not-allowed;opacity:.4}',

  // One inline refusal, with the Host's own detail after the coded sentence.
  '.dsh-cs-problem{display:flex;align-items:flex-start;gap:8px;padding:7px 9px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:var(--dsw-radius-sm,6px);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}',
  '.dsh-cs-problem span{flex:1;min-width:0;white-space:pre-wrap}',
  '.dsh-cs-problem-dismiss{flex:none;border:0;background:transparent;padding:0 2px;color:inherit;font:inherit;font-size:14px;line-height:18px;cursor:pointer;opacity:.7}',
  '.dsh-cs-problem-dismiss:hover{opacity:1}',

  // The table: one grid row per Session, a muted header, and hairline
  // separators that follow the product's border scale in both appearances.
  // The table fills the page; only its body scrolls, with the header pinned so
  // the column labels survive a long list.
  '.dsh-cs-table{display:flex;flex:1;flex-direction:column;min-height:0;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);overflow:hidden}',
  '.dsh-cs-table-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}',
  '.dsh-cs-table-head,.dsh-cs-row{display:grid;grid-template-columns:22px minmax(0,1fr) 66px 112px;align-items:center;column-gap:8px;padding:8px 10px}',
  '.dsh-cs-table-head{position:sticky;top:0;z-index:1;background:var(--dsw-alias-bg-layer-1);border-bottom:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:18px}',
  '.dsh-cs-head-actions{padding-right:5px;text-align:right}',
  '.dsh-cs-row+.dsh-cs-row{border-top:.5px solid var(--dsw-alias-border-l2)}',
  '.dsh-cs-row:hover{background:var(--dsw-alias-interactive-bg-hover)}',
  '.dsh-cs-main{display:flex;flex-direction:column;gap:1px;min-width:0}',
  '.dsh-cs-title{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}',
  '.dsh-cs-meta{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary)}',
  '.dsh-cs-workspace{overflow:hidden;text-overflow:ellipsis}',
  '.dsh-cs-sep{flex:none;opacity:.7}',
  '.dsh-cs-status{font-size:12px;line-height:18px;white-space:nowrap}',
  '.dsh-cs-status-running{color:var(--dsw-alias-state-success-primary)}',
  '.dsh-cs-status-unarchived{color:var(--dsw-alias-state-warn-primary)}',
  '.dsh-cs-status-archived{color:var(--dsw-alias-label-tertiary)}',
  '.dsh-cs-actions{display:flex;justify-content:flex-end;gap:2px;min-width:0}',
  '.dsh-cs-link{border:0;border-radius:var(--dsw-radius-sm);padding:2px 4px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}',
  '.dsh-cs-link:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
  '.dsh-cs-link:disabled{opacity:.45;cursor:not-allowed}',
  '.dsh-cs-danger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}',
  '.dsh-cs-date{flex:none;font-size:11.5px;line-height:17px;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
  '.dsh-cs-empty{padding:26px 12px;text-align:center;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}',
  '.dsh-cs-empty p{margin:0 0 10px}',

  // The stop-and-archive dialog lists the work families the Host will stop.
  '.dsh-cs-activity{display:flex;flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-secondary)}',

  // The replaced navigation glyph occupies the same 16px seat as the shell's
  // own icons and inherits the cell's label color through `currentColor`.
  '.dsh-cs-nav-icon{display:inline-flex;flex:none;align-items:center;justify-content:center}',
  '.dsh-cs-nav-icon svg{width:16px;height:16px;display:block}',
].join('\n')

/**
 * Insert the stylesheet once for the plugin lifetime.
 *
 * The tag carries the platform's style-ownership record — `data-plugin` with this
 * package's id, which is what every DSH bundle writes on the tags it injects. A
 * tag carrying no attribute is claimed by whichever module materializes next and
 * deleted with it, so naming the owner here keeps the sheet this plugin's own:
 * only a reload of `dsh-cool-session` retires it, and this effect's disposer
 * removes it then anyway.
 *
 * @returns disposer that removes exactly this element.
 */
export function insertStyles(): () => void {
  const element = document.createElement('style')
  element.setAttribute('data-plugin', __DSH_CS_PLUGIN_ID__)
  element.setAttribute('data-dsh-cool-session', 'styles')
  element.textContent = PLUGIN_CSS
  document.head.appendChild(element)
  return () => {
    element.remove()
  }
}
