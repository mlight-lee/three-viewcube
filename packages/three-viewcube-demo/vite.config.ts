import { resolve } from 'path'
import { defineConfig, Alias } from 'vite'

export default defineConfig(({ command }) => {
  const aliases: Alias[] = []
  if (command === 'serve') {
    aliases.push({
      find: '@mlightcad/three-viewcube', 
      replacement: resolve(__dirname, '../three-viewcube/src')
    })
  }
  return {
    resolve: {
      alias: aliases
    },
    build: {
      outDir: 'dist'
    }
  }
})
