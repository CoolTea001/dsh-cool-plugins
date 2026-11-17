/**
 * Which listed children the host platform itself treats as hidden.
 *
 * A dot-prefixed name is the POSIX convention, and it is the only "hidden" mark
 * a plain directory read carries: neither Node's dirents nor the filesystem
 * service's listing exposes a platform visibility bit, so a name has to be
 * judged here rather than read off the entry. Two judgements are combined — the
 * convention, and a probe of the platform's own hidden mark — and the union is
 * what the page filters on:
 *
 * - Linux and every other system with no attribute to ask about: a leading `.`
 *   is the convention, and it is the whole answer.
 * - macOS: the Finder's invisible mark is the `UF_HIDDEN` flag (which is also
 *   what `chflags hidden` and `SetFile -a V` set), and it is not part of a
 *   `readdir` answer. One `find -flags hidden` over the listed level reports
 *   those names.
 * - Windows: the hidden attribute is `FILE_ATTRIBUTE_HIDDEN`, which dirents drop
 *   as well; `attrib` reports it per child.
 *
 * The probe is best-effort by construction. A host without a process substrate,
 * a platform with no attribute worth asking about, and a probe that exits
 * non-zero all leave the convention in charge, so the page never draws a folder
 * differently just because a helper process could not run. Nothing here throws:
 * a visibility hint is not worth failing a listing over.
 */
/**
 * Whether a name carries the POSIX hidden mark.
 *
 * @param name - the basename of one listed child.
 * @returns true for a dot-prefixed name.
 */
export declare function isHiddenName(name: string): boolean;
/**
 * The names of one directory level that the platform itself marks hidden.
 *
 * @param ctx - the Host plugin context.
 * @param directory - the absolute directory the listing answered for.
 * @returns the hidden basenames; empty when no probe can answer.
 */
export declare function platformHiddenNames(ctx: any, directory: string): Promise<ReadonlySet<string>>;
//# sourceMappingURL=hidden.d.ts.map