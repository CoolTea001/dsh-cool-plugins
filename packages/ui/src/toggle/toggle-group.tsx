/**
 * A row of toggle buttons that take turns being pressed.
 *
 * The group exists for the part that is easy to get wrong one button at a time:
 * *one* tab stop for the row. A page that renders five `<Toggle>`s beside each
 * other gets five stops, so a keyboard reader who only wants the list below has
 * to press Tab five times to cross a toolbar — and every one of those stops
 * announces "pressed" / "not pressed" for a choice that reads as one control.
 * The group keeps a single stop on the pressed item (or the first enabled one
 * while nothing is pressed) and moves the stop with the arrow keys, so the row
 * is one thing in the tab order and one thing to the arrow keys.
 *
 * ## Two shapes, one component
 *
 * `type="single"` is a choice among alternatives — the alignment of a selection,
 * the width a page prints at, the category a list is filtered to. `type="multiple"`
 * is a set of independent switches — which days a schedule repeats on, which
 * kinds of row a list shows. The value's type follows the shape (`V | null`
 * versus `readonly V[]`), so a caller cannot pass a list to a single group by
 * accident: the shape is a property of the group rather than a mode the caller
 * has to keep in step with the value.
 *
 * ## Pressing the pressed item
 *
 * In `single`, pressing the item that is already pressed clears the selection
 * (`onChange(null)`) unless `deselectable` is false. That is the behaviour a
 * filter row needs — clearing "Archived" is a real wish — and a group that cannot
 * clear cannot express it at all; a group whose only state is one of its items
 * has no way to say "all of them". A caller that does need the item held down (a
 * radio-like group acting as a form field) sets `deselectable={false}`.
 *
 * In `multiple`, pressing toggles that one item and leaves the rest alone, and
 * clearing everything is just pressing each pressed item.
 *
 * ## Arrow keys move focus, they do not choose
 *
 * This is the toolbar rule and it is deliberate: arrowing *through* a row of
 * alignment buttons should not reformat the page three times on the way. Enter
 * and Space press the focused item, exactly as they would on any button. The
 * stop follows the pressed item, which is what lets a reader Tab into the row,
 * arrow around, Tab out, and come back to where they were.
 *
 * ## Attached
 *
 * `attached` joins the buttons into one segmented frame — the shape a control
 * takes when the alternatives are one axis rather than several actions
 * (day / week / month). The buttons lose their own outer corners and the seam
 * between two of them is drawn once instead of twice, so the row reads as one
 * control with several answers rather than a run of neighbouring buttons.
 */

import { useRef, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { uiClass } from '../styles/inject.js'
import {
  ToggleView,
  type ToggleActiveVariant,
  type ToggleSize,
  type ToggleVariant,
} from './toggle.js'

/** Which way the row runs. It chooses the arrow keys' axis, not just the layout. */
export type ToggleGroupOrientation = 'horizontal' | 'vertical'

/** The fields every button in a {@link ToggleGroup} carries. */
interface ToggleGroupItemBase<Value extends string> {
  /** The value the group reports while this button is pressed. */
  readonly value: Value
  /** Optional leading 16px icon node, drawn before the label. */
  readonly icon?: ReactNode
  /** Whether this one button refuses input. */
  readonly disabled?: boolean
  /** Localized hover text, typically why the button is locked. */
  readonly title?: string
}

/**
 * One button in a {@link ToggleGroup}, named one way or the other.
 *
 * A labelled button takes its name from its text. An icon-only button has to
 * say its name, because a `<button>` whose only child is a decorative 16px glyph
 * announces as "button", pressed or not — and an unnamed button in a group is
 * worse than a standalone one, since the group's own name is all the reader
 * hears around it.
 */
export type ToggleGroupItem<Value extends string = string> =
  & ToggleGroupItemBase<Value>
  & (
    | {
        /** The visible label. */
        readonly label: string
        /** An accessible name, when the visible label is not the whole story. */
        readonly ariaLabel?: string
      }
    | {
        readonly label?: undefined
        /** The accessible name of an icon-only button. */
        readonly ariaLabel: string
      }
  )

/** The props both group shapes share. */
interface ToggleGroupCommonProps<Value extends string> {
  /** The buttons in display order. */
  readonly items: readonly ToggleGroupItem<Value>[]
  /** The accessible name of the group, owned by the render site. */
  readonly label: string
  /**
   * The buttons' height, and with it the radius and the type size.
   *
   * @default 'md'
   */
  readonly size?: ToggleSize
  /**
   * How an unpressed button looks.
   *
   * @default 'ghost'
   */
  readonly variant?: ToggleVariant
  /**
   * How a pressed button looks.
   *
   * @default 'soft'
   */
  readonly activeVariant?: ToggleActiveVariant
  /**
   * Draw every button as a square.
   *
   * The right answer for a row of glyphs: a labelled button's horizontal
   * padding around a 16px icon reads as a wide box holding a small mark.
   *
   * @default false
   */
  readonly square?: boolean
  /**
   * Which way the row runs.
   *
   * It moves the arrow keys' axis and the layout. Both axes answer keys either
   * way: a vertical row that ignored Left/Right would break for a reader who
   * reached it from a horizontal toolbar.
   *
   * @default 'horizontal'
   */
  readonly orientation?: ToggleGroupOrientation
  /**
   * The role the row announces itself as.
   *
   * `group` is the honest container for a set of switches — a filter row, the
   * days a schedule repeats on — and it is what the group defaults to. `toolbar`
   * is for a row that really is a toolbar (a formatting bar); the role is also
   * what makes `aria-orientation` a legal attribute, so it is written only for
   * that role. A `group` that carried it would be announcing a property the
   * platform ignores.
   *
   * @default 'group'
   */
  readonly role?: 'group' | 'toolbar'
  /**
   * Join the buttons into one segmented frame.
   *
   * @default false
   */
  readonly attached?: boolean
  /** Whether every button refuses input. */
  readonly disabled?: boolean
  /**
   * Whether the arrow keys wrap at the ends of the row.
   *
   * @default true
   */
  readonly loop?: boolean
  /** Extra class for layout placement. */
  readonly className?: string
}

/** A group that holds one value or none. */
export interface ToggleGroupSingleProps<Value extends string = string> extends ToggleGroupCommonProps<Value> {
  /**
   * One value at a time.
   *
   * @default 'single'
   */
  readonly type?: 'single'
  /** The value pressed now, or null while nothing is. */
  readonly value: Value | null
  /** Receive the value a press asks for, or null when the press cleared it. */
  readonly onChange: (next: Value | null) => void
  /**
   * Whether pressing the pressed button clears the group.
   *
   * @default true
   */
  readonly deselectable?: boolean
}

/** A group that holds any number of values. */
export interface ToggleGroupMultipleProps<Value extends string = string> extends ToggleGroupCommonProps<Value> {
  /** Several values at once. */
  readonly type: 'multiple'
  /** The values pressed now, in any order. */
  readonly value: readonly Value[]
  /** Receive the values a press asks for. */
  readonly onChange: (next: Value[]) => void
}

/** What {@link ToggleGroup} takes. */
export type ToggleGroupProps<Value extends string = string> =
  | ToggleGroupSingleProps<Value>
  | ToggleGroupMultipleProps<Value>

/** How far each arrow key steps through the row. */
const STEP: Readonly<Record<string, 1 | -1>> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
}

/**
 * The index of the nearest enabled button one step away.
 *
 * @param buttons - the rendered buttons in display order.
 * @param from - the index the walk starts at.
 * @param step - which way to walk.
 * @param loop - whether the walk wraps at the ends.
 * @returns the index to focus, or `from` when no other button can take it.
 */
function walk(
  buttons: readonly (HTMLButtonElement | null)[],
  from: number,
  step: 1 | -1,
  loop: boolean,
): number {
  const count = buttons.length
  for (let offset = 1; offset < count; offset += 1) {
    const candidate = from + step * offset
    // Without wrapping the walk stops at the end of the row instead of crossing
    // to the other side, so the arrow that runs out of buttons does nothing.
    if (!loop && (candidate < 0 || candidate >= count)) return from
    const index = ((candidate % count) + count) % count
    if (buttons[index]?.disabled !== true) return index
  }
  return from
}

/**
 * The index of the first enabled button, walking from one end of the row.
 *
 * @param buttons - the rendered buttons in display order.
 * @param fromEnd - start at the far end instead of the near one.
 * @returns the index to focus, or -1 when every button is disabled.
 */
function edge(buttons: readonly (HTMLButtonElement | null)[], fromEnd: boolean): number {
  const count = buttons.length
  for (let offset = 0; offset < count; offset += 1) {
    const index = fromEnd ? count - 1 - offset : offset
    if (buttons[index]?.disabled !== true) return index
  }
  return -1
}

/**
 * Render a group of toggle buttons.
 *
 * @param props - the buttons, which shape the group holds, and the current value.
 * @returns the group element with its buttons.
 */
export function ToggleGroup<Value extends string = string>(props: ToggleGroupProps<Value>): ReactElement {
  const {
    items,
    label,
    size,
    variant,
    activeVariant,
    square,
    orientation = 'horizontal',
    role = 'group',
    attached = false,
    disabled = false,
    loop = true,
    className,
  } = props
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  /** Whether one button is pressed in the group's current shape. */
  const pressed = (value: Value): boolean =>
    props.type === 'multiple' ? props.value.includes(value) : props.value === value

  /** Whether a press may land on one button at all. */
  const refuses = (item: ToggleGroupItem<Value>): boolean => disabled || item.disabled === true

  /** Report the value one press asks for. */
  const press = (value: Value): void => {
    if (props.type === 'multiple') {
      props.onChange(
        props.value.includes(value) ? props.value.filter(item => item !== value) : [...props.value, value],
      )
      return
    }
    if (props.value !== value) {
      props.onChange(value)
      return
    }
    // Pressing the pressed item: a filter row needs to clear, a form field must
    // not. The caller says which this is.
    if (props.deselectable ?? true) props.onChange(null)
  }

  // One tab stop for the row: the pressed button, or the first enabled one while
  // nothing is pressed. A pressed button that is itself disabled cannot hold the
  // stop, because a disabled button takes no focus.
  const pressedIndex = items.findIndex(item => pressed(item.value) && !refuses(item))
  const stopIndex = pressedIndex >= 0 ? pressedIndex : items.findIndex(item => !refuses(item))

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const current = buttons.current.indexOf(event.target as HTMLButtonElement)
    if (current < 0) return
    if (event.key === 'Home' || event.key === 'End') {
      const index = edge(buttons.current, event.key === 'End')
      if (index < 0) return
      event.preventDefault()
      if (index !== current) buttons.current[index]?.focus()
      return
    }
    const step = STEP[event.key]
    if (step === undefined) return
    // The press keys are left to the button: Enter and Space already activate a
    // `<button>`, and re-implementing that here would fire the press twice.
    event.preventDefault()
    const next = walk(buttons.current, current, step, loop)
    if (next !== current) buttons.current[next]?.focus()
  }

  return (
    <div
      role={role}
      aria-label={label}
      // Only a toolbar may state its orientation; on a plain group the
      // attribute is ignored, so writing it there would be a promise the
      // accessibility tree does not keep.
      aria-orientation={role === 'toolbar' ? orientation : undefined}
      aria-disabled={disabled || undefined}
      className={className === undefined || className === '' ? uiClass('toggle-group') : `${uiClass('toggle-group')} ${className}`}
      data-orientation={orientation}
      data-size={size ?? 'md'}
      data-attached={attached ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      onKeyDown={onKeyDown}
    >
      {items.map((item, index) => (
        <ToggleView
          key={item.value}
          ref={(node) => {
            buttons.current[index] = node
          }}
          pressed={pressed(item.value)}
          onToggle={() => { press(item.value) }}
          icon={item.icon}
          size={size}
          variant={variant}
          activeVariant={activeVariant}
          square={square}
          disabled={refuses(item)}
          title={item.title}
          aria-label={item.ariaLabel}
          // A roving stop: exactly one button is reachable with Tab, and the
          // arrows move focus within the row from there.
          tabIndex={index === stopIndex ? 0 : -1}
          data-value={item.value}
        >
          {item.label}
        </ToggleView>
      ))}
    </div>
  )
}
