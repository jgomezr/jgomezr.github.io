import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En GitHub Pages el sitio vive en /nombre-repo/. El workflow de deploy pasa
// VITE_BASE=/nombre-repo/; en local y en hosts servidos desde la raíz queda en '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Feed de Conocimiento',
        short_name: 'Feed',
        description: 'Feed de tarjetas de conocimiento: ciencia, filosofía y tecnología',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0E0E10',
        background_color: '#0E0E10',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,wasm}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  worker: {
    format: 'es',
  },
})
