import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Resolve a source package's `.js` specifiers to the TypeScript file beside them.
 *
 * The packages in this repository import each other with the extension their
 * built output will carry — `./toggle.js`, `./styles/inject.js` — because
 * tsdown, not the browser, is what consumes them. No `.js` file exists next to
 * the source, so a resolver that runs the source directly has to undo the
 * substitution. The catalog is the one such consumer, which is why the mapping
 * lives here rather than in the packages: nothing else needs it, and changing
 * the specifiers would break the build the packages are written for.
 *
 * `enforce: 'pre'` matters: Vite's own resolver runs first otherwise and
 * reports the missing `.js` file as an error before this hook is asked.
 */
function sourceSpecifiers(): Plugin {
  return {
    name: 'dsh-cool-ui:catalog-source-specifiers',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer === undefined || !source.startsWith('.') || !source.endsWith('.js')) return null
      // Published packages are already the shape their own build produced.
      if (importer.includes('/node_modules/.pnpm/')) return null
      const base = resolve(dirname(importer), source.slice(0, -'.js'.length))
      for (const extension of ['.ts', '.tsx', '.js']) {
        if (existsSync(base + extension)) return base + extension
      }
      return null
    },
  }
}

export default defineConfig({
  // The catalog is its own page under `catalog/`; it is not part of the package API.
  root: fileURLToPath(new URL('./catalog', import.meta.url)),
  base: './',
  plugins: [sourceSpecifiers(), react()],
  resolve: {
    alias: [
      {
        // `src/input.tsx` imports the shell's barrel, which is right for a plugin
        // bundle — the page's module table answers that specifier — and wrong
        // here, because the barrel imports Shiki, KaTeX and the Markdown
        // pipeline. The shim answers the same specifier with the same control,
        // compiled from the same source file; see `catalog/primitives-shim.ts`.
        find: /^@deepseek-ai\/dsh-client-ui-primitives$/,
        replacement: fileURLToPath(new URL('./catalog/primitives-shim.ts', import.meta.url)),
      },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
