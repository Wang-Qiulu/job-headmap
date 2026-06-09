import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Tauri-friendly Vite config:
// - base: './'        webview loads dist/ via custom protocol; relative paths are required
// - open: false       avoid double window (browser + webview) when running `tauri dev`
// - strictPort: true  Tauri waits for devUrl; fail fast on port collision instead of silent fallback
// - clearScreen:false keep Vite logs visible alongside Rust logs in the same terminal
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  clearScreen: false,
  server: {
    port: 5173,
    open: false,
    strictPort: true,
  },
})
