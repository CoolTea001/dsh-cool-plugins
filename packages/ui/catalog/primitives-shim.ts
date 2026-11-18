/**
 * The shell's barrel, cut down to the one control this package reaches for.
 *
 * `src/input.tsx` imports `Input` from `@deepseek-ai/dsh-client-ui-primitives`,
 * and it has to: in a plugin bundle that specifier is answered by the page's
 * module table, so rewriting it to a deep path would describe a module the
 * product does not have. The catalog, however, runs that source in a browser
 * with no module table and no Shiki, KaTeX or Markdown pipeline installed — and
 * the barrel imports all of them.
 *
 * So the alias in `vite.config.ts` points the bare specifier here, and this file
 * answers it with the same component from the shell's own source. Nothing is
 * re-drawn: `Input` is the shell's `Input`, compiled from the file its barrel
 * compiles from. Only the module graph is smaller.
 *
 * Keep it to what the catalog actually loads. A name added here is a name the
 * preview can reach, and every one of them has to exist as a source file in the
 * shell's `./src/*` export.
 */

export { Input } from '@deepseek-ai/dsh-client-ui-primitives/src/Input.tsx'
