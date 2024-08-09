import { defineConfig } from 'vite'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'viewcube',
      fileName: 'viewcube'
    },
    minify: false
  },
  plugins: [peerDepsExternal()]
})
