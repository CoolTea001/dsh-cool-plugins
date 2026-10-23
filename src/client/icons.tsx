/**
 * The page's glyphs — the header's refresh and eye, and the arrow each tree
 * branch turns when it opens — are the SVGs under `src/client/assets/`: the
 * client bundle is one JS file the platform's module loader evaluates, so a
 * sibling asset would never be fetched. `tsdown.config.ts` reads the artwork at
 * build time and exposes it as the `__DSH_CF_ICONS__` string map consumed here.
 *
 * Each asset is 24-unit stroke markup riding `currentColor`, so the glyph tints
 * with the surrounding CSS, and it carries no size of its own: the seat that
 * wraps it decides that (`.dsh-cf-icon-btn svg` in `styles.ts`).
 *
 * The folder and file glyphs are drawn inline instead — they are small enough
 * that a separate asset would only add a file — and also ride `currentColor`.
 */

import { createElement, type ReactElement } from 'react'

/** Build-time define from tsdown.config.ts: raw SVG text per asset stem. */
declare const __DSH_CF_ICONS__: Record<string, string>

/** One asset's parsed artwork: the root viewBox, and the markup inside `<svg>`. */
interface IconArtwork {
  readonly viewBox: string
  readonly inner: string
}

/**
 * Parse one asset's raw SVG into the artwork its component renders.
 *
 * The root element is dropped rather than copied: its `width`/`height` belong to
 * the asset, not to this seat, and the root's `xmlns` would be redundant once the
 * markup is part of a larger document.
 *
 * @param name - the asset filename stem, e.g. `refresh` for `assets/refresh.svg`.
 * @returns the viewBox and inner markup to render.
 */
function iconArtwork(name: string): IconArtwork {
  const raw = __DSH_CF_ICONS__[name]
  if (raw === undefined) {
    throw new Error(`dsh-cool-file: missing icon asset '${name}.svg'`)
  }
  return {
    viewBox: /viewBox="([^"]+)"/.exec(raw)?.[1] ?? '0 0 24 24',
    inner: /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? '',
  }
}

const REFRESH = iconArtwork('refresh')
const SHOW = iconArtwork('show')
const HIDE = iconArtwork('hide')
const ARROW = iconArtwork('arrow')

/**
 * Render one asset's artwork as a glyph.
 *
 * @param artwork - the asset parsed by {@link iconArtwork}.
 * @returns the svg element, sized and tinted by its seat.
 */
function assetIcon(artwork: IconArtwork): ReactElement {
  return createElement('svg', {
    viewBox: artwork.viewBox,
    width: '1em',
    height: '1em',
    'aria-hidden': 'true',
    focusable: 'false',
    dangerouslySetInnerHTML: { __html: artwork.inner },
  })
}

/** A closed folder. */
export function IconFolder({ size = 15 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.75 3.25c0-.55.45-1 1-1h2.94c.3 0 .58.13.77.36l1.13 1.39h5.66c.55 0 1 .45 1 1v7.5c0 .55-.45 1-1 1H2.75c-.55 0-1-.45-1-1V3.25Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A text file with a folded corner. */
export function IconFile({ size = 15 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 1.75h4.9L12.5 5.4v8.85c0 .55-.45 1-1 1h-7.5c-.55 0-1-.45-1-1V2.75c0-.55.45-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M8.75 1.9v3.6h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

/** The circular arrow that re-reads the tree (assets/refresh.svg). */
export function IconRefresh(): ReactElement {
  return assetIcon(REFRESH)
}

/** An open eye: the tree is showing entries the system hides (assets/show.svg). */
export function IconShow(): ReactElement {
  return assetIcon(SHOW)
}

/** A struck-through eye: the tree is hiding those entries (assets/hide.svg). */
export function IconHide(): ReactElement {
  return assetIcon(HIDE)
}

/** The arrow a branch turns from closed to open (assets/arrow.svg). */
export function IconArrow(): ReactElement {
  return assetIcon(ARROW)
}
