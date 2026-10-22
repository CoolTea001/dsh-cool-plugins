/**
 * The plugin's icon artwork, built from `src/client/assets/*.svg`.
 *
 * The client bundle is one JS file the platform's module loader evaluates, so
 * sibling asset files would never be fetched. tsdown.config.ts reads the artwork
 * at build time and exposes it as the `__DSH_CS_ICONS__` string map this module
 * consumes, keyed by asset filename stem — the arrangement dsh-cool-git uses.
 *
 * dsh-cool-git renders each asset as a React component because those glyphs live
 * in its own trees. This plugin's glyphs have different owners: the Settings
 * navigation cell is shell-owned DOM, so the archive artwork is exposed as the
 * markup the patch writes into that seat (the way dsh-cool-theme installs its
 * palette); the filter caret is drawn by this package's own page, so its markup
 * is embedded the same way inside the trigger. Parsing still happens once, at
 * module evaluation, with the same viewBox/inner split.
 */

/** Build-time define from tsdown.config.ts: raw SVG text per asset stem. */
declare const __DSH_CS_ICONS__: Record<string, string>

/** One asset's parsed artwork: the root viewBox, and the markup inside `<svg>`. */
interface IconArtwork {
  readonly viewBox: string
  readonly inner: string
}

/**
 * Parse one asset's raw SVG into the artwork the nav patch inserts.
 *
 * The root element is dropped rather than copied: its `width`/`height` belong to
 * the asset, not to the shell's 16px icon seat, and the root's `xmlns` would be
 * redundant once the markup is part of the page.
 *
 * @param name - the asset filename stem, e.g. `archive` for `assets/archive.svg`.
 * @returns the viewBox and inner markup to render.
 */
function iconArtwork(name: string): IconArtwork {
  const raw = __DSH_CS_ICONS__[name]
  if (raw === undefined) {
    throw new Error(`dsh-cool-session: missing icon asset '${name}.svg'`)
  }
  return {
    viewBox: /viewBox="([^"]+)"/.exec(raw)?.[1] ?? '0 0 24 24',
    inner: /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? '',
  }
}

/** Complete SVG markup for one asset at a fixed square size. */
function iconMarkup(name: string, size: number): string {
  const artwork = iconArtwork(name)
  return '<svg xmlns="http://www.w3.org/2000/svg" ' +
    `width="${size}" height="${size}" viewBox="${artwork.viewBox}" ` +
    `aria-hidden="true" focusable="false">${artwork.inner}</svg>`
}

/** The Settings navigation's icon seat: the shell draws its own glyphs at 16px. */
const NAV_ICON_SIZE = 16

/** The filter triggers' caret, sized to sit inside a 32px control. */
const CARET_SIZE = 12

/**
 * The Sessions glyph as complete markup for the shell's navigation seat.
 *
 * It carries its own 16px size because the asset's `1em` would resolve against
 * the nav cell's 14px text, and the stroke is `currentColor`, so the glyph takes
 * the label's color in both appearances.
 */
export const ARCHIVE_NAV_MARKUP = iconMarkup('archive', NAV_ICON_SIZE)

/**
 * The caret beside the panel's two filter triggers.
 *
 * `assets/arrow-down.svg` strokes with `currentColor`, so the trigger's label
 * color reaches it; the fixed 12px keeps it clear of the control's 13px text.
 */
export const ARROW_DOWN_MARKUP = iconMarkup('arrow-down', CARET_SIZE)
