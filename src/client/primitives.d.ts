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
  import type { ReactElement, ReactNode } from 'react'

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
}
