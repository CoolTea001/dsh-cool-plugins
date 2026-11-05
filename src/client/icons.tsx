/**
 * The plugin's own icon set.
 *
 * Every glyph lives in `assets/` as an SVG, and that file is the source of
 * truth for its artwork: `tsdown` inlines it as text (the `loader` map in
 * tsdown.config.ts, described by assets.d.ts), and the wrapper below narrows the
 * markup to the same `{ size, className }` surface the shell's icons expose, so
 * a call site swaps one for the other without touching its layout.
 *
 * Two properties of the artwork the wrapper keeps: the strokes draw in
 * `currentColor`, so whichever control owns an icon goes on painting it — the
 * sidebar row's hover and selected states included — with no CSS here; and
 * React owns the `<svg>` root, so `size` stays a real prop instead of riding on
 * the asset's own `1em` box.
 */

import * as React from 'react'

import arrowRightSource from './assets/arrow-right.svg'
import arrowUpSource from './assets/arrow-up.svg'
import backSource from './assets/back.svg'
import checkSource from './assets/check.svg'
import docSource from './assets/doc.svg'
import searchSource from './assets/search.svg'
import settingsSource from './assets/settings.svg'
import sparkleSource from './assets/sparkle.svg'

/** What a caller may set on one of these icons. */
export interface IconProps {
  /** Square edge length in px. Defaults to 16, the box the artwork is drawn for. */
  size?: number
  className?: string
}

/** One asset, split into the two pieces its renderer needs. */
interface IconAsset {
  /** The artboard, read from the file so a redrawn glyph keeps its own grid. */
  viewBox: string
  /** Everything the asset holds inside its root `<svg>`, verbatim. */
  inner: string
}

/**
 * Splits the root `<svg>` off an asset. The halves are needed separately because
 * React draws the root — that is where `size` and `className` land — while the
 * inside ships exactly as the file wrote it.
 *
 * A source that is not one `<svg>` carrying a `viewBox` is a mistake in this repo
 * and not something a user can reach, so it throws instead of quietly drawing an
 * empty box.
 */
function parseAsset(source: string, file: string): IconAsset {
  const match = /<svg\b[^>]*\bviewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/.exec(source)
  if (match === null) throw new Error(`dsh-cool-daily: assets/${file} is not a single <svg> with a viewBox`)
  return { viewBox: match[1], inner: match[2] }
}

/**
 * Build one icon component from an asset.
 *
 * The inner markup is this repo's own build-time text, never user input — which
 * is what makes `dangerouslySetInnerHTML` safe here, and the only way to keep the
 * paths byte-identical to the asset's own drawing, `stroke-width` and all.
 */
function icon(displayName: string, file: string, source: string): React.FC<IconProps> {
  const { viewBox, inner } = parseAsset(source, file)
  const Icon = ({ size = 16, className }: IconProps) =>
    React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox,
      className,
      // Decorative: the control around an icon carries the accessible name.
      'aria-hidden': 'true',
      dangerouslySetInnerHTML: { __html: inner },
    })
  Icon.displayName = displayName
  return Icon
}

/** The sheet-of-paper glyph: the sidebar entry's icon, and the empty page's mark. */
export const DocIcon = icon('DocIcon', 'doc.svg', docSource)

/** The sliders glyph: the page's settings entry. */
export const SettingsIcon = icon('SettingsIcon', 'settings.svg', settingsSource)

/** The sparkle glyph: the manual generation action and its running state. */
export const SparkleIcon = icon('SparkleIcon', 'sparkle.svg', sparkleSource)

/** The up arrow: the reading view's back-to-top control. */
export const ArrowUpIcon = icon('ArrowUpIcon', 'arrow-up.svg', arrowUpSource)

/** The magnifier glyph: the article search field. */
export const SearchIcon = icon('SearchIcon', 'search.svg', searchSource)

/** The left arrow: the article reader's way back to the list. */
export const BackIcon = icon('BackIcon', 'back.svg', backSource)

/**
 * The disclosure mark, drawn pointing right and turned by the stylesheet: the
 * model picker's trigger turns it down while closed and up while open, and a
 * provider row turns it down while its models are showing.
 */
export const ArrowRightIcon = icon('ArrowRightIcon', 'arrow-right.svg', arrowRightSource)

/** The check a chosen row carries. */
export const CheckIcon = icon('CheckIcon', 'check.svg', checkSource)
