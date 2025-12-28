import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Vercel deploy için base path - root domain için '/'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Tüm CSS'i tek bir dosyada topla
    cssCodeSplit: false,
    // Sourcemap'i devre dışı bırak (production için)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Asset dosyaları (CSS, images, vb.) için standard format
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
