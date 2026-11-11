/**
 * Simplified Chinese dictionary — the key-set source of truth.
 *
 * Every other dictionary is typed against `TerminalKey`, which is derived from
 * this file. Adding a key here makes every other dictionary fail to compile
 * until it is translated too, which is the point: a missing translation is a
 * build error, not a key name shown to the user.
 */
export declare const zh: {
    'view.tab': string;
    'sidebar.session': string;
    'sidebar.empty': string;
    'sidebar.new': string;
    'main.hint': string;
    'terminal.rename': string;
    'terminal.remove': string;
    'terminal.removeTitle': string;
    'terminal.removeWarning': string;
    'terminal.startup': string;
    'terminal.startupDescription': string;
    'terminal.startupCommand': string;
    'terminal.startupPlaceholder': string;
    'terminal.startupAutoRun': string;
    'terminal.save': string;
    'terminal.close': string;
    'terminal.cancel': string;
    'terminal.more': string;
    'terminal.input': string;
    'terminal.ended': string;
    'terminal.exitCode': string;
    'terminal.signal': string;
    'terminal.unknown': string;
    'terminal.startFailed': string;
    'terminal.endedBanner': string;
    'terminal.reason.outputFailed': string;
    'commands.title': string;
    'commands.description': string;
    'commands.search': string;
    'commands.searchLabel': string;
    'commands.add': string;
    'commands.bodyPlaceholder': string;
    'commands.descriptionPlaceholder': string;
    'commands.noDescription': string;
    'commands.empty': string;
    'commands.noMatch': string;
    'commands.insertHint': string;
    'commands.noActiveTerminal': string;
    'commands.edit': string;
    'commands.copy': string;
    'commands.remove': string;
    'commands.copied': string;
    'commands.cancel': string;
    'commands.save': string;
    'commands.close': string;
    'completion.footer': string;
};
//# sourceMappingURL=zh.d.ts.map