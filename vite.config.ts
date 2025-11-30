import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    UnoCSS(),
    nodePolyfills({
      globals: {
        process: true,
        Buffer: true,
      }
    })
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  define: {
    'process.env': {},
  },
})