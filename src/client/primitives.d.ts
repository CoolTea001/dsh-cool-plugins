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
  import type { InputHTMLAttributes, ReactElement, ReactNode } from 'react'

  /** The menu row primitive: one `role="menuitem"` button with Host styling. */
  export interface MenuItemButtonProps {
    readonly children?: ReactNode
    readonly icon?: ReactNode
    readonly shortcut?: unknown
    readonly separatorBefore?: boolean
    readonly disabled?: boolean
    readonly onSelect?: () => void
  }

  export function MenuItemButton(props: MenuItemButtonProps): ReactElement

  /** The Host's outline trash glyph, used by the native Session menu. */
  export function IconTrashOutlineRegular(props: { readonly size?: number }): ReactElement

  /** One selectable dropdown row, optionally opening a nested card. */
  export interface MenuItem {
    readonly id: string
    readonly label: ReactNode
    readonly disabled?: boolean
    readonly icon?: ReactNode
    readonly danger?: boolean
    readonly submenu?: readonly MenuItem[]
  }

  /** A hairline between menu groups. */
  export interface MenuSeparator {
    readonly type: 'separator'
    readonly id: string
  }

  /** A non-interactive heading above a group. */
  export interface MenuLabel {
    readonly type: 'label'
    readonly id: string
    readonly text: string
  }

  /** One primary-menu entry: a row, a separator, or a heading label. */
  export type MenuEntry = MenuItem | MenuSeparator | MenuLabel

  /** The anchored dropdown card, with the same selection and keyboard rules as the product. */
  export interface MenuProps {
    readonly open: boolean
    readonly anchor: ReactNode
    readonly items?: readonly MenuEntry[]
    readonly children?: ReactNode
    readonly footer?: readonly MenuEntry[]
    readonly selectedId?: string | undefined
    readonly selectedIds?: readonly string[] | undefined
    readonly onSelect?: (id: string) => void
    readonly onClose: () => void
    readonly align?: 'start' | 'end'
    readonly side?: 'bottom' | 'top' | 'right'
    readonly portal?: boolean
    readonly closeOnPointerLeave?: boolean
    readonly dense?: boolean
    readonly compact?: boolean
    readonly autoFocus?: boolean
    readonly selection?: 'check' | 'fill'
    readonly className?: string | undefined
    readonly listClassName?: string | undefined
  }

  export function Menu(props: MenuProps): ReactElement

  /** The shared dialog: body portal, blurred mask, focus trap, and Escape close. */
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
    readonly headless?: boolean
  }

  export function Modal(props: ModalProps): ReactElement

  /** The shared button atom, so the dialog's actions keep the product styling. */
  export interface ButtonProps {
    readonly variant?: 'primary' | 'ghost' | 'outline' | 'toolbar'
    readonly size?: 'md' | 'sm'
    readonly disabled?: boolean
    readonly className?: string
    readonly onClick?: () => void
    readonly children?: ReactNode
    readonly 'data-modal-autofocus'?: boolean | string
  }

  export function Button(props: ButtonProps): ReactElement

  /** Single-line text input with an optional 16px leading glyph. */
  export function Input(
    props: { readonly icon?: ReactNode; readonly className?: string } & InputHTMLAttributes<HTMLInputElement>,
  ): ReactElement

  /** Controlled native checkbox with a visible label the caller supplies. */
  export interface CheckboxProps {
    readonly checked: boolean
    readonly onChange: (next: boolean) => void
    readonly label: string
    readonly disabled?: boolean
    readonly title?: string
    readonly className?: string
  }

  export function Checkbox(props: CheckboxProps): ReactElement
}
