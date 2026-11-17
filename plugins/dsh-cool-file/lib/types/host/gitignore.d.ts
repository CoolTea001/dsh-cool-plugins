/**
 * Which listed children the workspace's own ignore rules leave out.
 *
 * A project's `.gitignore` is the author's statement about the tree: it says
 * which paths are generated, vendored, or private. The Files tab still lists
 * them — the tab shows what the disk holds — but a row the project has excluded
 * is drawn one step quieter, so the tree reads the way the repository does.
 *
 * The rules are Git's, so Git is what answers: `check-ignore` already resolves
 * the whole chain a hand-rolled matcher would have to reimplement — nested
 * `.gitignore` files, `.git/info/exclude`, the global excludes file, `.ignore`,
 * negations, and directory-only patterns — and it answers a whole level in one
 * run. A tracked file that happens to match a pattern is *not* ignored by Git,
 * and `check-ignore` reports exactly that without `--no-index`, which is the
 * reading wanted here: an entry the repository tracks is part of the project
 * whatever a pattern says.
 *
 * Like the hidden-mark probe, this is best-effort. A directory outside any
 * repository, a host without Git, and a run that fails all leave the level
 * undimmed rather than guessed at: a quieter row is a hint, and a hint is not
 * worth an error state or a second implementation of Git's matcher.
 */
/**
 * The names of one level that the workspace's ignore rules exclude.
 *
 * @param ctx - the Host plugin context.
 * @param directory - the absolute directory the listing answered for.
 * @param names - the level's child names, in listing order.
 * @returns the ignored names; empty when no rule, no repository, or no Git can answer.
 */
export declare function ignoredNames(ctx: any, directory: string, names: readonly string[]): Promise<ReadonlySet<string>>;
//# sourceMappingURL=gitignore.d.ts.map