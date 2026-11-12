/**
 * The Host primitives this package borrows.
 *
 * The Web loader seeds `@deepseek-ai/dsh-client-ui-primitives` before any plugin
 * bundle runs, so the client half resolves this as an external module at runtime
 * (tsdown lists it in `neverBundle`). The package is not a dependency of this
 * checkout, so the narrow surface used here is declared locally instead of
 * pulling the whole Host component library into the build.
 */

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ReactElement, ReactNode, RefObject } from 'react'

  /** The dialog chrome: portaled card, blurred mask, focus trap, Escape handling. */
  export interface ModalProps {
    readonly open: boolean
    readonly onClose: () => void
    readonly title: string
    readonly description?: string
    readonly closeLabel: string
    readonly children?: ReactNode
    readonly footer?: ReactNode
    readonly className?: string
    readonly contentClassName?: string
  }

  export function Modal(props: ModalProps): ReactElement | null

  /** The token-styled button atom. */
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    readonly variant?: 'primary' | 'ghost' | 'outline' | 'toolbar'
    readonly size?: 'md' | 'sm'
    readonly icon?: ReactNode
  }

  export function Button(props: ButtonProps): ReactElement

  /**
   * One labelled settings row: its own label, a bordered text input, and an
   * optional hint. `numeric` switches the input to a numeric keyboard while
   * keeping it a plain text field, so no browser spinner appears.
   */
  export interface SettingsValueFieldProps {
    readonly id: string
    readonly label: string
    readonly text: string
    readonly onEdit: (text: string) => void
    readonly numeric?: boolean
    readonly placeholder?: string
    readonly disabled?: boolean
    readonly invalid?: boolean
    readonly invalidLabel?: string
    readonly hint?: string
  }

  export function SettingsValueField(props: SettingsValueFieldProps): ReactElement
  /**
   * The chip atom: an inline label, or a toggle chip when `onClick` is given
   * (it then renders a `<button>` with `active` as its selected state).
   */
  export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    readonly active?: boolean
  }

  export function Pill(props: PillProps): ReactElement

  /** The read-only metadata label. */
  export interface TagProps {
    readonly tone?: 'outline' | 'solid' | 'neutral' | 'quiet'
    readonly className?: string
    readonly children?: ReactNode
  }

  export function Tag(props: TagProps): ReactElement

  /** One selectable row of a {@link Menu}'s list. */
  export interface MenuItem {
    readonly id: string
    readonly label: ReactNode
    readonly icon?: ReactNode
    readonly disabled?: boolean
  }

  /** A hairline between two runs of rows; not selectable. */
  export interface MenuSeparator {
    readonly type: 'separator'
    readonly id: string
  }

  /** A caption inside the list, for a state the rows cannot state themselves. */
  export interface MenuLabel {
    readonly type: 'label'
    readonly id: string
    readonly text: string
  }

  /** One menu entry: a row, a separator, or a caption. */
  export type MenuEntry = MenuItem | MenuSeparator | MenuLabel

  /** Anchored dropdown menu (the subset this plugin uses). */
  export interface MenuProps {
    readonly open: boolean
    /** The trigger element, rendered in place inside the menu's own wrapper. */
    readonly anchor: ReactNode
    /** Selectable rows and separators, in the order the list draws them. */
    readonly items?: readonly MenuEntry[]
    /** Row activation; closing the list stays the owner's decision. */
    readonly onSelect?: (id: string) => void
    /** The row id drawn as the current choice. */
    readonly selectedId?: string
    /** Outside click, Escape, or focus loss. */
    readonly onClose: () => void
    readonly align?: 'start' | 'end'
    readonly side?: 'bottom' | 'top' | 'right'
    /** Render the list into `document.body`, escaping ancestor clipping. */
    readonly portal?: boolean
    /** Extra class on the anchor wrapper span. */
    readonly className?: string
    /** Extra class on the dropdown card; the only hook that reaches a portaled list. */
    readonly listClassName?: string
  }

  export function Menu(props: MenuProps): ReactElement

  /**
   * Put a panel on the platform's modal layer stack: Escape closes it before the
   * dialog under it, Tab stays inside it, and focus returns to the anchor.
   */
  export function useModalLayer(panelRef: RefObject<HTMLElement | null>, open: boolean, onClose: () => void): void
}
