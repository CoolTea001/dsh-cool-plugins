import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // The catalog is its own page under `catalog/`; it is not part of the package API.
  root: fileURLToPath(new URL('./catalog', import.meta.url)),
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
