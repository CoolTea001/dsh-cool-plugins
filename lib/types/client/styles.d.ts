/**
 * Package-owned stylesheet for the plugin's two surfaces.
 *
 * The native Session menu row and the delete confirmation are drawn by DSH's own
 * primitives, so this sheet only adds the danger tint on the menu row and on the
 * dialog's confirm action, plus the inline refusal block. Every color is a
 * `--dsw-*` theme token, so both follow the active light or dark appearance —
 * including third-party theme presets — instead of forcing a palette of their own.
 */
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
export declare function insertStyles(): () => void;
//# sourceMappingURL=styles.d.ts.map