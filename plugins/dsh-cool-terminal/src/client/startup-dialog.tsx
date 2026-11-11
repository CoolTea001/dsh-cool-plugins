/**
 * The per-console Command autostart dialog.
 *
 * Opened from a console row's overflow menu, it edits two things that live on
 * that console's `TerminalDef`: the shell text to run, and whether it should
 * also run when DSH opens rather than waiting for the console to be shown.
 *
 * The draft is local to this component, which is mounted fresh for every
 * opening. Keeping it here means typing a command re-renders only the dialog —
 * not the sidebar, the consoles, and every xterm they hold.
 */

import * as React from 'react'
import { Button, Input, Modal, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from './locales.js'

const h = React.createElement

interface StartupDialogProps {
  /** The saved command when the dialog opens, or an empty string. */
  readonly command: string
  /** The saved auto-run state when the dialog opens. */
  readonly autoRun: boolean
  /** Translator for every string this dialog renders. */
  readonly t: Translate
  onClose: () => void
  /** Report the edited pair; the owner persists it and closes the dialog. */
  onSave: (command: string, autoRun: boolean) => void
}

/**
 * Render the Command autostart dialog.
 * @param props - saved values, copy, and the close/save commands.
 * @returns the modal.
 */
export function StartupDialog(props: StartupDialogProps): React.ReactElement {
  const { command: savedCommand, autoRun: savedAutoRun, t, onClose, onSave } = props
  const [command, setCommand] = React.useState(savedCommand)
  const [autoRun, setAutoRun] = React.useState(savedAutoRun)

  const commit = (): void => {
    onSave(command, autoRun)
  }

  return h(Modal, {
    open: true,
    onClose,
    title: t('terminal.startup'),
    closeLabel: t('terminal.close'),
    description: t('terminal.startupDescription'),
    className: 'dsh-ct-startup-dialog',
    footer: h(React.Fragment, null,
      h(Button, {
        key: 'cancel',
        variant: 'outline',
        onClick: onClose,
      }, t('terminal.cancel')),
      h(Button, {
        key: 'save',
        variant: 'primary',
        onClick: commit,
      }, t('terminal.save')),
    ),
  },
    h('div', { key: 'command', className: 'dsh-ct-startup-field' },
      h('span', { key: 'label', className: 'dsh-ct-startup-label' }, t('terminal.startupCommand')),
      h(Input, {
        key: 'input',
        className: 'dsh-ct-startup-input',
        value: command,
        placeholder: t('terminal.startupPlaceholder'),
        spellCheck: false,
        'aria-label': t('terminal.startupCommand'),
        // The Modal layer looks for this instead of React's autoFocus, so the
        // control that opened the dialog still gets focus back on close.
        'data-modal-autofocus': true,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => setCommand(event.target.value),
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) commit()
        },
      }),
    ),
    h('div', { key: 'auto', className: 'dsh-ct-startup-auto' },
      h('span', { key: 'label', className: 'dsh-ct-startup-label' }, t('terminal.startupAutoRun')),
      h(Switch, {
        key: 'switch',
        checked: autoRun,
        label: t('terminal.startupAutoRun'),
        onChange: setAutoRun,
      }),
    ),
  )
}
