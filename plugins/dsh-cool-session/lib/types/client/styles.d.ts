/**
 * Package-owned stylesheet for the plugin's three surfaces.
 *
 * The native Session menu row and both confirmations are drawn by DSH's own
 * primitives, so this sheet only adds the danger tint on the menu row and on the
 * dialogs' confirm action, the inline refusal blocks, and the Settings page's
 * own controls and table. The section follows the shipped sections' heading and
 * row rhythm. Every color is a `--dsw-*` theme token, so every surface follows
 * the active light or dark appearance — including third-party theme presets —
 * instead of forcing a palette of its own.
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