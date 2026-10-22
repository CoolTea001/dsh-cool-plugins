/**
 * Package-owned stylesheet for the plugin's two surfaces.
 *
 * The native Session menu row and the delete confirmation are drawn by DSH's own
 * primitives, so this sheet only adds the danger tint on the menu row and on the
 * dialog's confirm action, plus the inline refusal block. Every color is a
 * `--dsw-*` theme token, so both follow the active light or dark appearance —
 * including third-party theme presets — instead of forcing a palette of their own.
 */

/** Build-time define from tsdown.config.ts: the id the loader registers this bundle under. */
declare const __DSH_CS_PLUGIN_ID__: string

/** CSS rules, one selector per line. */
const PLUGIN_CSS = [
  // The menu row uses the same red action token as the dangerous button.
  '.dsh-cs-menu-delete-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-error-primary)}',
  '.dsh-cs-menu-delete-label{color:var(--dsw-alias-state-error-primary)}',

  // The dialog's confirm action is an outline button whose label carries the
  // danger tint, matching the product's other destructive confirmations.
  '.dsh-cs-delete-action:not(:disabled){color:var(--dsw-alias-state-error-primary)}',

  // A refusal stays inside the dialog, under the description, and keeps the
  // service's own diagnostic text readable when it follows the sentence.
  '.dsh-cs-delete-error{padding:8px 9px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:var(--dsw-radius-sm,6px);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);font-size:11.5px;line-height:1.55;white-space:pre-wrap}',
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
