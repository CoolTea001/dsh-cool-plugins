/**
 * The plugin's icon artwork, built from `src/client/assets/*.svg`.
 *
 * The client bundle is one JS file the platform's module loader evaluates, so
 * sibling asset files would never be fetched. tsdown.config.ts reads the artwork
 * at build time and exposes it as the `__DSH_CS_ICONS__` string map this module
 * consumes, keyed by asset filename stem — the arrangement dsh-cool-git uses.
 *
 * dsh-cool-git renders each asset as a React component because those glyphs live
 * in its own trees. This plugin's one glyph sits in the Settings shell's
 * navigation, whose cell is shell-owned DOM, so the parsed artwork is exposed as
 * the markup the patch writes into that seat (the way dsh-cool-theme installs its
 * palette). Parsing still happens once, at module evaluation, with the same
 * viewBox/inner split.
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

/** The Settings navigation's icon seat: the shell draws its own glyphs at 16px. */
const NAV_ICON_SIZE = 16

const ARCHIVE = iconArtwork('archive')

/**
 * The Sessions glyph as complete markup for the shell's navigation seat.
 *
 * It carries its own 16px size because the asset's `1em` would resolve against
 * the nav cell's 14px text, and the stroke is `currentColor`, so the glyph takes
 * the label's color in both appearances.
 */
export const ARCHIVE_NAV_MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" ' +
  `width="${NAV_ICON_SIZE}" height="${NAV_ICON_SIZE}" viewBox="${ARCHIVE.viewBox}" ` +
  `aria-hidden="true" focusable="false">${ARCHIVE.inner}</svg>`
