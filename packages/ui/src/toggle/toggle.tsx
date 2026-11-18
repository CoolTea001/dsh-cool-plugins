/**
 * A button that stays pressed while the choice it names holds.
 *
 * The shell has a `Button` and a `Switch` but nothing between them. A `Switch`
 * reports a setting that has already taken effect — a track moves, the reader
 * watches the consequence. A toggle button reports the *shape of the next
 * action*: the text a selection will be pasted as, the direction a page will
 * print in, the kind of row a list will show. It is a button, it is in a group
 * of its siblings, and the state is visible without being a place in the app.
 * `Switch` cannot say that, and a `Button` that changes its label cannot say it
 * either, because the label is what the action *is*.
 *
 * ## What it is not composed from
 *
 * The obvious build is `Button` plus a pressed fill. That was tried and
 * rejected: the shell's `Button` paints its own variant families from CSS-module
 * classes, and a pressed fill would have to out-rank `.ghost:hover:not(:disabled)`
 * — a rule with a specificity this package cannot see. The result is a control
 * that is correct until the shell adds a variant rule, then quietly wins or
 * loses the cascade on hover. So the markup and the handful of metrics are
 * restated here, deliberately and in the open.
 *
 * The metrics follow the shell's control sizes but take three steps rather than
 * two — 24px, 28px and 32px — because a toggle usually has to match the row it
 * sits in rather than stand on its own. `md` is the default and the step a
 * settings row and a toolbar both land on.
 *
 * ## The pressed state is the attribute
 *
 * Paint is keyed on `[aria-pressed=true]`, not on a class of its own. The
 * attribute is the accessible truth: a keyboard press and a pointer press set
 * the same thing, and there is no second spelling of "pressed" that a caller
 * could forget to keep in step. `data-state="on" | "off"` mirrors it for a page
 * that wants to style a toggle of its own (the way Nuxt UI exposes it).
 *
 * ## No colour prop
 *
 * This package owns no palette, so `color` and `activeColor` have no meaning
 * here: the pressed fill is `--dsw-alias-button-ghost-active-*` for the quiet
 * press and `--dsw-alias-button-primary-*` for the accent one — the two families
 * DSH already paints its own selected chips and filled buttons with. A theme
 * that retints either family retints every toggle in the product, which is the
 * whole point of borrowing them.
 *
 * ## Controlled
 *
 * `pressed` and `onChange(next)` belong to the caller, the same shape the
 * shell's `Switch` takes (`checked` / `onChange`). There is no internal default:
 * a toggle that remembered its own state would disagree with the filter it
 * claims to describe the moment that filter is restored from anywhere else.
 *
 * ```tsx
 * <Toggle pressed={hidden} onChange={setHidden} icon={<IconEye />} aria-label={t('action.toggleHidden')} />
 * ```
 */

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { uiClass } from '../styles/inject.js'

/**
 * How tall a toggle is.
 *
 * Three steps, not the shell's two: a toggle is often the one control in a
 * toolbar or a table row that has to match a neighbour's height rather than set
 * its own, and the shell's 36px/28px pair has nothing between it and a 24px row.
 * The steps are 24px (`sm`), 28px (`md`, the default) and 32px (`lg`); each
 * brings its own radius and type size so the three read as one family. All three
 * are shorter than the shell's filled `Button`, which is deliberate — a toggle
 * is a compact state control, not a page action.
 *
 * The type sizes are the shell scale's 11 / 12 / 13 steps, so a toggle and the
 * shell control beside it are drawn from one scale rather than from this
 * package's own three half-steps.
 */
export type ToggleSize = 'sm' | 'md' | 'lg'

/** The unpressed appearance: a bare control, or one carrying a hairline. */
export type ToggleVariant = 'ghost' | 'outline'

/**
 * The pressed appearance: a quiet neutral fill, or the accent's solid fill.
 *
 * `soft` is the default because most toggles are peers in a row — bolding text
 * beside italicising it, narrowing a list beside widening it — and an accent
 * fill on each one would read as a set of five primary actions. `solid` is for
 * the toggle that is the row's subject, or the only control on a surface.
 */
export type ToggleActiveVariant = 'soft' | 'solid'

/** What {@link ToggleView} takes: the pressed state and how to flip it. */
interface ToggleViewProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-pressed' | 'onChange'> {
  /** Whether the button is drawn pressed. */
  readonly pressed: boolean
  /** Flip the pressed state. Called by a click the caller did not veto. */
  readonly onToggle: () => void
  /** Optional leading 16px icon node, drawn before the label. */
  readonly icon?: ReactNode
  /**
   * The control's height, and with it the radius and the type size.
   *
   * @default 'md'
   */
  readonly size?: ToggleSize
  /**
   * How the button looks while it is not pressed.
   *
   * @default 'ghost'
   */
  readonly variant?: ToggleVariant
  /**
   * How the button looks while it is pressed.
   *
   * @default 'soft'
   */
  readonly activeVariant?: ToggleActiveVariant
  /**
   * Draw the button as a square.
   *
   * The right answer for an icon-only toggle in a toolbar: without it the
   * control keeps the horizontal padding of a labelled button and reads as a
   * wide box holding a small glyph.
   *
   * @default false
   */
  readonly square?: boolean
  readonly children?: ReactNode
}

/**
 * The button behind both toggle shapes: one press, one paint.
 *
 * Not part of the package's public surface. `Toggle` adds the rule that the
 * control must carry an accessible name; `ToggleGroup` adds the roving tab stop.
 * Both must draw the *same* button — a group whose keys were a second
 * implementation would drift the moment either is restyled — so the markup and
 * the state attributes live here once.
 */
export const ToggleView = forwardRef<HTMLButtonElement, ToggleViewProps>(function ToggleView(
  props,
  ref,
): ReactElement {
  const {
    pressed,
    onToggle,
    icon,
    size = 'md',
    variant = 'ghost',
    activeVariant = 'soft',
    square = false,
    className,
    children,
    onClick,
    ...rest
  } = props

  // The caller's own click runs first and may cancel the flip with
  // `preventDefault()` — a toggle that is about to open a dialog, or refuse
  // because a write is in flight, has to be able to say so without its press
  // already having happened.
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    onClick?.(event)
    if (!event.defaultPrevented) onToggle()
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={rest.type ?? 'button'}
      aria-pressed={pressed}
      data-state={pressed ? 'on' : 'off'}
      data-variant={variant}
      data-active-variant={activeVariant}
      data-size={size}
      data-square={square ? '' : undefined}
      className={className === undefined || className === '' ? uiClass('toggle') : `${uiClass('toggle')} ${className}`}
      onClick={handleClick}
    >
      {icon === undefined ? null : (
        <span className={uiClass('toggle-icon')} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
})

/**
 * The accessible name a toggle may carry: visible text, or a label for a glyph.
 *
 * One of the two is required. An icon-only toggle is the common case in a
 * toolbar, and a `<button>` whose only child is a decorative 16px glyph has no
 * accessible name at all — it announces as "button", pressed or not.
 */
type ToggleNameProps =
  | {
      /** The visible label. */
      readonly children: ReactNode
      /** An accessible name, when the visible label is not the whole story. */
      readonly 'aria-label'?: string
    }
  | {
      readonly children?: never
      /** The accessible name of an icon-only toggle. */
      readonly 'aria-label': string
    }

/** What {@link Toggle} takes. */
export type ToggleProps = Omit<ToggleViewProps, 'onToggle' | 'children' | 'pressed'> & {
  /** Whether the choice this button names is in force. */
  readonly pressed: boolean
  /** Flip the pressed state; the caller owns the new value. */
  readonly onChange: (next: boolean) => void
} & ToggleNameProps

/**
 * Render a toggle button.
 *
 * @param props - the pressed state, how to flip it, its appearance, and the
 *   button attributes a caller may pass through.
 * @returns the button, with `aria-pressed` and `data-state` set from `pressed`.
 */
export function Toggle(props: ToggleProps): ReactElement {
  const { pressed, onChange, ...rest } = props
  return <ToggleView {...rest} pressed={pressed} onToggle={() => { onChange(!pressed) }} />
}
