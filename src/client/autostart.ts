/**
 * The page-load half of Command autostart.
 *
 * A console normally gets its PTY only when its row is selected, because the
 * terminal tab is rendered lazily. That is too late for a command that should
 * already be running after DSH opens, so this runner asks the Host for a shell
 * for every console whose autostart switch is on. The Host buffers the output;
 * opening the terminal later attaches to the same shell and replays it.
 *
 * It is deliberately fired from the client plugin's `apply`, not from the View:
 * `apply` runs when the web page boots, while the View exists only while the
 * Terminal tab is selected. The Host keys sessions by console id, so this can
 * race the View's own open without spawning a second shell or running the
 * command twice — only `spawn` injects, and only one spawn wins.
 *
 * The session-bound group is skipped: its directory comes from the session
 * that opened the tab, and there is no session id at page boot. Its command
 * still runs when that console is first opened, through the normal open path.
 */

import { openTerminal } from './api.js'
import { readGeometry } from './geometry.js'
import { loadAccount, SESSION_KEY, startupCommand } from './terminals.js'

/**
 * Start every console whose command autostart is enabled.
 *
 * Failures (a workspace deleted since the account was written, a Host without
 * the subprocess seam) are intentionally quiet here: there is no terminal on
 * screen to show them in, and the next manual open reports the same failure in
 * the console's own scrollback.
 */
export function startAutostartConsoles(): void {
  const account = loadAccount()
  for (const [groupKey, terminals] of Object.entries(account)) {
    if (groupKey === SESSION_KEY) continue
    for (const terminal of terminals) {
      const command = startupCommand(terminal)
      if (command === undefined) continue
      const geometry = readGeometry(terminal.id)
      void openTerminal(undefined, groupKey, geometry.cols, geometry.rows, terminal.id, command)
    }
  }
}
