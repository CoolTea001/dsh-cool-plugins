/**
 * Client entry for dsh-cool-file.
 *
 * Contributes exactly one 'conversation.view' entry, which is what turns into
 * a tab in the session's tab bar. The page reads the session's workspace over
 * this package's own same-origin routes (see the Host half), so there are no
 * optional collaborators here. The shell's composer seat is taken out while
 * this tab is mounted, the same way the Terminal and Git tabs do it.
 *
 * The tab's copy enters through the locale service, which owns the active
 * language and re-renders this entry when it changes: the dictionaries are
 * registered here, the slot entry declares the namespace it reads, and the
 * framework hands the rendered View the `t` seat bound to it.
 */
export declare const name = "dsh-cool-file/client";
/**
 * The locale service is a required collaborator rather than an optional one:
 * the tab is worded entirely from its dictionaries, so a composition without
 * the service could only draw the wrong language.
 */
export declare const inject: string[];
export declare function apply(ctx: any): void;
//# sourceMappingURL=index.d.ts.map