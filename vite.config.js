import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  build: {
    minify: false, // Disable minification to prevent 'api' from being renamed
    // Produce a single CSS file and JS file for easier manual embedding in Trilium
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})
