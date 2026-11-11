/** Input and timing for a command injected into a freshly spawned shell. */
/** Normalize a persisted command and cap the input one request may queue. */
export declare function normalizeStartupCommand(value: unknown): string;
/** The output-listener subset of the subprocess terminal primitive. */
export interface StartupOutput {
    on(event: 'data', listener: (chunk: unknown) => void): unknown;
    removeListener?(event: 'data', listener: (chunk: unknown) => void): unknown;
}
/**
 * Wait for shell readiness, inject once, and release every owned resource.
 *
 * Writing immediately after spawn races shell startup: zsh and bash install
 * their line editors only after their startup files run, and earlier input may
 * be echoed above the prompt or flushed. Their bracketed-paste marker allows a
 * short grace; other shells use a longer output silence. A deadline covers a
 * shell that emits nothing. Both timers are unref'd.
 */
export declare class StartupCommand {
    private readonly output;
    private readonly command;
    private readonly write;
    private quiet;
    private deadline;
    private listener;
    private finished;
    private ready;
    /** A short suffix lets a marker split across output chunks still match. */
    private tail;
    constructor(output: StartupOutput | undefined, command: string, write: (command: string) => void);
    /** Begin waiting; the caller invokes `cancel` when the shell ends. */
    start(): void;
    /** Stop waiting without injecting, e.g. when the shell exits or is deleted. */
    cancel(): void;
    private settle;
    private fire;
    private finish;
}
//# sourceMappingURL=startup.d.ts.map