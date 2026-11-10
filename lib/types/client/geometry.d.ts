/**
 * Per-console terminal geometry remembered across page loads.
 *
 * A console that autostarts while DSH is opening has no visible xterm to
 * measure, yet the Host must pick a PTY size at spawn. Remembering the size
 * the console was last fitted to gives that background shell a plausible
 * geometry; when the terminal tab opens, the View measures itself again and
 * the Host resizes the existing session, so the remembered value is only a
 * starting point.
 *
 * The values mirror the Host's own bounds (all of which it clamps again on
 * arrival), so a hand-edited entry cannot ask for a zero-column PTY.
 */
/** One terminal's fitted character grid. */
export interface ConsoleGeometry {
    readonly cols: number;
    readonly rows: number;
}
/**
 * The last fitted size for one console.
 * @param id - console id.
 * @returns its remembered geometry, or the fallback when there is none.
 */
export declare function readGeometry(id: string): ConsoleGeometry;
/**
 * Remember one console's fitted size.
 *
 * Storage failures are not worth surfacing: the next launch simply falls back
 * to a default pane instead of the last one.
 *
 * @param id - console id.
 * @param cols - fitted column count.
 * @param rows - fitted row count.
 */
export declare function writeGeometry(id: string, cols: number, rows: number): void;
//# sourceMappingURL=geometry.d.ts.map